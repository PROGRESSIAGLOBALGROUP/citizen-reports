from __future__ import annotations
import re, io, os, sys, json, hashlib, shutil, difflib
from pathlib import Path
from typing import Tuple, Optional, List

def read_text(p: Path) -> str:
    return p.read_text(encoding="utf-8")

def write_text(p: Path, content: str) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")

def sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def unified_diff(a: str, b: str, fromfile: str, tofile: str) -> str:
    return ''.join(difflib.unified_diff(a.splitlines(True), b.splitlines(True), fromfile=fromfile, tofile=tofile))

def backup_file(p: Path) -> Path:
    bak = p.with_suffix(p.suffix + ".bak")
    shutil.copy2(p, bak)
    return bak

def restore_file(src: Path, dst: Path) -> None:
    shutil.copy2(src, dst)

def find_line_numbers(text: str, pattern: str) -> List[int]:
    rx = re.compile(pattern)
    return [i for i, line in enumerate(text.splitlines(), 1) if rx.search(line)]

def slice_by_lines(text: str, start_line: int, end_line: int) -> Tuple[str, str, str]:
    lines = text.splitlines()
    pre = "\n".join(lines[:start_line-1])
    mid = "\n".join(lines[start_line-1:end_line])
    post = "\n".join(lines[end_line:])
    return pre, mid, post

def normalize_indent(fragment: str, base_indent: str) -> str:
    lines = fragment.splitlines()
    def leading_spaces(s: str) -> int:
        return len(s) - len(s.lstrip(' '))
    nonempty = [leading_spaces(l) for l in lines if l.strip()]
    min_indent = min(nonempty) if nonempty else 0
    out = []
    for l in lines:
        if l.strip():
            out.append(base_indent + l[min_indent:])
        else:
            out.append(l)
    return "\n".join(out)
