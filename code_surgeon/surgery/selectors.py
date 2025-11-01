from __future__ import annotations
import re
from dataclasses import dataclass
from typing import Optional, Tuple
from pathlib import Path
from .utils import read_text, slice_by_lines

@dataclass
class Selection:
    pre: str
    mid: str
    post: str
    start_line: int
    end_line: int

def select_by_line_range(path: Path, start_line: int, end_line: int) -> Selection:
    text = read_text(path)
    pre, mid, post = slice_by_lines(text, start_line, end_line)
    return Selection(pre, mid, post, start_line, end_line)

def select_by_regex_block(path: Path, start_pattern: str, end_pattern: str, include_markers: bool = True) -> Selection:
    text = read_text(path)
    start_rx = re.compile(start_pattern)
    end_rx = re.compile(end_pattern)
    lines = text.splitlines()
    start_idx = next((i for i,l in enumerate(lines) if start_rx.search(l)), None)
    if start_idx is None:
        raise ValueError("Start pattern not found")
    end_idx = next((i for i,l in enumerate(lines[start_idx+1:], start_idx+1) if end_rx.search(l)), None)
    if end_idx is None:
        raise ValueError("End pattern not found")
    s = start_idx+1
    e = end_idx+1 if include_markers else end_idx
    pre, mid, post = slice_by_lines(text, s, e)
    return Selection(pre, mid, post, s, e)
