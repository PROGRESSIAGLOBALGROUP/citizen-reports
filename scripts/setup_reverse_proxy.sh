#!/bin/bash
#
# setup_reverse_proxy.sh
# =====================
# 
# Objetivo: Instalar y configurar Nginx como reverse proxy para aplicación web
# Expone http://reportes.progressiagroup.com (puerto 80) hacia http://127.0.0.1:4000
# Prepara para HTTPS con Certbot (ejecutar enable_https.sh después)
#
# Uso:
#   sudo bash setup_reverse_proxy.sh
#
# Requisitos:
#   - Sistema operativo: Debian/Ubuntu o RHEL-like (CentOS, Rocky, Fedora)
#   - Acceso root (sudo)
#   - Conectividad a internet (para descargar paquetes)
#
# Variables configurables
#
SUBDOMAIN="reportes"
DOMAIN="progressiagroup.com"
FQDN="${SUBDOMAIN}.${DOMAIN}"
APP_PORT="4000"
APP_HOST="127.0.0.1"

# Color de salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Detectar distribución Linux
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [[ "$ID" == "debian" || "$ID" == "ubuntu" ]]; then
            echo "debian"
        elif [[ "$ID" == "rhel" || "$ID" == "centos" || "$ID" == "rocky" || "$ID" == "fedora" ]]; then
            echo "rhel"
        else
            echo "unknown"
        fi
    else
        echo "unknown"
    fi
}

# Instalar Nginx y Certbot según distro
install_packages() {
    local distro="$1"
    
    if [[ "$distro" == "debian" ]]; then
        log_info "Detectada distribución Debian/Ubuntu"
        log_info "Actualizando repositorios..."
        apt-get update
        
        log_info "Instalando Nginx..."
        apt-get install -y nginx
        
        log_info "Instalando Certbot y plugin Nginx..."
        apt-get install -y certbot python3-certbot-nginx
        
    elif [[ "$distro" == "rhel" ]]; then
        log_info "Detectada distribución RHEL-like (CentOS/Rocky/Fedora)"
        log_info "Actualizando repositorios..."
        yum update -y
        
        log_info "Instalando Nginx..."
        yum install -y nginx
        
        log_info "Instalando EPEL (para Certbot si es necesario)..."
        yum install -y epel-release || true
        
        log_info "Instalando Certbot y plugin Nginx..."
        yum install -y certbot python3-certbot-nginx
        
    else
        log_error "No se pudo detectar la distribución Linux. Por favor, instala Nginx y Certbot manualmente."
        exit 1
    fi
}

# Abrir puertos 80 y 443 en firewall
open_firewall() {
    if command -v ufw &> /dev/null; then
        log_info "Detectado firewall: UFW"
        log_info "Habilitando UFW (si no está ya activo)..."
        ufw --force enable || true
        
        log_info "Abriendo puerto 80/tcp..."
        ufw allow 80/tcp || log_warn "Puerto 80 ya permitido"
        
        log_info "Abriendo puerto 443/tcp..."
        ufw allow 443/tcp || log_warn "Puerto 443 ya permitido"
        
        log_info "UFW estado:"
        ufw status | grep -E "80|443" || true
        
    elif command -v firewall-cmd &> /dev/null; then
        log_info "Detectado firewall: firewalld"
        log_info "Iniciando firewalld..."
        systemctl start firewalld
        systemctl enable firewalld
        
        log_info "Abriendo puerto 80/tcp..."
        firewall-cmd --permanent --add-service=http || log_warn "Servicio HTTP ya permitido"
        
        log_info "Abriendo puerto 443/tcp..."
        firewall-cmd --permanent --add-service=https || log_warn "Servicio HTTPS ya permitido"
        
        log_info "Recargando firewalld..."
        firewall-cmd --reload
        
        log_info "firewalld estado:"
        firewall-cmd --list-services | grep -E "http|https" || true
        
    else
        log_warn "No se detectó UFW ni firewalld. Por favor, abre manualmente los puertos 80 y 443."
    fi
}

# Crear configuración Nginx para Debian/Ubuntu
create_nginx_config_debian() {
    local config_file="/etc/nginx/sites-available/${FQDN}"
    
    log_info "Creando archivo de configuración Nginx: ${config_file}"
    
    cat > "${config_file}" << 'EOF'
# Configuración Nginx reverse proxy
# Generada por setup_reverse_proxy.sh
# Dominio: reportes.progressiagroup.com

server {
    listen 80;
    server_name reportes.progressiagroup.com;

    # Límite de tamaño de cliente para upload de ficheros (fotos, firmas)
    client_max_body_size 25m;

    # Logging
    access_log /var/log/nginx/reportes.progressiagroup.com.access.log combined;
    error_log /var/log/nginx/reportes.progressiagroup.com.error.log warn;

    # Reverse proxy hacia aplicación local
    location / {
        # Destino: http://127.0.0.1:4000
        proxy_pass http://127.0.0.1:4000;
        
        # HTTP version (importante para compatibilidad)
        proxy_http_version 1.1;
        
        # Encabezados estándar
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (si aplicación usa WebSocket)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint (opcional)
    location /health {
        access_log off;
        proxy_pass http://127.0.0.1:4000/health;
    }
}
EOF
    
    log_info "Archivo de configuración creado exitosamente"
}

# Crear configuración Nginx para RHEL-like
create_nginx_config_rhel() {
    local config_file="/etc/nginx/conf.d/${FQDN}.conf"
    
    log_info "Creando archivo de configuración Nginx: ${config_file}"
    
    cat > "${config_file}" << 'EOF'
# Configuración Nginx reverse proxy
# Generada por setup_reverse_proxy.sh
# Dominio: reportes.progressiagroup.com

server {
    listen 80;
    server_name reportes.progressiagroup.com;

    # Límite de tamaño de cliente para upload de ficheros (fotos, firmas)
    client_max_body_size 25m;

    # Logging
    access_log /var/log/nginx/reportes.progressiagroup.com.access.log combined;
    error_log /var/log/nginx/reportes.progressiagroup.com.error.log warn;

    # Reverse proxy hacia aplicación local
    location / {
        # Destino: http://127.0.0.1:4000
        proxy_pass http://127.0.0.1:4000;
        
        # HTTP version (importante para compatibilidad)
        proxy_http_version 1.1;
        
        # Encabezados estándar
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (si aplicación usa WebSocket)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint (opcional)
    location /health {
        access_log off;
        proxy_pass http://127.0.0.1:4000/health;
    }
}
EOF
    
    log_info "Archivo de configuración creado exitosamente"
}

# Crear symlink en sites-enabled para Debian/Ubuntu
enable_site_debian() {
    local available="/etc/nginx/sites-available/${FQDN}"
    local enabled="/etc/nginx/sites-enabled/${FQDN}"
    
    if [ -L "${enabled}" ]; then
        log_warn "Symlink ya existe: ${enabled}"
    else
        log_info "Creando symlink: ${enabled} -> ${available}"
        ln -sf "${available}" "${enabled}"
    fi
}

# Validar configuración Nginx
validate_nginx() {
    log_info "Validando sintaxis de configuración Nginx..."
    
    if nginx -t; then
        log_info "✓ Sintaxis Nginx válida"
    else
        log_error "✗ Error en sintaxis Nginx. Por favor, revisa la configuración."
        exit 1
    fi
}

# Habilitar e iniciar Nginx
enable_nginx() {
    log_info "Habilitando Nginx para iniciar con el sistema..."
    systemctl enable nginx
    
    log_info "Iniciando (o recargando) Nginx..."
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
        log_info "✓ Nginx recargado exitosamente"
    else
        systemctl start nginx
        log_info "✓ Nginx iniciado exitosamente"
    fi
}

# Resumen de configuración
print_summary() {
    echo ""
    echo "=========================================="
    echo "CONFIGURACIÓN COMPLETADA EXITOSAMENTE"
    echo "=========================================="
    echo ""
    echo "Dominio: ${FQDN}"
    echo "Aplicación: http://${APP_HOST}:${APP_PORT}"
    echo "Puertos: 80 (HTTP), 443 (HTTPS - pendiente)"
    echo ""
    echo "Siguientes pasos:"
    echo "1. Verifica DNS:"
    echo "   dig +short ${FQDN}"
    echo "   (Debe devolver: 145.79.0.77)"
    echo ""
    echo "2. Prueba HTTP:"
    echo "   curl -I http://${FQDN}"
    echo "   (Debe responder con 200/301/302)"
    echo ""
    echo "3. Habilita HTTPS:"
    echo "   sudo bash scripts/enable_https.sh"
    echo ""
    echo "4. Verifica certificado:"
    echo "   openssl s_client -connect ${FQDN}:443 -servername ${FQDN}"
    echo ""
    echo "5. Revisa logs Nginx:"
    echo "   sudo tail -f /var/log/nginx/${FQDN}.access.log"
    echo "   sudo tail -f /var/log/nginx/${FQDN}.error.log"
    echo ""
}

# MAIN
main() {
    log_info "Iniciando setup de reverse proxy Nginx para ${FQDN}"
    log_info "Aplicación destino: http://${APP_HOST}:${APP_PORT}"
    echo ""
    
    # Detectar distro
    local distro
    distro=$(detect_distro)
    
    if [[ "$distro" == "unknown" ]]; then
        log_error "No se pudo detectar la distribución Linux."
        exit 1
    fi
    
    # Instalar paquetes
    install_packages "$distro"
    
    # Abrir puertos en firewall
    open_firewall
    
    # Crear configuración Nginx
    if [[ "$distro" == "debian" ]]; then
        create_nginx_config_debian
        enable_site_debian
    else
        create_nginx_config_rhel
    fi
    
    # Validar configuración
    validate_nginx
    
    # Habilitar e iniciar Nginx
    enable_nginx
    
    # Resumen
    print_summary
}

# Ejecutar main
main "$@"
