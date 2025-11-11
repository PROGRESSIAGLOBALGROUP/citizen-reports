#!/bin/bash

# Script maestro para ejecutar todo el deployment
# Este script se ejecuta EN EL VPS

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     DEPLOYMENT NGINX + HTTPS - EJECUCIÓN EN VPS               ║"
echo "║     Fecha: $(date)                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# PASO 1: Ejecutar setup_reverse_proxy.sh
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 1/2: Instalando Nginx + Certbot..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

bash /root/setup_reverse_proxy.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PASO 1 EXITOSO: Nginx instalado y configurado"
    echo ""
else
    echo ""
    echo "❌ PASO 1 FALLÓ: Revisa los errores arriba"
    exit 1
fi

# PASO 2: Ejecutar enable_https.sh
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 2/2: Emitiendo certificado HTTPS..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

bash /root/enable_https.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PASO 2 EXITOSO: Certificado HTTPS emitido"
    echo ""
else
    echo ""
    echo "❌ PASO 2 FALLÓ: Revisa los errores arriba"
    exit 1
fi

# VERIFICACIONES FINALES
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VERIFICACIONES FINALES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1. Verificando Nginx sintaxis..."
sudo nginx -t
echo ""

echo "2. Verificando Nginx status..."
sudo systemctl status nginx --no-pager | head -10
echo ""

echo "3. Verificando certificado..."
sudo certbot certificates
echo ""

echo "4. Verificando puertos abiertos..."
sudo ss -tlnp | grep -E ':(80|443)' || echo "(Sin listening aún)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ¡DEPLOYMENT COMPLETADO EXITOSAMENTE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Próximos pasos:"
echo "  1. Espera a que DNS se propague (si no está ya)"
echo "  2. Verifica: curl -I https://reportes.progressiagroup.com"
echo "  3. Abre en navegador: https://reportes.progressiagroup.com"
echo ""
echo "Fecha/Hora final: $(date)"
echo ""
