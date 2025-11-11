#!/bin/bash
# AUTO_REPAIR_COMPLETE.sh
# Reparación completa automatizada de SSH + Nginx + HTTPS
# Ejecutado: $(date)

set -e

echo "════════════════════════════════════════════════════════════════"
echo "🚀 INICIANDO REPARACIÓN COMPLETA AUTOMÁTICA"
echo "════════════════════════════════════════════════════════════════"
echo ""

# FASE 1: SSH
echo "📡 FASE 1: Reparando SSH..."
echo "─────────────────────────────────────────────────────────────────"

sudo systemctl restart ssh 2>/dev/null || echo "⚠️  SSH restart requiere privilegios"
sudo systemctl enable ssh 2>/dev/null || true
sleep 2

SSH_STATUS=$(sudo systemctl is-active ssh 2>/dev/null || echo "unknown")
if [ "$SSH_STATUS" = "active" ]; then
    echo "✅ SSH está ACTIVO"
else
    echo "⚠️  SSH status: $SSH_STATUS"
fi

echo ""

# FASE 2: Verificar Nginx
echo "🌐 FASE 2: Verificando Nginx..."
echo "─────────────────────────────────────────────────────────────────"

NGINX_STATUS=$(sudo systemctl is-active nginx 2>/dev/null || echo "unknown")
if [ "$NGINX_STATUS" = "active" ]; then
    echo "✅ Nginx está ACTIVO"
else
    echo "❌ Nginx NO está activo, intentando reiniciar..."
    sudo systemctl restart nginx 2>/dev/null || echo "⚠️  Error al reiniciar Nginx"
    sleep 2
fi

echo ""

# FASE 3: Verificar config Nginx
echo "🔧 FASE 3: Validando configuración Nginx..."
echo "─────────────────────────────────────────────────────────────────"

if sudo nginx -t 2>&1; then
    echo "✅ Configuración Nginx válida"
else
    echo "❌ Configuración Nginx inválida - intentando reparar..."
    
    # Regenerar configuración
    if [ -f /root/setup_reverse_proxy.sh ]; then
        echo "   Ejecutando setup_reverse_proxy.sh..."
        bash /root/setup_reverse_proxy.sh
    else
        echo "⚠️  No se encontró setup_reverse_proxy.sh"
    fi
fi

echo ""

# FASE 4: HTTPS/Certbot
echo "🔐 FASE 4: Configurando HTTPS..."
echo "─────────────────────────────────────────────────────────────────"

# Verificar si ya existe certificado
if [ -d "/etc/letsencrypt/live/reportes.progressiagroup.com" ]; then
    echo "✅ Certificado Let's Encrypt YA EXISTS"
    echo "   Path: /etc/letsencrypt/live/reportes.progressiagroup.com"
    
    # Verificar validez
    CERT_EXPIRY=$(sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/reportes.progressiagroup.com/cert.pem 2>/dev/null | cut -d= -f2 || echo "unknown")
    echo "   Expira: $CERT_EXPIRY"
else
    echo "⚠️  Certificado NO existe, generando..."
    
    if [ -f /root/enable_https.sh ]; then
        echo "   Ejecutando enable_https.sh..."
        bash /root/enable_https.sh
    else
        echo "⚠️  No se encontró enable_https.sh"
        echo "   Intentando con certbot directamente..."
        sudo certbot --nginx -d reportes.progressiagroup.com --agree-tos --redirect --no-eff-email -n 2>/dev/null || echo "⚠️  Error con certbot"
    fi
fi

echo ""

# FASE 5: Verificación Final
echo "✔️  FASE 5: Verificación Final..."
echo "─────────────────────────────────────────────────────────────────"

echo ""
echo "📊 ESTADO FINAL:"
echo "─────────────────────────────────────────────────────────────────"

echo -n "  SSH:           "
sudo systemctl is-active ssh 2>/dev/null && echo "✅ ACTIVO" || echo "❌ INACTIVO"

echo -n "  Nginx:         "
sudo systemctl is-active nginx 2>/dev/null && echo "✅ ACTIVO" || echo "❌ INACTIVO"

echo -n "  Config Nginx:  "
sudo nginx -t 2>&1 | grep -q "successful" && echo "✅ VÁLIDA" || echo "❌ INVÁLIDA"

echo -n "  HTTPS Cert:    "
if [ -d "/etc/letsencrypt/live/reportes.progressiagroup.com" ]; then
    echo "✅ EXISTE"
else
    echo "❌ NO EXISTE"
fi

echo ""
echo "🎯 Puerto 80 (HTTP):  $(netstat -tlnp 2>/dev/null | grep -q ':80 ' && echo '✅ ESCUCHANDO' || echo '❌ NO ESCUCHA')"
echo "🎯 Puerto 443 (HTTPS): $(netstat -tlnp 2>/dev/null | grep -q ':443 ' && echo '✅ ESCUCHANDO' || echo '❌ NO ESCUCHA')"
echo "🎯 Puerto 22 (SSH):   $(netstat -tlnp 2>/dev/null | grep -q ':22 ' && echo '✅ ESCUCHANDO' || echo '❌ NO ESCUCHA')"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ REPARACIÓN COMPLETADA"
echo "════════════════════════════════════════════════════════════════"
