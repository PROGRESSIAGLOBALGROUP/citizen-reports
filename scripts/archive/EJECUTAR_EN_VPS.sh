#!/bin/bash

# SCRIPT DE DEPLOYMENT - Se ejecuta manualmente en el VPS
# Simplemente copia y pega esto en el terminal del VPS

cd /root

echo "════════════════════════════════════════════════════════════════"
echo "STEP 1: INSTALAR NGINX Y CERTBOT"
echo "════════════════════════════════════════════════════════════════"
bash /root/setup_reverse_proxy.sh

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "STEP 2: EMITIR CERTIFICADO HTTPS"
echo "════════════════════════════════════════════════════════════════"
bash /root/enable_https.sh

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "VERIFICACIONES FINALES"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Sintaxis Nginx:"
sudo nginx -t
echo ""
echo "Status Nginx:"
sudo systemctl status nginx --no-pager | head -10
echo ""
echo "Certificado:"
sudo certbot certificates
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETADO"
echo "════════════════════════════════════════════════════════════════"
