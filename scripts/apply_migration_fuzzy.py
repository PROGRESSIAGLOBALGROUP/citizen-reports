#!/usr/bin/env python3
"""
Second pass: Handle remaining mismatches with fuzzy matching
"""

import json
import difflib
from pathlib import Path

with open('scripts/replacement_operations.json', encoding='utf-8') as f:
    ops = json.load(f)

# Group by file
by_file = {}
for op in ops:
    fpath = op['filePath']
    if fpath not in by_file:
        by_file[fpath] = []
    by_file[fpath].append(op)

success = 0
failed = []

for fpath, file_ops in sorted(by_file.items()):
    try:
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        for op in file_ops:
            old = op['oldString']
            new = op['newString']
            
            if old in content:
                content = content.replace(old, new)
                success += 1
            else:
                # Try fuzzy match
                lines = content.split('\n')
                old_lines = old.split('\n')
                new_lines = new.split('\n')
                
                # Find best match in content
                best_match = None
                best_ratio = 0
                best_idx = -1
                
                for i in range(len(lines) - len(old_lines) + 1):
                    candidate = '\n'.join(lines[i:i + len(old_lines)])
                    ratio = difflib.SequenceMatcher(None, old, candidate).ratio()
                    if ratio > best_ratio and ratio > 0.85:  # 85% match threshold
                        best_ratio = ratio
                        best_match = candidate
                        best_idx = i
                
                if best_match:
                    # Replace in-place
                    lines[best_idx:best_idx + len(old_lines)] = new_lines
                    content = '\n'.join(lines)
                    success += 1
                    print(f"🔍 Fuzzy matched in {Path(fpath).name}:{best_idx+1} ({best_ratio*100:.1f}%)")
                else:
                    failed.append({
                        'file': str(fpath),
                        'operation': op['explanation']
                    })
        
        if content != original:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
    
    except Exception as e:
        print(f"Error in {fpath}: {e}")

print(f"\n{'='*80}")
print(f"Second pass results:")
print(f"  Additional successful: {success}")
print(f"  Still failed: {len(failed)}")
if failed:
    print(f"\nFailed operations:")
    for item in failed[:10]:
        print(f"  - {item['file'].split(chr(92))[-1]}: {item['operation'][:60]}")
