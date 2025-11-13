#!/usr/bin/env python3
"""
Generate multi_replace_string_in_file operations from migration_jobs.json
Groups replacements intelligently to maximize efficiency
"""

import json
from pathlib import Path
from collections import defaultdict

def read_file_with_context(filepath, line_num, context_lines=3):
    """Read file and return target line with context"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        
        start = max(0, line_num - 1 - context_lines)
        end = min(len(lines), line_num + context_lines)
        
        # Get the exact line to replace
        target_line = lines[line_num - 1] if line_num <= len(lines) else ""
        
        # Build context block
        context_before = ''.join(lines[start:line_num - 1])
        context_after = ''.join(lines[line_num:end])
        
        old_string = context_before + target_line + context_after
        
        # Build replacement
        new_line = lines[line_num - 1]  # will be replaced
        
        return old_string, new_line
    except Exception as e:
        print(f"Error reading {filepath}:{line_num} - {e}")
        return None, None

def main():
    with open('scripts/migration_jobs.json', encoding='utf-8') as f:
        jobs = json.load(f)
    
    # Group by file
    by_file = defaultdict(list)
    for job in jobs:
        by_file[job['file']].append(job)
    
    # For each file, read actual content and build replacement operations
    operations = []
    
    for filepath, file_jobs in sorted(by_file.items()):
        full_path = Path(filepath)
        
        # Read entire file once
        try:
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
        except Exception as e:
            print(f"❌ Cannot read {filepath}: {e}")
            continue
        
        # Process each job for this file
        for job in file_jobs:
            line_num = job['line_num']
            old_content = job['old']
            new_content = job['new']
            
            # Get context (3 lines before, 3 lines after)
            start_idx = max(0, line_num - 4)
            end_idx = min(len(lines), line_num + 3)
            
            context_lines = lines[start_idx:end_idx]
            
            # Build oldString with context
            oldString = ''.join(context_lines)
            
            # Build newString by replacing the old line with new in context
            newString = ''.join(lines[start_idx:line_num - 1]) + new_content + '\n' + ''.join(lines[line_num:end_idx])
            
            operations.append({
                'filePath': str(full_path.absolute()),
                'oldString': oldString,
                'newString': newString,
                'explanation': f"Replace '{old_content[:60]}...' with citizen-reports variant (line {line_num})"
            })
    
    print(f"Generated {len(operations)} replacement operations")
    
    # Save for batch processing
    with open('scripts/replacement_operations.json', 'w', encoding='utf-8') as f:
        json.dump(operations, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved to scripts/replacement_operations.json")

if __name__ == '__main__':
    main()
