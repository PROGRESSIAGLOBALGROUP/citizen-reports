#!/usr/bin/env python3
"""
Integration Validator - Valida que los módulos extraídos estén listos para integrar.
Verifica dependencias, imports, y genera plan de integración.
"""

import os
import re
from pathlib import Path
from datetime import datetime

CURRENT_PATH = Path(r"C:\PROYECTOS\citizen-reports")

# Archivos extraídos a validar
EXTRACTED_FILES = [
    "server/security.js",
    "server/logger.js", 
    "server/push-notifications.js",
    "server/push-routes.js",
    "server/sms-service.js",
]

def extract_imports(filepath):
    """Extrae imports de un archivo JS."""
    imports = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # import X from 'Y'
            matches = re.findall(r"import\s+.*?\s+from\s+['\"]([^'\"]+)['\"]", content)
            imports.extend(matches)
            # import 'Y'
            matches2 = re.findall(r"import\s+['\"]([^'\"]+)['\"]", content)
            imports.extend(matches2)
    except Exception as e:
        print(f"  Error leyendo {filepath}: {e}")
    return imports

def extract_exports(filepath):
    """Extrae exports de un archivo JS."""
    exports = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # export function X
            matches = re.findall(r"export\s+(?:async\s+)?function\s+(\w+)", content)
            exports.extend(matches)
            # export const X
            matches2 = re.findall(r"export\s+const\s+(\w+)", content)
            exports.extend(matches2)
            # export { X, Y }
            matches3 = re.findall(r"export\s+\{\s*([^}]+)\s*\}", content)
            for m in matches3:
                exports.extend([x.strip() for x in m.split(',')])
    except Exception as e:
        print(f"  Error leyendo {filepath}: {e}")
    return exports

def check_npm_dependencies():
    """Verifica dependencias npm requeridas."""
    required = ['winston', 'winston-daily-rotate-file', 'web-push', 'twilio']
    package_json = CURRENT_PATH / "server" / "package.json"
    
    installed = []
    missing = []
    
    try:
        import json
        with open(package_json, 'r', encoding='utf-8') as f:
            pkg = json.load(f)
            deps = pkg.get('dependencies', {})
            
            for dep in required:
                if dep in deps:
                    installed.append(dep)
                else:
                    missing.append(dep)
    except Exception as e:
        print(f"  Error leyendo package.json: {e}")
        missing = required
    
    return installed, missing

def main():
    print("="*60)
    print("INTEGRATION VALIDATOR")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("="*60)
    
    print("\n[1] Validando archivos extraídos...")
    for rel_path in EXTRACTED_FILES:
        filepath = CURRENT_PATH / rel_path
        if filepath.exists():
            imports = extract_imports(filepath)
            exports = extract_exports(filepath)
            print(f"\n  ✅ {rel_path}")
            print(f"     Imports: {len(imports)} | Exports: {len(exports)}")
            
            # Detectar imports externos
            external = [i for i in imports if not i.startswith('.') and not i.startswith('/')]
            if external:
                print(f"     npm requeridos: {', '.join(set(external))}")
        else:
            print(f"\n  ❌ {rel_path} - NO EXISTE")
    
    print("\n[2] Verificando dependencias npm...")
    installed, missing = check_npm_dependencies()
    if installed:
        print(f"  ✅ Instaladas: {', '.join(installed)}")
    if missing:
        print(f"  ❌ Faltantes: {', '.join(missing)}")
        print(f"\n  >>> EJECUTAR: cd server && npm install {' '.join(missing)}")
    
    print("\n[3] Generando plan de integración...")
    
    integration_plan = """
PLAN DE INTEGRACIÓN BACKEND
============================

PASO 1: Instalar dependencias npm
  cd server
  npm install winston winston-daily-rotate-file web-push

PASO 2: Aplicar migraciones SQL
  sqlite3 server/data.db < server/migrations/004-push-subscriptions.sql
  sqlite3 server/data.db "ALTER TABLE usuarios ADD COLUMN sms_habilitado INTEGER DEFAULT 1;"

PASO 3: Integrar en app.js
  - Agregar imports de security.js, push-notifications.js, sms-service.js
  - Aplicar middleware securityHeaders
  - Configurar rutas push (configurarRutasPush)

PASO 4: Verificar que los tests pasen
  npm run test:unit
"""
    print(integration_plan)
    
    return missing

if __name__ == "__main__":
    main()
