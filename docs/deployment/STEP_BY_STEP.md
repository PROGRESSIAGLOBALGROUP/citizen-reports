# Guía Paso a Paso: Nginx Reverse Proxy + HTTPS

**Fecha:** Noviembre 4, 2025  
**Dominio:** reportes.progressiagroup.com  
**IP VPS:** 145.79.0.77  
**Aplicación:** http://127.0.0.1:4000

---

## 📋 Resumen del Proceso

Este documento proporciona instrucciones paso a paso para configurar Nginx como reverse proxy para servir tu aplicación web con HTTPS en producción.

**Orden de ejecución:**

1. Preparar DNS (A record apuntando a 145.79.0.77)
2. Instalar y configurar Nginx con `setup_reverse_proxy.sh`
3. Emitir certificado HTTPS con `enable_https.sh`
4. Verificar todo funciona con `VERIFY.md`

---

## 🌍 PASO 1: Configuración de DNS (HostGator)

### 1.1 Acceder al Panel

- Inicia sesión en HostGator (<https://www.hostgator.com/>)
- Ve a **Mi Cuenta** → **Dominios**
- Busca `progressiagroup.com` y haz clic en **Administrar DNS**

### 1.2 Crear Registro A

Agrega un nuevo registro con estos valores:

```
Tipo: A
Host/Nombre: reportes
Valor: 145.79.0.77
TTL: 300
```

Guarda los cambios.

### 1.3 Verificar Propagación

Espera 5-30 minutos (máximo 48 horas). Verifica con:

```bash
dig reportes.progressiagroup.com
# Debe mostrar: 145.79.0.77
```

**No continúes hasta que DNS resuelva.**

---

## 🔧 PASO 2: Instalar Nginx y Configurar Reverse Proxy

### 2.1 Conectarse al VPS

```bash
ssh root@145.79.0.77
```

### 2.2 Descargar el Script

```bash
cd /root
wget https://your-repo/scripts/setup_reverse_proxy.sh
chmod +x setup_reverse_proxy.sh
```

O cópialo manualmente desde `scripts/setup_reverse_proxy.sh`.

### 2.3 Ejecutar el Script

```bash
sudo bash setup_reverse_proxy.sh
```

El script:
- Detectará tu distribución (Debian/Ubuntu o RHEL-like)
- Instalará Nginx y Certbot
- Abrirá puertos 80 y 443
- Creará configuración Nginx
- Recargará Nginx

**Resultado esperado:**

```
[INFO] Inicando setup de reverse proxy Nginx para reportes.progressiagroup.com
[INFO] Aplicación destino: http://127.0.0.1:4000
...
[INFO] ✓ Nginx recargado exitosamente

==========================================
CONFIGURACIÓN COMPLETADA EXITOSAMENTE
==========================================
```

### 2.4 Verificar HTTP Funciona

```bash
curl -I http://reportes.progressiagroup.com
```

Resultado esperado:

```
HTTP/1.1 200 OK
Server: nginx/...
```

Si no funciona, revisa:

```bash
sudo systemctl status nginx
sudo tail -20 /var/log/nginx/reportes.progressiagroup.com.error.log
```

---

## 🔐 PASO 3: Emitir Certificado HTTPS

### 3.1 Descargar el Script

```bash
cd /root
wget https://your-repo/scripts/enable_https.sh
chmod +x enable_https.sh
```

O cópialo manualmente desde `scripts/enable_https.sh`.

### 3.2 Ejecutar el Script

```bash
sudo bash enable_https.sh
```

El script:
- Verificará DNS propagado
- Verificará acceso HTTP
- Emitirá certificado Let's Encrypt
- Configurará renovación automática
- Probará renovación (dry-run)

**Importante:** Cuando Certbot pregunte, responde:

```
No EFF-EFF email: yes
Redirect HTTP to HTTPS: yes
```

**Resultado esperado:**

```
[STEP] Emitiendo certificado Let's Encrypt...
Executing: certbot --nginx ...

Congratulations! Your certificate has been issued.

[INFO] ✓ Certificado emitido exitosamente
...
[INFO] ✓ Renovación dry-run exitosa

==========================================
CONFIGURACIÓN HTTPS COMPLETADA
==========================================
```

### 3.3 Verificar HTTPS Funciona

```bash
curl -I https://reportes.progressiagroup.com
```

Resultado esperado:

```
HTTP/1.1 200 OK
Server: nginx/...
```

---

## ✅ PASO 4: Verificaciones Finales

### 4.1 Verificar Redirección HTTP → HTTPS

```bash
curl -I http://reportes.progressiagroup.com
```

Resultado esperado:

```
HTTP/1.1 301 Moved Permanently
Location: https://reportes.progressiagroup.com/
```

### 4.2 Verificar Certificado

```bash
openssl s_client -connect reportes.progressiagroup.com:443 \
  -servername reportes.progressiagroup.com < /dev/null | \
  openssl x509 -noout -subject -dates
```

Resultado esperado:

```
subject=CN = reportes.progressiagroup.com
notBefore=Nov  4 12:00:00 2025 GMT
notAfter=Feb   2 12:00:00 2026 GMT
```

### 4.3 Verificar Nginx Sin Errores

```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -20 /var/log/nginx/reportes.progressiagroup.com.error.log
```

Resultado esperado:

```
nginx: the configuration file ... syntax is ok
... Active: active (running)
(sin errores en el log)
```

### 4.4 Verificar Firewall Abierto

```bash
sudo ufw status | grep -E "80|443"
```

Resultado esperado:

```
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### 4.5 Verificar Renovación Configurada

```bash
sudo systemctl status certbot.timer
sudo certbot certificates
```

Resultado esperado:

```
● certbot.timer - ... 
  Active: active (waiting)

Certificate Name: reportes.progressiagroup.com
Expiry Date: 2026-02-02 ...
```

---

## 📱 Prueba de Usuario

Abre en tu navegador:

```
https://reportes.progressiagroup.com
```

Deberías ver:

- ✅ HTTPS con candado verde
- ✅ Tu aplicación cargando desde puerto :4000
- ✅ Sin advertencias de certificado

---

## 🔄 Mantenimiento Periódico

### Renovación Automática

El certificado se renueva automáticamente 30 días antes de expirar (configurado por `enable_https.sh`).

Para verificar:

```bash
sudo certbot renew --dry-run
```

### Revisar Logs Regularmente

```bash
sudo journalctl -u nginx --no-pager | tail -50
sudo tail -50 /var/log/nginx/reportes.progressiagroup.com.error.log
```

### Actualizar Nginx (Anualmente)

```bash
sudo apt update && sudo apt upgrade nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🚨 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| HTTP devuelve 502 | App no corre en :4000. Verifica: `sudo systemctl status your-app` |
| DNS no resuelve | Espera propagación (max 48h) o verifica HostGator panel |
| HTTPS falla "invalid cert" | Ejecuta: `sudo certbot renew` |
| Nginx no reinicia | Verifica sintaxis: `sudo nginx -t` |
| Puertos bloqueados | Firewall. Ejecuta: `sudo ufw allow 80/tcp 443/tcp` |

---

## 📞 Archivos de Referencia

Este paquete incluye:

- `scripts/setup_reverse_proxy.sh` - Instala Nginx, abre puertos, crea config
- `scripts/enable_https.sh` - Emite cert, configura renovación automática
- `docs/deployment/nginx-reportes.progressiagroup.com.conf` - Plantilla config Nginx
- `docs/deployment/DNS_NOTES.md` - Guía detallada DNS
- `docs/deployment/VERIFY.md` - Checklist completo de verificación
- `docs/deployment/STEP_BY_STEP.md` - Este archivo

---

**Última actualización:** Noviembre 4, 2025  
**Status:** ✅ PRODUCCIÓN LISTA
