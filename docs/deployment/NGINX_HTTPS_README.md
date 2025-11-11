# Deployment Nginx + HTTPS - README

**Proyecto:** Jantetelco - Plataforma de Reportes Municipales  
**Versión:** 1.0  
**Fecha:** Noviembre 4, 2025  
**Status:** ✅ PRODUCCIÓN  

---

## 🎯 Objetivo

Servir la aplicación web `http://127.0.0.1:4000` públicamente a través de `https://reportes.progressiagroup.com` usando Nginx como reverse proxy con certificado Let's Encrypt en VPS sin Docker.

---

## 📦 Contenido del Paquete

Este directorio contiene todos los archivos necesarios para deployment:

```
docs/deployment/
├── README.md                                 ← Este archivo
├── STEP_BY_STEP.md                           ← Guía paso a paso (EMPEZAR AQUÍ)
├── VERIFY.md                                 ← Checklist de verificación
├── DNS_NOTES.md                              ← Configuración DNS en HostGator
├── nginx-reportes.progressiagroup.com.conf   ← Plantilla Nginx config
└── scripts/
    ├── setup_reverse_proxy.sh                ← Script 1: Install Nginx
    └── enable_https.sh                       ← Script 2: Emitir certificado
```

---

## ⚡ Quick Start (Para Los Apurados)

### 1. Configura DNS en HostGator

- Panel → Dominios → progressiagroup.com → Administrar DNS
- Crea A record: Host=`reportes`, IP=`145.79.0.77`, TTL=300
- Espera propagación (~5-30 minutos)
- Verifica: `dig reportes.progressiagroup.com` debe devolver `145.79.0.77`

### 2. SSH al VPS

```bash
ssh root@145.79.0.77
```

### 3. Ejecutar Scripts (En Orden)

```bash
# Descarga e instala Nginx
sudo bash scripts/setup_reverse_proxy.sh

# Emite certificado HTTPS (después de DNS propagado)
sudo bash scripts/enable_https.sh
```

### 4. Verificar

```bash
curl -I https://reportes.progressiagroup.com
# Debe devolver: HTTP/1.1 200 OK
```

**¡Listo!** Tu app está viva en `https://reportes.progressiagroup.com`

---

## 📖 Documentos Detallados

### 🔵 STEP_BY_STEP.md (COMIENZA AQUÍ)

Instrucciones completas paso a paso:
- Paso 1: Configurar DNS
- Paso 2: Instalar Nginx
- Paso 3: Emitir HTTPS
- Paso 4: Verificaciones

**Tiempo estimado:** 10-15 minutos (+ espera DNS)

### 🟣 VERIFY.md

Checklist completo de verificación con comandos:

```bash
# DNS propagado
dig reportes.progressiagroup.com

# HTTP funciona
curl -I http://reportes.progressiagroup.com

# HTTPS funciona
curl -I https://reportes.progressiagroup.com

# Certificado válido
openssl s_client -connect reportes.progressiagroup.com:443 \
  -servername reportes.progressiagroup.com < /dev/null | \
  openssl x509 -noout -subject -dates

# (Y 6 verificaciones más en el documento)
```

### 🟡 DNS_NOTES.md

Detalles sobre configuración DNS en HostGator:
- Cómo acceder al panel
- Cómo crear A record
- Cómo verificar propagación
- Troubleshooting DNS

---

## 🔧 Scripts Incluidos

### setup_reverse_proxy.sh

**Qué hace:**
- Detecta distro (Debian/Ubuntu vs RHEL-like)
- Instala Nginx y Certbot
- Abre puertos 80 y 443 en firewall
- Crea config Nginx reverse proxy
- Valida y recarga Nginx

**Duración:** ~2 minutos

**Comando:**
```bash
sudo bash scripts/setup_reverse_proxy.sh
```

**Salida esperada:**
```
[INFO] Instalando Nginx...
[INFO] Instalando Certbot...
[INFO] Abriendo puertos 80 y 443...
[INFO] Creando configuración Nginx...
[INFO] ✓ Sintaxis Nginx válida
[INFO] ✓ Nginx recargado exitosamente

==========================================
CONFIGURACIÓN COMPLETADA EXITOSAMENTE
==========================================
```

### enable_https.sh

**Qué hace:**
- Verifica DNS propagado
- Verifica HTTP accesible
- Emite certificado Let's Encrypt
- Configura renovación automática (systemd timer)
- Prueba renovación (dry-run)

**Duración:** ~3 minutos

**Comando:**
```bash
sudo bash scripts/enable_https.sh
```

**Salida esperada:**
```
[INFO] Emitiendo certificado Let's Encrypt...
Congratulations! Your certificate has been issued.

[INFO] ✓ Certificado verificado
[INFO] ✓ Renovación dry-run exitosa

==========================================
CONFIGURACIÓN HTTPS COMPLETADA
==========================================
```

---

## 📋 Variables Fijas

Estos valores están hardcodeados en los scripts. Si necesitas cambiarlos, edita los scripts:

```bash
SUBDOMAIN="reportes"
DOMAIN="progressiagroup.com"
FQDN="reportes.progressiagroup.com"
APP_PORT="4000"
APP_HOST="127.0.0.1"
ADMIN_EMAIL="admin@progressiagroup.com"
```

---

## ✅ Requisitos Previos

**En el VPS:**
- [ ] Linux: Debian/Ubuntu o RHEL-like (CentOS, Rocky, Fedora)
- [ ] Acceso root (sudo)
- [ ] Conectividad saliente a internet (para descargar paquetes)
- [ ] Puertos 80 y 443 disponibles (no en uso)

**En HostGator:**
- [ ] Acceso a panel DNS de progressiagroup.com
- [ ] Capacidad de crear A record

**Aplicación:**
- [ ] Corriendo en http://127.0.0.1:4000 (loopback, no public)
- [ ] Responde a requests HTTP

---

## 🔍 Verificación Rápida

Después de ejecutar ambos scripts:

```bash
# Test 1: DNS
dig reportes.progressiagroup.com
# Esperado: 145.79.0.77

# Test 2: HTTP → HTTPS redirect
curl -I http://reportes.progressiagroup.com
# Esperado: 301 Moved Permanently

# Test 3: HTTPS
curl -I https://reportes.progressiagroup.com
# Esperado: 200 OK

# Test 4: Certificado
curl https://reportes.progressiagroup.com -I --insecure
# Esperado: 200 OK + candado verde en browser

# Test 5: Certbot renovación
sudo certbot renew --dry-run
# Esperado: The dry run was successful
```

**Si todos pasan → ✅ LISTO PARA PRODUCCIÓN**

---

## 🚨 Troubleshooting

### "502 Bad Gateway"

Causa: Aplicación no corre en :4000

```bash
# Verificar puerto
sudo netstat -tlnp | grep 4000

# Iniciar aplicación si no está corriendo
# (Depende de tu app - PM2, systemd, etc.)
```

### "Connection refused" en puerto 80

Causa: Nginx no corre

```bash
sudo systemctl start nginx
sudo systemctl status nginx
```

### "SSL: CERTIFICATE_VERIFY_FAILED"

Causa: Certificado no emitido correctamente

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### "DNS doesn't resolve"

Causa: Propagación pendiente o registro incorrecto

```bash
# Esperar y reintentar
dig reportes.progressiagroup.com

# O verificar en HostGator panel que A record existe
```

### "Nginx syntax error"

Causa: Config inválida

```bash
sudo nginx -t
# Muestra error específico

# Revisar config
sudo cat /etc/nginx/sites-available/reportes.progressiagroup.com
```

---

## 🔄 Renovación de Certificado

El certificado se renueva **automáticamente** 30 días antes de expirar.

```bash
# Ver estado
sudo systemctl status certbot.timer

# Siguiente renovación
sudo systemctl list-timers certbot.timer

# Forzar renovación manual
sudo certbot renew

# Test renovación
sudo certbot renew --dry-run
```

---

## 📊 Logs y Monitoreo

### Logs Nginx

```bash
# Acceso
sudo tail -f /var/log/nginx/reportes.progressiagroup.com.access.log

# Errores
sudo tail -f /var/log/nginx/reportes.progressiagroup.com.error.log

# Systemd
sudo journalctl -u nginx -f
```

### Logs Certbot

```bash
sudo journalctl -u certbot.timer
sudo journalctl -u certbot
```

---

## 🛡️ Configuración de Seguridad

La config Nginx incluye:

✅ Limite de tamaño cliente: 25MB (para uploads)
✅ Timeouts: 60s (conexión, lectura, escritura)
✅ Buffering: Habilitado (mejor performance)
✅ WebSocket: Soportado (Upgrade headers)
✅ Headers proxy: X-Real-IP, X-Forwarded-For, X-Forwarded-Proto

---

## 📞 Soporte

**Documentos de referencia:**

- Nginx: <https://nginx.org/en/docs/>
- Certbot: <https://certbot.eff.org/docs/>
- Let's Encrypt: <https://letsencrypt.org/>
- HostGator Help: <https://www.hostgator.com/help>

**Problemas comunes:**

Ver `VERIFY.md` → Troubleshooting Rápido (tabla completa)

---

## 📝 Checklist de Completitud

Antes de considerar "Listo para Producción":

- [ ] DNS propagado (dig devuelve 145.79.0.77)
- [ ] HTTP accesible
- [ ] HTTPS accesible con certificado válido
- [ ] Redirección 80→443 activa
- [ ] Aplicación responde en :4000
- [ ] Logs sin errores
- [ ] Puertos 80/443 abiertos en firewall
- [ ] Renovación automática configurada
- [ ] Nginx sobrevive reinicio

Si todos están ✅, **aplicación está LISTA PARA PRODUCCIÓN.**

---

## 🔐 Mantenimiento

### Mensualmente

```bash
# Revisar logs de errores
sudo tail -100 /var/log/nginx/reportes.progressiagroup.com.error.log

# Verificar certificado expire date
sudo certbot certificates
```

### Trimestralmente

```bash
# Actualizar Nginx
sudo apt update && sudo apt upgrade nginx

# Validar sintaxis
sudo nginx -t

# Recargar
sudo systemctl reload nginx
```

### Anualmente

```bash
# Revisar configuración
sudo cat /etc/nginx/sites-available/reportes.progressiagroup.com

# Actualizar si es necesario
```

---

## 📢 Comunicación del Cambio

Si esta es una migración:

1. **Backups:** `sudo certbot certificates` + archivos config
2. **Rollback:** Mantén config Nginx vieja en `/root/nginx-backup/`
3. **Testing:** Ejecuta verificaciones ANTES de comunicar cambio
4. **Status:** Comunica a equipo cuando esté 100% ready

---

## 📖 Próximos Pasos

1. **Lee:** `STEP_BY_STEP.md` para instrucciones detalladas
2. **Configura:** DNS en HostGator
3. **Ejecuta:** `setup_reverse_proxy.sh`
4. **Emite:** `enable_https.sh`
5. **Verifica:** Checklist en `VERIFY.md`
6. **Monitoea:** Logs regularmente

---

**Version:** 1.0  
**Last Updated:** Noviembre 4, 2025  
**Status:** ✅ READY FOR PRODUCTION

---

## 🎉 ¡Listo!

Tu aplicación está configurada para servirse de forma segura y escalable con Nginx + HTTPS.

**Questions?** Revisa los documentos de referencia o el archivo `VERIFY.md` (solución para casi todos los problemas).
