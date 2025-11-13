#!/usr/bin/env python3
"""
Migration Script: Jantetelco → citizen-reports
Intelligent pattern-based replacement with context awareness
"""

import os
import re
from pathlib import Path
from collections import defaultdict
import json

# Configuration
EXCLUDE_DIRS = {'.git', 'node_modules', 'dist', 'build', '.next', '__pycache__', '.pytest_cache', 'backups', '.vscode'}
EXCLUDE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.db', '.bin', '.so', '.dll', '.lock'}

# Replacement patterns with context
PATTERNS = [
    # Local Windows paths (highest priority)
    {
        'name': 'windows_local_path',
        'pattern': r"C:\\PROYECTOS\\Jantetelco",
        'replacement': r"C:\PROYECTOS\citizen-reports",
        'safe': True,
    },
    # Remote Unix paths
    {
        'name': 'unix_prod_path',
        'pattern': r'/root/citizen-reports',
        'replacement': '/root/citizen-reports',
        'safe': True,
    },
    {
        'name': 'unix_home_path',
        'pattern': r'/root/citizen-reports',
        'replacement': '/root/citizen-reports',
        'safe': True,
    },
    # PM2 app names
    {
        'name': 'pm2_app_name',
        'pattern': r"name:\s*['\"]jantetelco-demo['\"]",
        'replacement': "name: 'citizen-reports-app'",
        'safe': True,
    },
    {
        'name': 'pm2_cwd',
        'pattern': r"cwd:\s*['\"]\/root\/jantetelco['\"]",
        'replacement': "cwd: '/root/citizen-reports'",
        'safe': True,
    },
    # User Agent headers (NOT user-facing)
    {
        'name': 'user_agent_header',
        'pattern': r"'User-Agent':\s*['\"]Jantetelco-Heatmap",
        'replacement': "'User-Agent': 'citizen-reports-Heatmap",
        'safe': True,
    },
    # Prometheus metrics (internal)
    {
        'name': 'prometheus_metrics',
        'pattern': r'citizen_reports_maintenance',
        'replacement': 'citizen_reports_maintenance',
        'safe': True,
    },
    # Windows service names
    {
        'name': 'windows_service',
        'pattern': r'CitizenReportsMonitor',
        'replacement': 'CitizenReportsMonitor',
        'safe': True,
    },
    # Comment text (safe)
    {
        'name': 'script_comment_title',
        'pattern': r'# .*[Ss]cript.*Jantetelco',
        'replacement': lambda m: m.group(0).replace('Jantetelco', 'Citizen Reports'),
        'safe': True,
    },
    # Shortcut display names (UI but not translatable)
    {
        'name': 'shortcut_display',
        'pattern': r'Iniciar Citizen Reports',
        'replacement': 'Iniciar Citizen Reports',
        'safe': True,
    },
]

# Patterns to KEEP (do not replace)
KEEP_PATTERNS = [
    r'admin@jantetelco\.gob\.mx',
    r'supervisor\.\w+@jantetelco\.gob\.mx',
    r'func\.\w+@jantetelco\.gob\.mx',
    r'wilder@jantetelco\.gob\.mx',
    r'test\d*@jantetelco\.gob\.mx',
    r'Jantetelco, Morelos',
    r'Jantetelco(?:,|\s+con)',  # in UI strings like "Área de Jantetelco"
    r'github\.com/jantetelco',
    r'18\.7|18\.8|-99\.1|-99\.2',  # coordinates
    r"'Incendio forestal en el cerro de Jantetelco'",
]

def should_skip_line(line):
    """Check if line should be skipped (protected content)"""
    for pattern in KEEP_PATTERNS:
        if re.search(pattern, line, re.IGNORECASE):
            return True
    return False

def scan_codebase():
    """Scan entire codebase and collect matches"""
    root = Path('.')
    matches = defaultdict(list)
    
    for file_path in root.rglob('*'):
        # Skip excluded dirs
        if any(part in EXCLUDE_DIRS for part in file_path.parts):
            continue
        
        if file_path.is_file():
            # Skip binary/large files
            if file_path.suffix in EXCLUDE_EXTENSIONS:
                continue
            
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                if 'jantetelco' not in content.lower():
                    continue
                
                lines = content.split('\n')
                for i, line in enumerate(lines, 1):
                    if 'jantetelco' in line.lower() and not should_skip_line(line):
                        rel_path = str(file_path.relative_to(root))
                        matches[rel_path].append({
                            'line_num': i,
                            'content': line.strip()[:120],
                            'full_line': line
                        })
            except Exception as e:
                pass
    
    return matches

def generate_replacements(matches):
    """Generate replacement jobs grouped by file"""
    jobs = []
    
    for file_path, occurrences in sorted(matches.items()):
        for match in occurrences:
            line = match['full_line']
            
            # Try to match against patterns
            for pattern_config in PATTERNS:
                if re.search(pattern_config['pattern'], line, re.IGNORECASE):
                    replacement = pattern_config['replacement']
                    if callable(replacement):
                        new_line = replacement(re.search(pattern_config['pattern'], line, re.IGNORECASE))
                    else:
                        # Escape backslashes in replacement string for re.sub
                        escaped_replacement = str(replacement).replace('\\', '\\\\')
                        new_line = re.sub(pattern_config['pattern'], escaped_replacement, line, flags=re.IGNORECASE)
                    
                    jobs.append({
                        'file': file_path,
                        'line_num': match['line_num'],
                        'old': line,
                        'new': new_line,
                        'pattern': pattern_config['name'],
                        'safe': pattern_config['safe']
                    })
                    break
    
    return jobs

def main():
    print("=" * 140)
    print("🔍 SCANNING CODEBASE FOR 'Jantetelco' REFERENCES")
    print("=" * 140)
    
    matches = scan_codebase()
    
    print(f"\n✅ Found {len(matches)} files with matches\n")
    
    total_occurrences = sum(len(v) for v in matches.values())
    print(f"   Total replaceable occurrences: {total_occurrences}")
    print(f"   Protected patterns: {len(KEEP_PATTERNS)}")
    
    jobs = generate_replacements(matches)
    
    print(f"\n" + "=" * 140)
    print("📋 REPLACEMENT JOBS GENERATED")
    print("=" * 140)
    
    # Group by pattern type
    by_pattern = defaultdict(list)
    for job in jobs:
        by_pattern[job['pattern']].append(job)
    
    for pattern_type, pattern_jobs in sorted(by_pattern.items()):
        print(f"\n{pattern_type}: {len(pattern_jobs)} replacements")
        for job in pattern_jobs[:3]:  # Show first 3 examples
            print(f"  📄 {job['file']}:{job['line_num']}")
            print(f"     - {job['old'][:80]}")
        if len(pattern_jobs) > 3:
            print(f"  ... and {len(pattern_jobs) - 3} more")
    
    # Save jobs to JSON
    jobs_file = 'scripts/migration_jobs.json'
    with open(jobs_file, 'w', encoding='utf-8') as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Jobs saved to {jobs_file}")
    
    # Summary statistics
    print(f"\n" + "=" * 140)
    print("📊 SUMMARY")
    print("=" * 140)
    print(f"  Total files to update: {len(matches)}")
    print(f"  Total replacements: {len(jobs)}")
    print(f"  All replacements marked safe: {all(j['safe'] for j in jobs)}")
    print(f"\n  Next step: Review migration_jobs.json and run code_surgeon operations")

if __name__ == '__main__':
    main()
