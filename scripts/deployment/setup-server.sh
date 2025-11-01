#!/bin/bash

# Script de limpieza y setup en el servidor
echo "🧹 Limpiando servidor..."
pm2 kill 2>/dev/null || true
rm -rf /root/citizen-reports
rm -f /root/Citizen-reports.zip
echo "✅ Servidor limpio"

# Esperar a que PM2 muera
sleep 2

echo "📂 Extrayendo paquete..."
mkdir -p /root/citizen-reports
cd /root
unzip -q Citizen-reports.zip -d citizen-reports-temp/

# Crear estructura correcta
mkdir -p /root/citizen-reports/server
mkdir -p /root/citizen-reports/client/dist
mkdir -p /root/citizen-reports/logs

# Organizar archivos
cd /root/citizen-reports-temp/citizen-reports

# Mover assets y HTML a client/dist
if [ -d "assets" ]; then
  mv assets /root/citizen-reports/client/dist/
fi

if [ -f "index.html" ]; then
  mv index.html /root/citizen-reports/client/dist/
fi

# Mover todos los .js, .json, .sql a server
mv *.js *.json *.sql /root/citizen-reports/server/ 2>/dev/null || true

# Mover README
if [ -f "README.md" ]; then
  mv README.md /root/citizen-reports/
fi

# Limpiar
cd /root
rm -rf citizen-reports-temp

echo "✅ Estructura creada"
ls -la /root/citizen-reports/server/ | head -15
