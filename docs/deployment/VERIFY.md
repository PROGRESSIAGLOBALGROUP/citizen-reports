# Guía de Verificación - Reverse Proxy Nginx con HTTPS

**Fecha:** Noviembre 4, 2025  
**Dominio:** reportes.progressiagroup.com  
**IP:** 145.79.0.77  
**Aplicación:** <http://127.0.0.1:4000>  

---

## 📋 Checklist de Verificación

Ejecuta estas verificaciones después de completar `setup_reverse_proxy.sh` y `enable_https.sh`.

### 1️⃣ DNS Propagación

Verifica que el registro A del dominio apunta a la IP correcta:

```bash
dig +short reportes.progressiagroup.com
# Resultado esperado: 145.79.0.77

# Alternativa con nslookup
nslookup reportes.progressiagroup.com
# Debe listar 145.79.0.77 en la sección "Address"

# Alternativa con host
host reportes.progressiagroup.com
# Debe mostrar: reportes.progressiagroup.com has address 145.79.0.77
```

**Si DNS no propaga:**

- TTL puede tardar hasta 48 horas
- Verifica que el A record se creó en HostGator panel
- Confirma que apunta a 145.79.0.77 sin puerto
- Si cambiaste DNS recientemente, espera propagación

---

### 2️⃣ Acceso HTTP (Sin HTTPS)

Prueba que Nginx recibe y proxea correctamente:

```bash
# Prueba con curl (requiere DNS propagado)
curl -I http://reportes.progressiagroup.com

# Resultado esperado:
# HTTP/1.1 200 OK
# Server: nginx/...
# (Si aplicación devuelve 200)

# O:
# HTTP/1.1 301 Moved Permanently
# Location: https://reportes.progressiagroup.com
# (Si Certbot ya forzó redirección)

# Prueba con verbose (ver headers)
curl -I -v http://reportes.progressiagroup.com

# Prueba con HEAD request
curl -I --head http://reportes.progressiagroup.com
```

**Si falla:**
- `Connection refused`: Nginx no está corriendo → `sudo systemctl status nginx`
- `Cannot resolve host`: DNS no propagó → Espera o verifica registro
- `HTTP 502 Bad Gateway`: Aplicación no corre en :4000 → `sudo netstat -tlnp | grep 4000`
- `HTTP 403 Forbidden`: Permisos Nginx → Revisa `/etc/nginx/sites-available/reportes.progressiagroup.com`

---

### 3️⃣ Acceso HTTPS (Con Certificado)

Verifica HTTPS después de ejecutar `enable_https.sh`:

```bash
# Prueba con curl (ignora verificación certificado al principio)
curl -I https://reportes.progressiagroup.com

# Resultado esperado:
# HTTP/1.1 200 OK
# Server: nginx/...

# Prueba con verbose
curl -I -v https://reportes.progressiagroup.com

# Con verificación SSL estricta (debe pasar si certificado es válido)
curl -I --insecure https://reportes.progressiagroup.com
```

**Si falla:**
- `SSL: CERTIFICATE_VERIFY_FAILED`: Certificado no válido
  - Verifica: `sudo certbot certificates`
  - Revisa logs: `sudo journalctl -u nginx -n 50`
- `Connection refused (443)`: Puerto 443 no abierto
  - Verifica firewall: `sudo ufw status`
  - O: `sudo firewall-cmd --list-all`
- `HTTP 502 Bad Gateway`: Aplicación no está disponible

---

### 4️⃣ Certificado SSL/TLS

Verifica detalles del certificado:

```bash
# Método 1: openssl s_client (completo)
openssl s_client -connect reportes.progressiagroup.com:443 -servername reportes.progressiagroup.com < /dev/null | openssl x509 -noout -issuer -subject -dates

# Resultado esperado (similar a):
# issuer=C = US, O = Let's Encrypt, CN = R3
# subject=CN = reportes.progressiagroup.com
# notBefore=Nov  4 12:00:00 2025 GMT
# notAfter=Feb   2 12:00:00 2026 GMT

# Método 2: certbot list (desde servidor)
sudo certbot certificates

# Resultado esperado:
# Certificate Name: reportes.progressiagroup.com
# Domains: reportes.progressiagroup.com
# Expiry Date: 2026-02-02 12:00:00+00:00

# Método 3: Verifica chain
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts < /dev/null

# Verifica ubicación de certificados
sudo ls -la /etc/letsencrypt/live/reportes.progressiagroup.com/
# Debe mostrar:
# - cert.pem (certificado)
# - privkey.pem (clave privada)
# - chain.pem (cadena)
# - fullchain.pem (full chain)
```

**Si tiene problemas:**
- `notAfter` en el pasado → Certificado expirado, ejecuta: `sudo certbot renew`
- `issuer` no es Let's Encrypt → Certificado no se emitió correctamente
- Archivos no existen → Certbot no emitió certificado, revisa: `sudo certbot renew --dry-run`

---

### 5️⃣ Redirección HTTP → HTTPS

Verifica que HTTP redirige a HTTPS:

```bash
# Sin seguir redirección (muestra Location header)
curl -I http://reportes.progressiagroup.com

# Resultado esperado:
# HTTP/1.1 301 Moved Permanently
# Location: https://reportes.progressiagroup.com/

# Siguiendo redirección (hasta HTTPS)
curl -I -L http://reportes.progressiagroup.com

# Resultado esperado:
# HTTP/1.1 301 Moved Permanently
# Location: https://reportes.progressiagroup.com/
# ...
# HTTP/1.1 200 OK
# (El 200 es de la URL HTTPS)

# Con verbose
curl -v -L http://reportes.progressiagroup.com 2>&1 | head -30
```

**Si falla:**
- Sin redirección (devuelve 200 en HTTP): `sudo certbot renew` o revisa config Nginx
- Redirección infinita (redirect loop): Revisa Nginx config, probablemente error en proxy_set_header X-Forwarded-Proto

---

### 6️⃣ Nginx - Sintaxis y Estado

Verifica que Nginx está funcionando correctamente:

```bash
# Valida sintaxis (sin recargar)
sudo nginx -t

# Resultado esperado:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Verifica estado del servicio
sudo systemctl status nginx

# Resultado esperado:
# ● nginx.service - A high performance web server...
#    Loaded: loaded
#    Active: active (running)

# Ver proceso nginx
sudo ps aux | grep nginx

# Resultado esperado:
# root     12345  0.0  0.1 123456 67890 ?  Ss  12:00  0.00 nginx: master process
# www-data 12346  0.0  0.2 234567 78901 ?  S   12:00  0.01 nginx: worker process
```

**Si falla:**
- Sintaxis inválida: Revisa archivo `/etc/nginx/sites-available/reportes.progressiagroup.com`
- No está activo: `sudo systemctl start nginx`
- Error de permisos: Verifica propiedad: `sudo chown -R root:root /etc/nginx`

---

### 7️⃣ Firewall - Puertos Abiertos

Verifica que puertos 80 y 443 están abiertos:

```bash
# UFW (Debian/Ubuntu)
sudo ufw status

# Resultado esperado:
# Status: active
# To                         Action      From
# --                         ------      ----
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere

# O con verbose
sudo ufw status verbose

# Verifica con netstat/ss (qué está escuchando)
sudo ss -tlnp | grep -E ':(80|443)'

# Resultado esperado:
# LISTEN 0  128  0.0.0.0:80   0.0.0.0:*  users:(("nginx",pid=12345,fd=3))
# LISTEN 0  128  0.0.0.0:443  0.0.0.0:*  users:(("nginx",pid=12346,fd=4))

# firewalld (RHEL/CentOS)
sudo firewall-cmd --list-all

# Resultado esperado (debe mostrar http y https en services)
# services: dhcpv6-client http https ...
```

**Si puertos no están abiertos:**
- UFW: `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`
- firewalld: `sudo firewall-cmd --permanent --add-service=http --add-service=https && sudo firewall-cmd --reload`

---

### 8️⃣ Logs Nginx

Revisa logs para detectar problemas:

```bash
# Logs de acceso (últimas líneas)
sudo tail -f /var/log/nginx/reportes.progressiagroup.com.access.log

# Ejemplo de log exitoso:
# 145.79.0.77 - - [04/Nov/2025:13:00:00 +0000] "GET / HTTP/1.1" 200 1234 "-" "curl/7.68.0"

# Logs de error
sudo tail -f /var/log/nginx/reportes.progressiagroup.com.error.log

# Ver número de líneas antes
sudo tail -n 50 /var/log/nginx/reportes.progressiagroup.com.error.log

# Todos los logs nginx
sudo journalctl -u nginx --no-pager | tail -50

# Búsqueda de errores
sudo grep ERROR /var/log/nginx/reportes.progressiagroup.com.error.log
```

**Errores comunes en logs:**
- `502 Bad Gateway`: Aplicación no escucha en :4000
- `upstream timed out`: Aplicación lenta, aumenta timeouts en Nginx config
- `Permission denied`: Permisos de archivo, verifica propiedad

---

### 9️⃣ WebSockets (Si Aplica)

Si la aplicación usa WebSockets, verifica:

```bash
# Método 1: Instala wscat
npm install -g wscat

# Conexión WebSocket (insegura, si HTTP aún disponible)
wscat -c ws://reportes.progressiagroup.com

# Conexión WebSocket (segura, HTTPS)
wscat -c wss://reportes.progressiagroup.com

# Si conecta, verás: Connected (press CTRL+C to quit)
# Escribe un mensaje y presiona enter

# Método 2: Usa curl para probar (solo verifica headers upgrade)
curl -I -N -H "Upgrade: websocket" -H "Connection: Upgrade" \
  https://reportes.progressiagroup.com

# Resultado esperado:
# HTTP/1.1 101 Switching Protocols
```

**Si WebSockets fallan:**
- Verifica que Nginx tiene estos headers:
  ```nginx
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  ```
- Revisa logs de aplicación: ¿recibes conexión en :4000?

---

### 🔟 Renovación de Certificado

Verifica que renovación automática está configurada:

```bash
# Ver certificados y fecha de expiración
sudo certbot certificates

# Resultado esperado:
# Certificate Name: reportes.progressiagroup.com
# Expiry Date: 2026-02-02 12:00:00+00:00 (60+ días)

# Ver timer de renovación (systemd)
sudo systemctl status certbot.timer

# Resultado esperado:
# ● certbot.timer - Certbot automatic renewal timer
#    Loaded: loaded
#    Active: active (waiting)

# Próximo intento de renovación
sudo systemctl list-timers certbot.timer

# Resultado esperado:
# NEXT                        LEFT       LAST PASSED UNIT
# Wed 2025-11-05 03:00:00 UTC 2h 34min  n/a  n/a   certbot.timer

# Prueba renovación (dry-run, no emite ni modifica)
sudo certbot renew --dry-run

# Resultado esperado:
# Checking for new version of certbot...
# Preparing to renew certificate for reportes.progressiagroup.com
# The dry run was successful.

# Ver cron job (si no usa systemd)
sudo crontab -l | grep certbot
```

**Si renovación no está configurada:**
- Systemd: `sudo systemctl enable certbot.timer && sudo systemctl start certbot.timer`
- Cron: Crea tarea manual (ver output de enable_https.sh)

---

## 🔍 Diagnóstico Completo (Script)

Ejecuta este script para una verificación completa:

```bash
#!/bin/bash
FQDN="reportes.progressiagroup.com"
echo "=== DIAGNÓSTICO NGINX + HTTPS ==="
echo ""
echo "1. DNS:"
dig +short ${FQDN}
echo ""
echo "2. HTTP accesible:"
curl -I http://${FQDN}
echo ""
echo "3. HTTPS accesible:"
curl -I https://${FQDN}
echo ""
echo "4. Certificado:"
openssl s_client -connect ${FQDN}:443 -servername ${FQDN} < /dev/null 2>/dev/null | \
  openssl x509 -noout -issuer -subject -dates
echo ""
echo "5. Nginx status:"
sudo systemctl status nginx
echo ""
echo "6. Nginx syntax:"
sudo nginx -t
echo ""
echo "7. Firewall:"
sudo ufw status | grep -E "80|443"
echo ""
echo "8. Certbot:"
sudo certbot certificates
echo ""
echo "9. Renewal timer:"
sudo systemctl status certbot.timer
echo ""
```

---

## ✅ Checklist de Completitud

**Antes de considerar "Listo para Producción":**

- [ ] DNS propaga correctamente (dig devuelve 145.79.0.77)
- [ ] HTTP accesible sin errores (curl -I http://...)
- [ ] HTTPS accesible sin errores (curl -I https://...)
- [ ] Certificado es válido y de Let's Encrypt
- [ ] Certificado expira 60+ días en el futuro
- [ ] Redirección 80→443 activa
- [ ] Nginx no muestra errores en logs
- [ ] Puertos 80 y 443 están abiertos en firewall
- [ ] Renovación automática está configurada
- [ ] Renovación dry-run es exitosa
- [ ] Aplicación responde correctamente en :4000
- [ ] WebSockets funcionan (si aplica)
- [ ] Nginx sobrevive reinicio del servidor

---

## 🚨 Troubleshooting Rápido

| Síntoma | Causa Probable | Solución |
|---------|---|---|
| `Connection refused` en puerto 80 | Nginx no corre | `sudo systemctl start nginx` |
| `DNS resolution failed` | DNS no propaga | Espera 48h, verifica registro HostGator |
| `SSL: CERTIFICATE_VERIFY_FAILED` | Certificado no válido | `sudo certbot certificates` y `sudo certbot renew` |
| `502 Bad Gateway` | App no escucha en :4000 | Verifica: `sudo netstat -tlnp \| grep 4000` |
| HTTP no redirige a HTTPS | Certbot no ejecutó `--redirect` | `sudo certbot renew` o edita config manualmente |
| Certificado "invalid" | Emitió mal o expiró | `sudo certbot certificates` y renueva si necesario |
| Timeout en curl | Firewall bloquea o app lenta | Verifica firewall y logs de app |

---

## 📞 Contacto & Referencia

**Documentación:**
- Nginx docs: https://nginx.org/en/docs/
- Certbot docs: https://certbot.eff.org/docs/
- Let's Encrypt: https://letsencrypt.org/

**Logs importantes:**
- Nginx access: `/var/log/nginx/reportes.progressiagroup.com.access.log`
- Nginx error: `/var/log/nginx/reportes.progressiagroup.com.error.log`
- Certbot: `sudo journalctl -u certbot`
- Nginx service: `sudo journalctl -u nginx`

---

**Última actualización:** Noviembre 4, 2025  
**Status:** ✅ LISTO PARA PRODUCCIÓN
