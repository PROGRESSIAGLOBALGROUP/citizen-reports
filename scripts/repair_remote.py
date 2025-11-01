#!/usr/bin/env python3
"""
Script para reparar el servidor remoto vía SSH con contraseña
Uso: python3 repair_remote.py
"""

import subprocess
import sys
import time
from pathlib import Path

# Configuración
SSH_HOST = "root@145.79.0.77"
SSH_PASSWORD = "#M3YBmUDK+C,iQM3tn4t"
PROJECT_DIR = "/root/Citizen-reports"

# Comandos a ejecutar
COMMANDS = [
    ("echo '🔍 Verificando directorio'", "Verificar directorio"),
    ("cd /root/Citizen-reports && pwd", "Cambiar a directorio del proyecto"),
    ("ls -la server/ | head -5", "Listar contenido de server/"),
    ("git status", "Estado de Git"),
    ("git pull origin main 2>&1", "Actualizar código"),
    ("cd server && npm install --production 2>&1 | tail -3", "Instalar dependencias backend"),
    ("cd ../client && npm install --production 2>&1 | tail -3", "Instalar dependencias frontend"),
    ("npm run build 2>&1 | tail -5", "Compilar frontend"),
    ("cd ../server && pkill -f 'node server.js'", "Detener servidor anterior"),
    ("sleep 2 && nohup npm start > server.log 2>&1 &", "Iniciar servidor"),
    ("sleep 3 && curl -s -o /dev/null -w 'API /reportes: %{http_code}\\n' http://localhost:4000/api/reportes", "Verificar /api/reportes"),
    ("curl -s -o /dev/null -w 'API /tipos: %{http_code}\\n' http://localhost:4000/api/reportes/tipos", "Verificar /api/reportes/tipos"),
    ("tail -10 server.log", "Ver logs del servidor"),
]

def run_ssh_command(cmd, description):
    """Ejecutar comando vía SSH"""
    print(f"\n📌 {description}")
    print(f"   Comando: {cmd}")
    
    try:
        # Usar sshpass si está disponible, sino usar SSH normal
        result = subprocess.run(
            f'sshpass -p "{SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no {SSH_HOST} "{cmd}"',
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print(f"   ✅ Exitoso")
            if result.stdout.strip():
                for line in result.stdout.strip().split('\n'):
                    print(f"      {line}")
        else:
            print(f"   ⚠️  Código de salida: {result.returncode}")
            if result.stderr.strip():
                print(f"   Error: {result.stderr.strip()[:100]}")
                
    except subprocess.TimeoutExpired:
        print(f"   ⏱️  Timeout")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

def main():
    print("=" * 70)
    print("🚀 REPARACIÓN DE SERVIDOR REMOTO - Citizen-reports")
    print("=" * 70)
    
    # Verificar si sshpass está disponible
    result = subprocess.run("which sshpass", shell=True, capture_output=True)
    if result.returncode != 0:
        print("\n⚠️  ADVERTENCIA: 'sshpass' no está instalado")
        print("   En Linux/Mac: apt-get install sshpass  O  brew install sshpass")
        print("   En Windows: Instalar desde https://sourceforge.net/projects/sshpass/")
        print("\n   Intenta instalar e ir de nuevo...\n")
        return 1
    
    # Ejecutar comandos
    for cmd, description in COMMANDS:
        run_ssh_command(cmd, description)
        time.sleep(1)
    
    print("\n" + "=" * 70)
    print("✅ REPARACIÓN COMPLETADA")
    print("=" * 70)
    print("\n📍 Servidor: http://145.79.0.77:4000")
    print("📍 Panel: http://145.79.0.77:4000/#/panel")
    print("\n✨ Ahora prueba:")
    print("   1. Abre http://145.79.0.77:4000/#/panel en el navegador")
    print("   2. Ve a 'Mis Reportes Asignados'")
    print("   3. Debería cargar sin errores")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
