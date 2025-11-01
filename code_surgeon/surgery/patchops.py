from __future__ import annotations
import subprocess, shlex
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from .utils import backup_file, restore_file

@dataclass
class PostCheck:
    ok: bool
    output: str

def run_command(cmd: str, cwd: Optional[Path] = None, timeout: int = 120) -> PostCheck:
    try:
        p = subprocess.run(shlex.split(cmd), cwd=cwd, capture_output=True, text=True, timeout=timeout)
        ok = p.returncode == 0
        out = (p.stdout or "") + (p.stderr or "")
        return PostCheck(ok, out)
    except Exception as e:
        return PostCheck(False, f"ERROR: {e}")
