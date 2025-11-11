# Configuración de DNS para reportes.progressiagroup.com

**Fecha:** Noviembre 4, 2025  
**Dominio:** progressiagroup.com  
**Subdominio:** reportes  
**FQDN:** reportes.progressiagroup.com  
**IP de Destino:** 145.79.0.77

---

## 🌍 Introducción

Este documento explica cómo configurar el registro DNS necesario para que `reportes.progressiagroup.com` resuelva a la IP del servidor de producción (`145.79.0.77`).

**Nota importante:** DNS no enruta puertos. El puerto 4000 se maneja internamente en el servidor a través de Nginx como reverse proxy en puerto 80/443.

---

## 🔧 Pasos en HostGator (Panel de Control)

Asume que ya tienes acceso al panel de HostGator para el dominio `progressiagroup.com`.

### Paso 1: Acceder al Panel de Administración de DNS

1. Inicia sesión en [HostGator](https://www.hostgator.com/)
2. Ve a **Mi Cuenta** → **Dominios**
3. Localiza `progressiagroup.com` en tu lista de dominios
4. Haz clic en **Administrar DNS** o **Editar zona DNS**

### Paso 2: Crear Registro A para 'reportes'

En la sección de registros DNS, busca la opción para **Agregar Registro** o **Crear Registro**.

Rellena los campos así:

| Campo | Valor |
|-------|-------|
| **Tipo** | A |
| **Host/Nombre** | reportes |
| **Valor/IP** | 145.79.0.77 |
| **TTL** | 300 (o 900 para cambios rápidos) |

**Detalles:**

- **Tipo A:** Especifica que es una dirección IPv4
- **Host 'reportes':** Crea el subdominio `reportes.progressiagroup.com`
- **IP 145.79.0.77:** El servidor donde está instalado Nginx + aplicación
- **TTL 300-900:** Tiempo en segundos que cachea el registro. Bajo = cambios rápidos, alto = menos carga DNS

### Paso 3: Guardar Cambios

Haz clic en **Guardar** o **Aplicar cambios**.

---

## ⏱️ Propagación de DNS

Después de crear el registro:

- **Tiempo típico:** 5-30 minutos
- **Tiempo máximo:** Hasta 48 horas (casos raros)
- **TTL:** Influye en cuánto tarda. TTL bajo (300s) = cambios rápidos, TTL alto = propagación más lenta pero más estable

**Para acelerar:**

1. Borra caché local (si es necesario):

```bash
# Windows
ipconfig /flushdns

# Linux/Mac
sudo dscacheutil -flushcache
```

2. Prueba con servidor DNS público:

```bash
dig +short reportes.progressiagroup.com @8.8.8.8
dig +short reportes.progressiagroup.com @1.1.1.1
```

---

## ✅ Verificar DNS Propagado

### Método 1: dig (Recomendado en Linux/Mac)

```bash
dig reportes.progressiagroup.com
```

Busca en la sección "ANSWER SECTION":

```
reportes.progressiagroup.com. 300 IN A 145.79.0.77
```

### Método 2: nslookup (Windows/Mac/Linux)

```bash
nslookup reportes.progressiagroup.com
```

Resultado esperado:

```
Name:    reportes.progressiagroup.com
Address: 145.79.0.77
```

### Método 3: host (Linux/Mac)

```bash
host reportes.progressiagroup.com
```

Resultado esperado:

```
reportes.progressiagroup.com has address 145.79.0.77
```

### Método 4: Online (Desde navegador)

Usa herramientas online como:

- [dnschecker.org](https://dnschecker.org/) - Visualiza propagación global
- [mxtoolbox.com](https://mxtoolbox.com/) - Completo
- [whatsmydns.net](https://whatsmydns.net/) - Verifica múltiples nameservers

---

## 🔄 Resolver Problemas Comunes

### "DNS no resuelve después de 30 minutos"

**Verificar:**

1. ¿El registro se guardó en HostGator?
   - Vuelve a entrar al panel y confirma el A record existe

2. ¿El valor de IP es correcto?
   ```bash
   dig reportes.progressiagroup.com @ns1.hostgator.com
   # Reemplaza ns1 con tu nameserver primario
   ```

3. ¿Nameservers correctos?
   ```bash
   dig ns progressiagroup.com
   ```
   Debe mostrar los nameservers de HostGator (típicamente ns1/ns2.hostgator.com)

4. ¿TTL bajo para cambios rápidos?
   - Intenta TTL = 300 en lugar de 3600

### "Resuelve a IP antigua"

- Espera a que expire el TTL (ver "ANSWER SECTION" en dig para el valor actual)
- O limpia caché: `ipconfig /flushdns` (Windows)

### "Registro A existe pero no funciona HTTP"

- DNS OK, pero Nginx/App problema
- Verifica: `curl -I http://145.79.0.77` (IP directa)
- Si directa funciona, revisa configuración Nginx

---

## 📝 Otros Registros (Opcionales)

Si deseas también configurar `www.reportes.progressiagroup.com`:

| Tipo | Host | Valor |
|------|------|-------|
| A | reportes | 145.79.0.77 |
| CNAME | www.reportes | reportes.progressiagroup.com |

---

## 🔐 Consideraciones de Seguridad

1. **No expongas la IP públicamente** en documentación
2. Considera usar **DNS masking** si necesitas privacidad
3. Mantén **registros de auditoría** de cambios DNS
4. Revisa periódicamente registros innecesarios

---

## 📞 Notas Finales

- **DNS no es reversible:** Cambios tardan en propagarse (usa TTL bajo si esperas cambios)
- **Nameservers:** Si cambias de registrar, actualiza nameservers en el nuevo proveedor
- **MX Records:** No necesarios para la aplicación web, pero útiles si usas email

**Referencia:**

- HostGator Help: <https://www.hostgator.com/help>
- DNS Basics: <https://www.cloudflare.com/learning/dns/what-is-dns/>
- Validador DNS DNSSEC: <https://dnsviz.net/>

---

**Última actualización:** Noviembre 4, 2025  
**Status:** ✅ LISTO PARA IMPLEMENTAR
