#!/bin/bash
#
# enable_https.sh
# ===============
#
# Objetivo: Emitir certificado Let's Encrypt con Certbot y configurar HTTPS en Nginx
# También configura renovación automática de certificado y redirección 80→443
#
# Uso:
#   sudo bash scripts/enable_https.sh
#
# Requisitos:
#   - setup_reverse_proxy.sh ya ejecutado exitosamente
#   - Nginx instalado y corriendo en puerto 80
#   - Certificado Nginx plugin (python3-certbot-nginx)
#   - DNS A record ya propagado (reportes.progressiagroup.com → 145.79.0.77)
#   - Acceso root (sudo)
#   - Conectividad a internet (para validar con Let's Encrypt)
#
# Variables configurables
#
SUBDOMAIN="reportes"
DOMAIN="progressiagroup.com"
FQDN="${SUBDOMAIN}.${DOMAIN}"
ADMIN_EMAIL="admin@progressiagroup.com"

# Color de salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración de error
set -euo pipefail

# Funciones de utilidad
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_blue() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verificar Certbot instalado
check_certbot() {
    log_info "Verificando Certbot..."
    
    if ! command -v certbot &> /dev/null; then
        log_error "Certbot no está instalado. Por favor, ejecuta setup_reverse_proxy.sh primero."
        exit 1
    fi
    
    log_info "✓ Certbot encontrado: $(certbot --version)"
}

# Verificar DNS propagado
check_dns() {
    log_blue "Verificando DNS..."
    
    local ip
    ip=$(dig +short "${FQDN}" | tail -1)
    
    if [ -z "$ip" ]; then
        log_warn "DNS no responde. Esperando propagación (puede tomar hasta 48 horas)..."
        log_warn "Verificar manualmente:"
        log_warn "  dig +short ${FQDN}"
        return 1
    fi
    
    log_info "DNS devuelve: ${ip}"
    
    if [[ "$ip" == "145.79.0.77" ]]; then
        log_info "✓ DNS propagado correctamente"
        return 0
    else
        log_error "DNS devuelve IP incorrecta. Esperado: 145.79.0.77, obtenido: ${ip}"
        return 1
    fi
}

# Verificar Nginx accesible por HTTP
check_http_access() {
    log_blue "Verificando acceso HTTP..."
    
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://${FQDN}" 2>/dev/null || echo "000")
    
    if [[ "$response" == "000" ]]; then
        log_error "No se puede alcanzar http://${FQDN}. Verifica:"
        log_error "  1. Nginx está corriendo: sudo systemctl status nginx"
        log_error "  2. Puerto 80 está abierto: sudo netstat -tlnp | grep :80"
        log_error "  3. DNS está propagado: dig +short ${FQDN}"
        return 1
    fi
    
    log_info "✓ HTTP accesible (HTTP ${response})"
    return 0
}

# Emitir certificado con Certbot
issue_certificate() {
    log_blue "Emitiendo certificado Let's Encrypt..."
    log_info "Ejecutando: certbot --nginx -d ${FQDN} -m ${ADMIN_EMAIL} --agree-tos --redirect --no-eff-email"
    echo ""
    
    certbot --nginx \
        -d "${FQDN}" \
        -m "${ADMIN_EMAIL}" \
        --agree-tos \
        --redirect \
        --no-eff-email \
        --non-interactive
    
    if [ $? -eq 0 ]; then
        log_info "✓ Certificado emitido exitosamente"
        return 0
    else
        log_error "✗ Error emitiendo certificado"
        return 1
    fi
}

# Validar configuración Nginx
validate_nginx() {
    log_blue "Validando configuración Nginx..."
    
    if nginx -t; then
        log_info "✓ Sintaxis Nginx válida"
        return 0
    else
        log_error "✗ Error en sintaxis Nginx"
        return 1
    fi
}

# Recargar Nginx
reload_nginx() {
    log_blue "Recargando Nginx..."
    
    if systemctl reload nginx; then
        log_info "✓ Nginx recargado exitosamente"
        return 0
    else
        log_error "✗ Error recargando Nginx"
        return 1
    fi
}

# Verificar certificado
verify_certificate() {
    log_blue "Verificando certificado..."
    
    openssl s_client -connect "${FQDN}:443" -servername "${FQDN}" < /dev/null 2>/dev/null | \
        openssl x509 -noout -issuer -subject -dates
    
    if [ $? -eq 0 ]; then
        log_info "✓ Certificado verificado"
        return 0
    else
        log_error "✗ Error verificando certificado"
        return 1
    fi
}

# Configurar renovación automática
setup_auto_renewal() {
    log_blue "Configurando renovación automática..."
    
    local has_systemd=false
    if command -v systemctl &> /dev/null; then
        has_systemd=true
    fi
    
    if [ "$has_systemd" = true ]; then
        log_info "Habilitando certbot renewal timer (systemd)..."
        systemctl enable certbot.timer
        systemctl start certbot.timer
        
        if systemctl is-active --quiet certbot.timer; then
            log_info "✓ Certbot renewal timer activo"
        else
            log_warn "No se pudo activar certbot.timer. Intenta manualmente:"
            log_warn "  sudo systemctl enable certbot.timer"
            log_warn "  sudo systemctl start certbot.timer"
        fi
    else
        log_warn "systemd no disponible. Configura cron manualmente:"
        log_warn "  0 3 * * * certbot renew --quiet && systemctl reload nginx"
    fi
}

# Verificar renovación funcionando
test_renewal() {
    log_blue "Probando renovación (dry-run)..."
    
    if certbot renew --dry-run; then
        log_info "✓ Renovación dry-run exitosa"
    else
        log_warn "⚠ Renovación dry-run mostró advertencias. Revisa logs:"
        log_warn "  sudo journalctl -u certbot.timer"
    fi
}

# Resumen y pruebas
print_summary() {
    echo ""
    echo "=========================================="
    echo "CONFIGURACIÓN HTTPS COMPLETADA"
    echo "=========================================="
    echo ""
    echo "Certificado:"
    echo "  Dominio: ${FQDN}"
    echo "  Email: ${ADMIN_EMAIL}"
    echo "  Proveedor: Let's Encrypt"
    echo ""
    echo "Ubicaciones:"
    echo "  Certificado: /etc/letsencrypt/live/${FQDN}/fullchain.pem"
    echo "  Clave privada: /etc/letsencrypt/live/${FQDN}/privkey.pem"
    echo ""
    echo "Renovación:"
    echo "  Auto-renovación: Habilitada (systemd timer)"
    echo "  Próxima renovación: Automática 30 días antes de expiración"
    echo ""
    echo "Verificaciones manuales:"
    echo ""
    echo "1. Prueba HTTPS:"
    echo "   curl -I https://${FQDN}"
    echo ""
    echo "2. Verifica certificado:"
    echo "   openssl s_client -connect ${FQDN}:443 -servername ${FQDN}"
    echo ""
    echo "3. Revisa redirección 80→443:"
    echo "   curl -I http://${FQDN}"
    echo "   (Debe devolver 301/302 hacia https)"
    echo ""
    echo "4. Revisa configuración Nginx:"
    echo "   sudo nginx -t"
    echo "   sudo systemctl status nginx"
    echo ""
    echo "5. Revisa logs:"
    echo "   sudo tail -f /var/log/nginx/${FQDN}.error.log"
    echo "   sudo journalctl -u nginx --no-pager | tail -n 50"
    echo ""
    echo "6. Prueba renovación:"
    echo "   sudo certbot renew --dry-run"
    echo ""
    echo "=========================================="
    echo "✓ HTTPS LISTO PARA PRODUCCIÓN"
    echo "=========================================="
    echo ""
}

# MAIN
main() {
    log_info "Iniciando configuración HTTPS para ${FQDN}"
    log_info "Email: ${ADMIN_EMAIL}"
    echo ""
    
    # Verificar requisitos previos
    check_certbot || exit 1
    
    # Verificar DNS (puede fallar y continuar si propaga luego)
    if ! check_dns; then
        log_warn "DNS aún no propaga. Continuando de todas formas..."
        log_warn "Si falla Certbot, propaga el DNS y reintenta."
    fi
    echo ""
    
    # Verificar acceso HTTP
    if ! check_http_access; then
        log_error "No se puede acceder a HTTP. Soluciona primero, luego reintenta."
        exit 1
    fi
    echo ""
    
    # Emitir certificado
    if ! issue_certificate; then
        log_error "Fallo emitiendo certificado. Revisa:"
        log_error "  1. DNS propagado: dig +short ${FQDN}"
        log_error "  2. HTTP accesible: curl -I http://${FQDN}"
        log_error "  3. Firewall permite 80/443: sudo ufw status"
        exit 1
    fi
    echo ""
    
    # Validar Nginx
    if ! validate_nginx; then
        log_error "Error validando Nginx. Revisa la configuración."
        exit 1
    fi
    echo ""
    
    # Recargar Nginx
    if ! reload_nginx; then
        log_error "Error recargando Nginx."
        exit 1
    fi
    echo ""
    
    # Verificar certificado
    verify_certificate
    echo ""
    
    # Configurar renovación automática
    setup_auto_renewal
    echo ""
    
    # Probar renovación
    test_renewal
    echo ""
    
    # Resumen
    print_summary
}

# Ejecutar main
main "$@"
