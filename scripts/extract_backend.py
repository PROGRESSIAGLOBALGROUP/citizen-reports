#!/usr/bin/env python3
"""
Backend Extraction Tool
Extrae archivos backend del backup al proyecto actual.
Solo copia archivos que no existen o tienen features nuevos.
"""

import os
import shutil
from pathlib import Path
from datetime import datetime

# Configuración
BACKUP_PATH = Path(r"C:\PROYECTOS\citizen-reports\backups\citizen-reports_08-DEC-2025_ 01.15")
CURRENT_PATH = Path(r"C:\PROYECTOS\citizen-reports")

# Archivos a extraer (identificados en análisis forense)
FILES_TO_EXTRACT = [
    # Archivos nuevos (no existen en proyecto actual)
    "server/security.js",
    "server/logger.js", 
    "server/push-notifications.js",
    "server/push-routes.js",
    "server/sms-service.js",
    "server/migrations/004-push-subscriptions.sql",
    "server/migrations/006_usuarios_telefono.sql",
    "server/migrations/aplicar-migracion-006.js",
]

def extract_file(rel_path):
    """Extrae un archivo del backup al proyecto actual."""
    src = BACKUP_PATH / rel_path
    dst = CURRENT_PATH / rel_path
    
    if not src.exists():
        print(f"  ❌ No existe en backup: {rel_path}")
        return False
    
    if dst.exists():
        print(f"  ⚠️ Ya existe (saltando): {rel_path}")
        return False
    
    # Crear directorio si no existe
    dst.parent.mkdir(parents=True, exist_ok=True)
    
    # Copiar archivo
    shutil.copy2(src, dst)
    print(f"  ✅ Extraído: {rel_path} ({dst.stat().st_size} bytes)")
    return True

def main():
    print("="*60)
    print("BACKEND EXTRACTION TOOL")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("="*60)
    
    print(f"\nOrigen: {BACKUP_PATH}")
    print(f"Destino: {CURRENT_PATH}")
    
    print("\n[1] Extrayendo archivos backend nuevos...")
    
    extracted = 0
    skipped = 0
    errors = 0
    
    for rel_path in FILES_TO_EXTRACT:
        result = extract_file(rel_path)
        if result:
            extracted += 1
        elif (CURRENT_PATH / rel_path).exists():
            skipped += 1
        else:
            errors += 1
    
    print("\n" + "="*60)
    print("RESUMEN")
    print("="*60)
    print(f"Extraídos: {extracted}")
    print(f"Saltados (ya existen): {skipped}")
    print(f"Errores: {errors}")
    
    if extracted > 0:
        print("\n>>> PRÓXIMOS PASOS:")
        print("1. Aplicar migraciones SQL a la base de datos")
        print("2. Integrar módulos en app.js")
        print("3. Instalar dependencias: npm install winston winston-daily-rotate-file web-push twilio")

if __name__ == "__main__":
    main()
