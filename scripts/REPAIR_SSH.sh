#!/bin/bash
# SCRIPT DE REPARACIÓN PARA SSH
# Ejecutar esto desde la terminal de Hostinger

set -x  # mostrar cada comando

echo "═════════════════════════════════════════════════════════════════"
echo "REPARACIÓN DE SSH Y NGINX"
echo "═════════════════════════════════════════════════════════════════"
echo ""

# 1. Ver estado actual
echo "[1/8] Estado actual del sistema..."
systemctl status ssh --no-pager | head -10 || echo "SSH no corre"
echo ""

# 2. Reiniciar SSH
echo "[2/8] Reiniciando servicio SSH..."
systemctl restart ssh
sleep 2
echo ""

# 3. Verificar que SSH esté activo
echo "[3/8] Verificando SSH..."
systemctl is-active ssh
echo ""

# 4. Ver estado de Nginx
echo "[4/8] Estado de Nginx..."
systemctl status nginx --no-pager | head -10
echo ""

# 5. Ver si el puerto 22 escucha
echo "[5/8] Verificando puerto 22..."
netstat -tlnp | grep 22 || ss -tlnp | grep 22
echo ""

# 6. Verificar Nginx config
echo "[6/8] Validando config de Nginx..."
nginx -t
echo ""

# 7. Ver certificados
echo "[7/8] Certificados disponibles..."
ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "No hay certificados"
echo ""

# 8. Logs
echo "[8/8] Últimas líneas de log SSH..."
tail -20 /var/log/auth.log 2>/dev/null || tail -20 /var/log/syslog | grep ssh
echo ""

echo "═════════════════════════════════════════════════════════════════"
echo "REPARACIÓN COMPLETADA"
echo "═════════════════════════════════════════════════════════════════"
