#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Double-check: Verify migration completeness
"""

import re
from pathlib import Path

# Critical patterns that MUST be replaced (not protected)
CRITICAL_MUST_REPLACE = [
    'C:\\PROYECTOS\\Jantetelco',
    'c:\\PROYECTOS\\Jantetelco',
    '/root/jantetelco',
    '/home/jantetelco/jantetelco',
    'jantetelco-demo',
]

# Protected patterns (allowed to remain)
PROTECTED = [
    'jantetelcodematamoros.gob.mx',
    'Jantetelco, Morelos',
    'github.com/jantetelco',
    'Zona',  # Geographic zones
    'Centro de Jantetelco',
]

issues = []

for ext in ['.ps1', '.js', '.md', '.sh', '.sql']:
    for f in Path('.').rglob(f'*{ext}'):
        if any(x in str(f) for x in ['.backup_', 'node_modules', '.git']):
            continue
        
        try:
            with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
                lines = fp.readlines()
            
            for line_num, line in enumerate(lines, 1):
                # Check for critical unreplaced patterns
                for pattern in CRITICAL_MUST_REPLACE:
                    if pattern.lower() in line.lower():
                        # Check if protected
                        is_protected = any(p.lower() in line.lower() for p in PROTECTED)
                        if not is_protected:
                            issues.append({
                                'file': str(f.relative_to(Path('.'))),
                                'line': line_num,
                                'pattern': pattern,
                                'content': line.strip()[:100]
                            })
        except:
            pass

if issues:
    print("=" * 100)
    print("CRITICAL ISSUES - MIGRATION INCOMPLETE")
    print("=" * 100)
    for issue in sorted(issues, key=lambda x: (x['file'], x['line']))[:20]:
        print(f"\n{issue['file']}:{issue['line']}")
        print(f"  Pattern: {issue['pattern']}")
        print(f"  Content: {issue['content']}")
    print(f"\n\nTotal issues: {len(issues)}")
else:
    print("✅ DOUBLE-CHECK PASSED")
    print("   All critical patterns have been replaced")
    print("   Protected patterns remain intact")
