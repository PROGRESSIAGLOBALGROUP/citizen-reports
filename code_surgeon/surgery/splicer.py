from __future__ import annotations
import re
from dataclasses import dataclass
from typing import Optional
from pathlib import Path
from .utils import read_text, write_text, unified_diff, backup_file, restore_file, normalize_indent

@dataclass
class SpliceResult:
    ok: bool
    diff: str
    message: str
    backup_path: Path

def detect_base_indent(mid: str) -> str:
    for line in mid.splitlines():
        if line.strip():
            return line[:len(line)-len(line.lstrip(' '))]
    return ""

def splice_fragment(path: Path, pre: str, mid: str, post: str, new_fragment: str, keep_indent: bool = True) -> SpliceResult:
    original = read_text(path)
    backup = backup_file(path)
    base_indent = detect_base_indent(mid) if keep_indent else ""
    if keep_indent:
        new_fragment = normalize_indent(new_fragment, base_indent)
    updated = "\n".join(x for x in [pre, new_fragment, post] if x is not None)
    diff = unified_diff(original, updated, fromfile=str(path), tofile=str(path))
    try:
        write_text(path, updated)
        return SpliceResult(True, diff, "Splice applied", backup)
    except Exception as e:
        restore_file(backup, path)
        return SpliceResult(False, "", f"Failed to write file: {e}", backup)
