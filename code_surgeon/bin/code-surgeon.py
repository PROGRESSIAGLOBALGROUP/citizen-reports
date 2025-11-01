#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, sys
from pathlib import Path
from surgery.runner import Plan, execute

def parse_args():
    ap = argparse.ArgumentParser(description="Fragment-only code splicer (safe surgeon).")
    ap.add_argument("--file", required=True, help="Target file to modify")
    ap.add_argument("--mode", required=True, choices=["line-range", "regex-block"])
    ap.add_argument("--start", required=True, help="Start line (int) or regex pattern")
    ap.add_argument("--end", required=True, help="End line (int) or regex pattern")
    ap.add_argument("--new-fragment", required=True, help="Path to file containing the new fragment")
    ap.add_argument("--post-cmd", default=None, help="Command to run after splicing (e.g., 'pytest -q')")
    ap.add_argument("--keep-indent", action="store_true", help="Preserve base indent of original block")
    ap.add_argument("--cwd", default=None, help="Working dir for post-cmd")
    return ap.parse_args()

def main():
    args = parse_args()
    plan = Plan(file=args.file, mode=args.mode, start=args.start, end=args.end,
                new_fragment_path=args.new_fragment, post_cmd=args.post_cmd)
    result = execute(plan, keep_indent=args.keep_indent, cwd=args.cwd)
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
