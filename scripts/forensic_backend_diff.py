#!/usr/bin/env python3
"""
Forensic Backend Diff Tool
Mapea y compara implementaciones backend entre backup y proyecto actual.
Solo analiza archivos de servidor (backend), excluye UI/frontend.
"""

import os
import hashlib
import json
from pathlib import Path
from datetime import datetime

# Configuración
BACKUP_PATH = Path(r"C:\PROYECTOS\citizen-reports\backups\citizen-reports_08-DEC-2025_ 01.15")
CURRENT_PATH = Path(r"C:\PROYECTOS\citizen-reports")
OUTPUT_PATH = CURRENT_PATH / "scripts" / "forensic_report.json"

# Solo archivos backend (excluir client/src para no tocar UI)
BACKEND_PATTERNS = [
    "server/*.js",
    "server/**/*.js",
    "server/*.sql",
    "server/**/*.sql",
]

# Excluir explícitamente
EXCLUDE_PATTERNS = [
    "client/",
    "node_modules/",
    "backups/",
    ".git/",
    "test-results/",
]

def hash_file(filepath):
    """Genera hash SHA256 de un archivo."""
    try:
        with open(filepath, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
    except Exception as e:
        return f"ERROR: {e}"

def is_backend_file(filepath):
    """Determina si es archivo backend."""
    path_str = str(filepath).replace("\\", "/")
    
    # Excluir patrones
    for pattern in EXCLUDE_PATTERNS:
        if pattern in path_str:
            return False
    
    # Solo server/
    if "/server/" in path_str or path_str.startswith("server/"):
        if filepath.suffix in ['.js', '.sql', '.json', '.mjs']:
            return True
    
    return False

def scan_directory(base_path, relative=True):
    """Escanea directorio y retorna diccionario de archivos backend."""
    files = {}
    server_path = base_path / "server"
    
    print(f"    Buscando en: {server_path}")
    
    if not server_path.exists():
        print(f"  [WARN] No existe: {server_path}")
        return files
    
    for filepath in server_path.rglob("*"):
        if filepath.is_file():
            # Excluir node_modules y archivos de base de datos
            path_str = str(filepath)
            if "node_modules" in path_str:
                continue
            if filepath.suffix in ['.db', '.db-shm', '.db-wal', '.backup']:
                continue
            if filepath.suffix in ['.js', '.sql', '.json', '.mjs']:
                rel_path = str(filepath.relative_to(base_path)).replace("\\", "/")
                files[rel_path] = {
                    "hash": hash_file(filepath),
                    "size": filepath.stat().st_size,
                    "modified": datetime.fromtimestamp(filepath.stat().st_mtime).isoformat()
                }
    
    return files

def extract_file_content(filepath):
    """Extrae contenido del archivo."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except:
        try:
            with open(filepath, 'r', encoding='latin-1') as f:
                return f.read()
        except Exception as e:
            return f"ERROR: {e}"

def analyze_security_features(content, filepath):
    """Analiza features de seguridad en el código."""
    features = []
    
    security_patterns = {
        "rate_limiting": ["rateLimit", "rate-limit", "limiter", "throttle"],
        "csrf_protection": ["csrf", "CSRF", "csrfToken", "X-CSRF"],
        "encryption": ["crypto", "encrypt", "decrypt", "AES", "cipher"],
        "session_timeout": ["sessionTimeout", "session_timeout", "inactividad"],
        "password_policy": ["password", "bcrypt", "hash", "salt"],
        "audit_trail": ["historial", "audit", "log", "registrar"],
        "input_validation": ["sanitize", "validate", "escape", "xss"],
        "sms_service": ["twilio", "sms", "telefono", "SMS"],
        "push_notifications": ["push", "vapid", "notification", "webpush"],
    }
    
    for feature, patterns in security_patterns.items():
        for pattern in patterns:
            if pattern.lower() in content.lower():
                features.append(feature)
                break
    
    return list(set(features))

def main():
    print("="*60)
    print("FORENSIC BACKEND DIFF TOOL")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("="*60)
    
    print("\n[1] Escaneando BACKUP...")
    backup_files = scan_directory(BACKUP_PATH)
    print(f"    Encontrados: {len(backup_files)} archivos backend")
    
    print("\n[2] Escaneando PROYECTO ACTUAL...")
    current_files = scan_directory(CURRENT_PATH)
    print(f"    Encontrados: {len(current_files)} archivos backend")
    
    # Análisis de diferencias
    report = {
        "timestamp": datetime.now().isoformat(),
        "backup_path": str(BACKUP_PATH),
        "current_path": str(CURRENT_PATH),
        "summary": {
            "backup_files": len(backup_files),
            "current_files": len(current_files),
            "new_in_backup": 0,
            "modified": 0,
            "identical": 0,
        },
        "new_files": [],
        "modified_files": [],
        "security_features": {},
    }
    
    print("\n[3] Analizando diferencias...")
    
    for rel_path, backup_info in backup_files.items():
        if rel_path in current_files:
            if backup_info["hash"] != current_files[rel_path]["hash"]:
                # Archivo modificado - analizar contenido
                backup_content = extract_file_content(BACKUP_PATH / rel_path)
                current_content = extract_file_content(CURRENT_PATH / rel_path)
                
                backup_features = analyze_security_features(backup_content, rel_path)
                current_features = analyze_security_features(current_content, rel_path)
                
                new_features = [f for f in backup_features if f not in current_features]
                
                if new_features or len(backup_content) > len(current_content) * 1.1:
                    report["modified_files"].append({
                        "path": rel_path,
                        "backup_size": backup_info["size"],
                        "current_size": current_files[rel_path]["size"],
                        "backup_features": backup_features,
                        "current_features": current_features,
                        "new_features_in_backup": new_features,
                        "size_diff": backup_info["size"] - current_files[rel_path]["size"],
                    })
                    report["summary"]["modified"] += 1
            else:
                report["summary"]["identical"] += 1
        else:
            # Archivo nuevo en backup
            backup_content = extract_file_content(BACKUP_PATH / rel_path)
            features = analyze_security_features(backup_content, rel_path)
            
            report["new_files"].append({
                "path": rel_path,
                "size": backup_info["size"],
                "features": features,
            })
            report["summary"]["new_in_backup"] += 1
    
    # Guardar reporte
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n[4] Reporte guardado en: {OUTPUT_PATH}")
    
    # Resumen en consola
    print("\n" + "="*60)
    print("RESUMEN")
    print("="*60)
    print(f"Archivos nuevos en backup (candidatos a extraer): {report['summary']['new_in_backup']}")
    print(f"Archivos modificados con features nuevos: {report['summary']['modified']}")
    print(f"Archivos idénticos: {report['summary']['identical']}")
    
    if report["new_files"]:
        print("\n>>> ARCHIVOS NUEVOS EN BACKUP:")
        for f in report["new_files"]:
            print(f"    - {f['path']} ({f['size']} bytes)")
            if f["features"]:
                print(f"      Features: {', '.join(f['features'])}")
    
    if report["modified_files"]:
        print("\n>>> ARCHIVOS CON FEATURES NUEVOS EN BACKUP:")
        for f in report["modified_files"]:
            if f["new_features_in_backup"]:
                print(f"    - {f['path']}")
                print(f"      Nuevos features: {', '.join(f['new_features_in_backup'])}")
                print(f"      Diff tamaño: {f['size_diff']:+d} bytes")
    
    return report

if __name__ == "__main__":
    main()
