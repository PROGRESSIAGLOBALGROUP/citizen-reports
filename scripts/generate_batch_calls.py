#!/usr/bin/env python3
"""
Generate Python code with multi_replace_string_in_file calls
"""

import json

with open('scripts/replacement_operations.json', encoding='utf-8') as f:
    ops = json.load(f)

print(f"# Generated batch replacement script")
print(f"# Total operations: {len(ops)}")
print(f"# Split into batches of 30")
print()

# Generate in batches of 30
for batch_num, batch_start in enumerate(range(0, len(ops), 30), 1):
    batch_end = min(batch_start + 30, len(ops))
    batch = ops[batch_start:batch_end]
    
    print(f"\n# =================================================================")
    print(f"# BATCH {batch_num}: Operations {batch_start + 1} to {batch_end}")
    print(f"# =================================================================\n")
    
    print(f"multi_replace_string_in_file(")
    print(f"  explanation='Migration batch {batch_num}/{(len(ops) + 29) // 30}: Jantetelco → citizen-reports',")
    print(f"  replacements=[")
    
    for i, op in enumerate(batch):
        # Escape triple quotes and backslashes
        old = op['oldString'].replace('\\', '\\\\').replace('"""', r'\"\"\"')
        new = op['newString'].replace('\\', '\\\\').replace('"""', r'\"\"\"')
        
        print(f'    {{')
        print(f'      "filePath": r"{op["filePath"]}",')
        print(f'      "oldString": """{old}""",')
        print(f'      "newString": """{new}""",')
        print(f'      "explanation": "{op["explanation"]}"')
        print(f'    }}{"," if i < len(batch) - 1 else ""}')
    
    print(f"  ]")
    print(f")")

print(f"\n# Total batches: {(len(ops) + 29) // 30}")
