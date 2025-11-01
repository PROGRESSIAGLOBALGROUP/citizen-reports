import time, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JOBS = ROOT / "surgery" / "jobs"
APPLIED = ROOT / "surgery" / "applied"
FAILED = ROOT / "surgery" / "failed"
APPLIED.mkdir(parents=True, exist_ok=True)
FAILED.mkdir(parents=True, exist_ok=True)

SURGEON = ROOT / "code_surgeon" / "bin" / "code-surgeon.py"

def apply_job(job_path: Path):
    job = json.loads(job_path.read_text(encoding="utf-8"))
    args = [
        sys.executable, str(SURGEON),
        "--file", job["file"],
        "--mode", job["mode"],
        "--start", str(job["start"]),
        "--end", str(job["end"]),
        "--new-fragment", job["new_fragment_path"],
        "--keep-indent"
    ]
    if job.get("post_cmd"):
        args += ["--post-cmd", job["post_cmd"]]
    print(f"[JOB] Applying {job_path.name} ->", " ".join(args))
    p = subprocess.run(args, capture_output=True, text=True)
    out = (p.stdout or "") + (p.stderr or "")
    ok = ('"ok": true' in out)
    (APPLIED if ok else FAILED).joinpath(job_path.name).write_text(out, encoding="utf-8")
    job_path.unlink(missing_ok=True)
    print(("[OK] " if ok else "[FAIL] ") + job_path.name)

def main():
    print("[watch] Watching", JOBS)
    seen = set()
    while True:
        for j in JOBS.glob("*.json"):
            if j.name in seen:  # process once
                continue
            seen.add(j.name)
            apply_job(j)
        time.sleep(0.75)

if __name__ == "__main__":
    main()
