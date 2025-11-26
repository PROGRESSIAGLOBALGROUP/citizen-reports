#!/usr/bin/env python3
# Final comprehensive verification
import re
from pathlib import Path

CRITICAL = {
    'C:\\PROYECTOS\\citizen-reports': 'Windows path (capital C)',
    'c:\\PROYECTOS\\citizen-reports': 'Windows path (lowercase c)',
    '/root/citizen-reports': 'Unix prod path',
    '/home/citizen-reports': 'Unix home path',
    'citizen-reports-demo': 'Old PM2 app name',
    'scp c:\\PROYECTOS\\citizen-reports': 'scp with citizen-reports path',
    'scp C:\\PROYECTOS\\citizen-reports': 'scp with citizen-reports path',
}

issues = []

for f in Path('.').rglob('*'):
    if any(x in str(f) for x in ['.git', 'node_modules', '.backup_']):
        continue
    if f.suffix not in {'.ps1', '.js', '.md', '.sh', '.sql'}:
        continue
    
    try:
        with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
            content = fp.read()
        
        for pattern, desc in CRITICAL.items():
            if pattern in content:
                issues.append((f.relative_to(Path('.')), desc))
                break
    except:
        pass

if issues:
    print('ISSUES FOUND:')
    for fpath, issue in issues:
        print(f'  {fpath}: {issue}')
else:
    print('✅ FINAL VERIFICATION: ALL CRITICAL PATTERNS REPLACED')
