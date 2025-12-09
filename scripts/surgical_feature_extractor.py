#!/usr/bin/env python3
"""
Surgical Feature Extractor - code_surgeon protocol
Extrae quirúrgicamente features específicos del backup sin sobrescribir archivos completos.
Genera fragmentos para aplicar con code_surgeon.
"""

import os
import re
import difflib
from pathlib import Path
from datetime import datetime
import json

BACKUP_PATH = Path(r"C:\PROYECTOS\citizen-reports\backups\citizen-reports_08-DEC-2025_ 01.15")
CURRENT_PATH = Path(r"C:\PROYECTOS\citizen-reports")
OUTPUT_DIR = CURRENT_PATH / "code_surgeon" / "fragments" / "backup_extraction"

# Archivos a analizar quirúrgicamente
FILES_TO_ANALYZE = [
    "server/auth_middleware.js",      # session_timeout
    "server/auth_routes.js",          # csrf_protection, rate_limiting  
    "server/admin-routes.js",         # encryption
    "server/notas-trabajo-routes.js", # encryption, input_validation
    "server/reportes_auth_routes.js", # encryption, input_validation
    "server/usuarios-routes.js",      # sms_service, input_validation
]

# Patrones para identificar bloques de features
FEATURE_PATTERNS = {
    "session_timeout": [
        r"verificarSesionActiva",
        r"SESSION_TIMEOUT",
        r"ultima_actividad",
        r"sesión.*expirada",
    ],
    "csrf_protection": [
        r"csrf",
        r"CSRF",
        r"X-CSRF-Token",
        r"csrfToken",
    ],
    "rate_limiting": [
        r"loginRateLimiter",
        r"registrarIntentoFallido",
        r"limpiarIntentosFallidos",
    ],
    "encryption": [
        r"encryptSensitiveFields",
        r"decryptSensitiveFields",
        r"cifrar",
        r"descifrar",
    ],
    "input_validation": [
        r"sanitizeInput",
        r"sanitizar",
        r"escapar",
        r"validar.*entrada",
    ],
    "sms_service": [
        r"notificar.*Sms",
        r"isSmsEnabled",
        r"sms_habilitado",
    ],
}

def read_file(filepath):
    """Lee archivo con manejo de encoding."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except:
        with open(filepath, 'r', encoding='latin-1') as f:
            return f.read()

def find_feature_blocks(content, feature_name):
    """Encuentra bloques de código relacionados con un feature."""
    patterns = FEATURE_PATTERNS.get(feature_name, [])
    blocks = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines):
        for pattern in patterns:
            if re.search(pattern, line, re.IGNORECASE):
                # Encontrar contexto: 5 líneas antes y después
                start = max(0, i - 5)
                end = min(len(lines), i + 10)
                
                # Expandir para incluir función/bloque completo
                # Buscar inicio de función hacia arriba
                func_start = i
                brace_count = 0
                for j in range(i, start - 1, -1):
                    if '{' in lines[j]:
                        brace_count += lines[j].count('{')
                    if '}' in lines[j]:
                        brace_count -= lines[j].count('}')
                    if re.match(r'^(export\s+)?(async\s+)?function\s+\w+|^\w+\s*[:=]\s*(async\s+)?\(|^export\s+(const|let)\s+\w+', lines[j]):
                        func_start = j
                        break
                
                blocks.append({
                    'pattern': pattern,
                    'line': i + 1,
                    'func_start': func_start + 1,
                    'context': '\n'.join(lines[start:end]),
                    'match': line.strip()
                })
                break
    
    return blocks

def generate_diff_report(backup_content, current_content, filepath):
    """Genera reporte de diferencias significativas."""
    backup_lines = backup_content.splitlines(keepends=True)
    current_lines = current_content.splitlines(keepends=True)
    
    diff = list(difflib.unified_diff(
        current_lines, backup_lines,
        fromfile=f'current/{filepath}',
        tofile=f'backup/{filepath}',
        lineterm=''
    ))
    
    # Extraer solo las adiciones del backup
    additions = []
    current_hunk = []
    in_hunk = False
    
    for line in diff:
        if line.startswith('@@'):
            if current_hunk:
                additions.append('\n'.join(current_hunk))
            current_hunk = [line]
            in_hunk = True
        elif in_hunk:
            if line.startswith('+') and not line.startswith('+++'):
                current_hunk.append(line)
            elif line.startswith('-') and not line.startswith('---'):
                current_hunk.append(line)
            elif line.startswith(' '):
                current_hunk.append(line)
    
    if current_hunk:
        additions.append('\n'.join(current_hunk))
    
    return additions

def analyze_file(rel_path):
    """Analiza un archivo para extracción quirúrgica."""
    backup_file = BACKUP_PATH / rel_path
    current_file = CURRENT_PATH / rel_path
    
    if not backup_file.exists() or not current_file.exists():
        return None
    
    backup_content = read_file(backup_file)
    current_content = read_file(current_file)
    
    if backup_content == current_content:
        return None
    
    # Detectar features en el backup
    features_found = {}
    for feature, patterns in FEATURE_PATTERNS.items():
        blocks = find_feature_blocks(backup_content, feature)
        if blocks:
            # Verificar si estos bloques NO existen en el actual
            current_blocks = find_feature_blocks(current_content, feature)
            if len(blocks) > len(current_blocks):
                features_found[feature] = blocks
    
    if not features_found:
        return None
    
    # Generar diff
    diff_hunks = generate_diff_report(backup_content, current_content, rel_path)
    
    return {
        'file': rel_path,
        'backup_size': len(backup_content),
        'current_size': len(current_content),
        'diff_bytes': len(backup_content) - len(current_content),
        'features': features_found,
        'diff_hunks': diff_hunks[:5]  # Limitar a 5 hunks
    }

def main():
    print("="*70)
    print("SURGICAL FEATURE EXTRACTOR - code_surgeon protocol")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("="*70)
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    results = []
    
    for rel_path in FILES_TO_ANALYZE:
        print(f"\n[ANALYZING] {rel_path}")
        result = analyze_file(rel_path)
        
        if result:
            results.append(result)
            print(f"  ✅ Features encontrados: {list(result['features'].keys())}")
            print(f"     Diff: {result['diff_bytes']:+d} bytes")
            
            # Guardar fragmento para code_surgeon
            fragment_name = rel_path.replace('/', '_').replace('.js', '')
            fragment_file = OUTPUT_DIR / f"{fragment_name}_features.json"
            
            with open(fragment_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"     Fragment: {fragment_file.name}")
        else:
            print(f"  ⚪ Sin features nuevos a extraer")
    
    # Resumen
    print("\n" + "="*70)
    print("PLAN DE EXTRACCIÓN QUIRÚRGICA")
    print("="*70)
    
    if results:
        for r in results:
            print(f"\n📁 {r['file']}")
            for feature, blocks in r['features'].items():
                print(f"   🔧 {feature}: {len(blocks)} bloques")
                for b in blocks[:2]:  # Mostrar solo primeros 2
                    print(f"      Línea {b['line']}: {b['match'][:60]}...")
    else:
        print("No hay features nuevos para extraer.")
    
    return results

if __name__ == "__main__":
    main()
