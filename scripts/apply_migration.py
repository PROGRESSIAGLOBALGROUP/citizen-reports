#!/usr/bin/env python3
"""
Executor: Apply all migration replacements directly
Safe execution with rollback capability
"""

import json
import shutil
from pathlib import Path
from datetime import datetime

def main():
    with open('scripts/replacement_operations.json', encoding='utf-8') as f:
        ops = json.load(f)
    
    print(f"🔄 Applying {len(ops)} replacements...\n")
    
    # Group by file to apply multiple replacements per file
    by_file = {}
    for op in ops:
        fpath = op['filePath']
        if fpath not in by_file:
            by_file[fpath] = []
        by_file[fpath].append(op)
    
    success_count = 0
    error_count = 0
    
    for fpath, file_ops in sorted(by_file.items()):
        try:
            # Read file
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Apply all operations for this file
            for op in file_ops:
                old = op['oldString']
                new = op['newString']
                
                if old in content:
                    content = content.replace(old, new)
                    success_count += 1
                else:
                    print(f"⚠️  Cannot find exact match in {Path(fpath).name}")
                    error_count += 1
            
            # Write back
            if content != original_content:
                # Create backup
                backup_path = fpath + '.backup_' + datetime.now().strftime('%Y%m%d_%H%M%S')
                shutil.copy(fpath, backup_path)
                
                # Write updated content
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                print(f"✅ {Path(fpath).name}: {len(file_ops)} replacements")
        
        except Exception as e:
            print(f"❌ Error in {Path(fpath).name}: {e}")
            error_count += 1
    
    print(f"\n{'='*80}")
    print(f"📊 SUMMARY")
    print(f"{'='*80}")
    print(f"✅ Successful replacements: {success_count}")
    print(f"❌ Failed replacements: {error_count}")
    print(f"📁 Files updated: {len(by_file)}")

if __name__ == '__main__':
    main()
