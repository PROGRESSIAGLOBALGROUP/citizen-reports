#!/bin/bash
# COPIAR Y PEGAR ESTO EN LA TERMINAL WEB DE HOSTINGER
# ════════════════════════════════════════════════════════════════════════════════

echo "🚀 INICIANDO REPARACIÓN AUTOMÁTICA..."
echo ""

# 1. REINICIAR SSH
echo "1️⃣  Reiniciando SSH..."
sudo systemctl restart ssh
sudo systemctl enable ssh
sleep 2

# 2. VERIFICAR SSH ACTIVO
echo "2️⃣  Verificando SSH..."
sudo systemctl is-active ssh

# 3. REINICIAR NGINX
echo "3️⃣  Reiniciando Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# 4. VALIDAR NGINX
echo "4️⃣  Validando Nginx..."
sudo nginx -t

# 5. EJECUTAR ENABLE_HTTPS
echo "5️⃣  Configurando HTTPS..."
if [ -f /root/enable_https.sh ]; then
    bash /root/enable_https.sh
else
    echo "⚠️  enable_https.sh no encontrado, intentando certbot directo..."
    sudo certbot --nginx -d reportes.progressiagroup.com --agree-tos --redirect --no-eff-email -n
fi

# 6. VERIFICAR CERTIFICADOS
echo "6️⃣  Verificando certificados..."
sudo certbot certificates

# 7. ESTADO FINAL
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "✅ REPARACIÓN COMPLETADA"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📊 ESTADO FINAL:"
echo "  SSH:        $(sudo systemctl is-active ssh 2>/dev/null || echo 'ERROR')"
echo "  Nginx:      $(sudo systemctl is-active nginx 2>/dev/null || echo 'ERROR')"
echo ""
