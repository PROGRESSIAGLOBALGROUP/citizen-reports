
from __future__ import annotations
import argparse, subprocess, sys, re, json, ast
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent

def run_cmd(cmd: str) -> tuple[int, str]:
    p = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    out = (p.stdout or "") + (p.stderr or "")
    return p.returncode, out

TRACE_PATTERNS = [
    re.compile(r'File "([^"]+)", line (\d+), in ([^\n]+)'),
    re.compile(r'(?m)^\s*File\s+([^\s]+):(\d+)\s+in\s+([^\n]+)'),
    re.compile(r'(?m)^(.+?):(\d+)(?::\d+)?\b')
]

def extract_first_location(output: str) -> Optional[tuple[str,int]]:
    for rx in TRACE_PATTERNS:
        m = rx.search(output)
        if m:
            try:
                path = m.group(1)
                line = int(m.group(2))
                return path, line
            except Exception:
                continue
    return None

def detect_block_python(path: Path, line: int) -> tuple[int,int,str]:
    """Return (start_line, end_line, block_text) for enclosing function or method using AST."""
    src = path.read_text(encoding="utf-8")
    tree = ast.parse(src)
    best = None
    class Visitor(ast.NodeVisitor):
        def generic_visit(self, node):
            nonlocal best
            if hasattr(node, "lineno"):
                start = getattr(node, "lineno", None)
                end = getattr(node, "end_lineno", None)
                if start and end and start <= line <= end:
                    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        best = (start, end)
            super().generic_visit(node)
    Visitor().visit(tree)
    lines = src.splitlines()
    if best is None:
        s = max(1, line-5); e = min(len(lines), line+5)
        block = "\n".join(lines[s-1:e])
        return s, e, block
    s, e = best
    block = "\n".join(lines[s-1:e])
    return s, e, block

def detect_block_js_like(path: Path, line: int) -> tuple[int,int,str]:
    txt = path.read_text(encoding="utf-8")
    lines = txt.splitlines()
    n = len(lines)
    start = line
    sig_rx = re.compile(r'\b(function\b|\b[A-Za-z0-9_]+\s*\([^)]*\)\s*\{|\b[A-Za-z0-9_]+\s*=\s*\([^)]*\)\s*=>\s*\{|\bclass\b)')
    for i in range(line-1, 0, -1):
        if sig_rx.search(lines[i-1]):
            start = i
            break
    depth = 0
    end = line
    opened = False
    for i in range(start-1, n):
        depth += lines[i].count("{") - lines[i].count("}")
        if "{" in lines[i]:
            opened = True
        if opened and depth <= 0:
            end = i+1
            break
    if end < start:
        s = max(1, line-5); e = min(n, line+5)
        return s, e, "\n".join(lines[s-1:e])
    return start, end, "\n".join(lines[start-1:end])

def detect_block_generic(path: Path, line: int) -> tuple[int,int,str]:
    txt = path.read_text(encoding="utf-8")
    lines = txt.splitlines()
    s = max(1, line-5); e = min(len(lines), line+5)
    return s, e, "\n".join(lines[s-1:e])

def choose_detector(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in (".py",):
        return "python"
    if ext in (".js",".ts",".tsx",".jsx"):
        return "js"
    return "generic"

def main():
    ap = argparse.ArgumentParser(description="Auto-detect code block from failing command and prepare surgery job + prompt context.")
    ap.add_argument("--cmd", required=True, help="Command to run (e.g., 'pytest -q' or 'python -m py_compile path')")
    ap.add_argument("--post-cmd", default=None, help="Command to use later as verification (default: same as --cmd)")
    ap.add_argument("--out-fragment", default=str(ROOT / ".surgery" / "patches" / "auto_fragment.txt"), help="Where you will save the new fragment returned by the LLM")
    ap.add_argument("--job-name", default="auto_job.json", help="Job file name to create under surgery/jobs/")
    ap.add_argument("--constraints", default="", help="Optional constraints text to include in the LLM prompt")
    args = ap.parse_args()

    ret, out = run_cmd(args.cmd)
    if ret == 0:
        print("[auto-detect] Command succeeded; no failing location found.")
        print(out)
        sys.exit(0)
    loc = extract_first_location(out)
    if not loc:
        print("[auto-detect] Could not find file:line in output. Showing output:")
        print(out)
        sys.exit(2)
    path_str, line = loc
    p = Path(path_str).resolve()
    if not p.exists():
        print(f"[auto-detect] Path not found: {p}")
        sys.exit(3)

    detector = choose_detector(p)
    if detector == "python":
        s,e,block = detect_block_python(p, line)
        language = "python"
    elif detector == "js":
        s,e,block = detect_block_js_like(p, line)
        language = "javascript"
    else:
        s,e,block = detect_block_generic(p, line)
        language = "text"

    prompt_path = ROOT / "prompts" / "CONTEXT_FOR_COPILOT.md"
    prompt_text = f"""# CONTEXTO PARA LLM — FRAGMENTO ÚNICO (GENERAR SOLO EL BLOQUE)
Rol: Devuelve **solo** el fragmento final que sustituye el bloque objetivo. Prohibido: diffs, explicaciones, TODOs, mocks, imports fuera del bloque. Mantén la indentación del bloque.

- Lenguaje: {language}
- Firma/Contrato: (si aplica, incluir manualmente)
- Pruebas relevantes (breve): (resume la falla observada)
- Restricciones: {args.constraints}

Bloque original (líneas {s}-{e} de {p}):
```{language}
{block}
```

**Entrega:** únicamente el nuevo bloque listo para reemplazar al original.
"""
    prompt_path.write_text(prompt_text, encoding="utf-8")

    frag_path = Path(args.out_fragment)
    frag_path.parent.mkdir(parents=True, exist_ok=True)

    jobs_dir = ROOT / "surgery" / "jobs"
    jobs_dir.mkdir(parents=True, exist_ok=True)
    job = {
        "file": str(p),
        "mode": "line-range",
        "start": s,
        "end": e,
        "new_fragment_path": str(frag_path),
        "post_cmd": args.post_cmd or args.cmd
    }
    job_path = jobs_dir / args.job_name
    job_path.write_text(json.dumps(job, ensure_ascii=False, indent=2), encoding="utf-8")

    print("[auto-detect] Failure parsed.")
    print(f"[auto-detect] File:line -> {p}:{line}")
    print(f"[auto-detect] Detected block -> lines {s}-{e}")
    print(f"[auto-detect] Prompt context -> {prompt_path}")
    print(f"[auto-detect] Fragment placeholder -> {frag_path}")
    print(f"[auto-detect] Job ready -> {job_path}")
    print("[auto-detect] Next steps:")
    print("  1) Abre prompts/CONTEXT_FOR_COPILOT.md y pégalo en Copilot Chat para obtener el fragmento.")
    print(f"  2) Guarda el bloque devuelto exactamente en: {frag_path}")
    print("  3) Ejecuta el watcher (Run Task → 'surgery: watch jobs (auto-apply)') o aplica con tasks manuales.")

if __name__ == "__main__":
    main()
