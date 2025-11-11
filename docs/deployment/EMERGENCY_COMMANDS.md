🎯 COMANDO URGENTE PARA TERMINAL WEB DE HOSTINGER
═════════════════════════════════════════════════════════════════════════════════

Copia y pega esto en la terminal web de Hostinger ahora:

```bash
sudo bash /root/enable_https.sh
```

O si lo anterior no funciona, copia esto:

```bash
sudo certbot --nginx -d reportes.progressiagroup.com --agree-tos --redirect --no-eff-email -n
```

Y luego verifica:

```bash
sudo certbot certificates
```

═════════════════════════════════════════════════════════════════════════════════

El servidor responde HTTP correctamente (200 OK).
SSH está temporalmente no disponible, pero Nginx y el sistema están corriendo.

Ejecuta esos comandos en la terminal web y reporta el output.
