#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Final verification of migration
"""

import re
from pathlib import Path

protected = {
    'jantetelcodematamoros.gob.mx',
    'citizen-reports, Morelos',
    'github.com/progressiaglobalgroup/citizen-reports',
    'incendio forestal en el cerro de citizen-reports',
}

files_affected = {}

for ext in ['.ps1', '.js', '.md', '.sh', '.sql']:
    for f in Path('.').rglob(f'*{ext}'):
        if '.backup_' in str(f) or 'node_modules' in str(f):
            continue
        try:
            with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
                content = fp.read()
            
            lines = content.split('\n')
            for i, line in enumerate(lines, 1):
                if 'citizen-reports' in line.lower():
                    is_protected = any(p.lower() in line.lower() for p in protected)
                    if not is_protected:
                        key = f.name
                        if key not in files_affected:
                            files_affected[key] = []
                        files_affected[key].append((i, line.strip()[:80]))
        except:
            pass

if files_affected:
    print("Files with unprotected citizen-reports references:")
    for fname in sorted(files_affected.keys()):
        items = files_affected[fname]
        print(f"\n{fname}: {len(items)} occurrences")
        for line_num, content in items[:3]:
            print(f"  Line {line_num}: {content}")
else:
    print("SUCCESS: All citizen-reports references properly handled!")
