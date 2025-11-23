#!/bin/bash
# EJECUTAR CUANDO EL VPS ESTÉ ONLINE

# Este script completa la Fase 2 del deployment

set -euo pipefail

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║         PHASE 2: Enable HTTPS (Let's Encrypt)                    ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar que Nginx esté running
echo "[1/5] Verificando Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx

echo ""
echo "[2/5] Verificando que puerto 80 sea accesible..."
if ! curl -s http://127.0.0.1:80 > /dev/null 2>&1; then
    echo "⚠️  Port 80 local check failed, but continuing..."
fi

echo ""
echo "[3/5] Verificando DNS..."
DIG_RESULT=$(dig +short reportes.progressiagroup.com | tail -1)
if [ "$DIG_RESULT" == "145.79.0.77" ]; then
    echo "✓ DNS OK: reportes.progressiagroup.com → 145.79.0.77"
else
    echo "⚠️  DNS NOT PROPAGATED YET"
    echo "    Current: $DIG_RESULT (expected 145.79.0.77)"
    echo "    Esperando 1 minuto..."
    sleep 60
fi

echo ""
echo "[4/5] Ejecutando Certbot para emitir certificado..."
echo "      (Responde 'Y' para aceptar términos)"
echo "      (Responde 'N' para no compartir email con EFF)"
echo ""

sudo certbot --nginx \
    -d reportes.progressiagroup.com \
    -m admin@progressiagroup.com \
    --agree-tos \
    --redirect \
    --no-eff-email \
    -n  # Non-interactive (si es posible)

echo ""
echo "[5/5] Configurando renovación automática..."
sudo systemctl enable certbot.timer
sudo systemctl status certbot.timer

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║              ✅ HTTPS SETUP COMPLETE                             ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Próximas verificaciones:"
echo ""
echo "1. Verificar certificado:"
echo "   openssl s_client -connect reportes.progressiagroup.com:443 \\"
echo "     -servername reportes.progressiagroup.com < /dev/null | \\"
echo "     openssl x509 -noout -subject -dates"
echo ""
echo "2. Verificar HTTP → HTTPS redirección:"
echo "   curl -I http://reportes.progressiagroup.com"
echo ""
echo "3. Verificar HTTPS accesible:"
echo "   curl -I https://reportes.progressiagroup.com"
echo ""
echo "4. Verificar renovación automática:"
echo "   sudo certbot renew --dry-run"
echo ""
