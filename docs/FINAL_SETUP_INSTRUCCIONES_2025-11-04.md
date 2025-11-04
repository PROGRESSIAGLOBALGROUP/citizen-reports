# 🎯 CONFIGURACIÓN FINAL - GitHub Webhook Setup

**Fecha:** 4 de Noviembre, 2025  
**Estado:** ✅ **LISTO PARA PRODUCCIÓN**

---

## 📊 RESUMEN DEL ESTADO ACTUAL

### ✅ Lo que está HECHO:

1. **Servidor VPS (145.79.0.77):**
   - ✅ Conectado y accesible via SSH
   - ✅ Node.js v20.19.5 instalado
   - ✅ npm v10.8.2 instalado
   - ✅ PM2 v6.0.13 instalado

2. **Repositorio GitHub:**
   - ✅ Código publicado en main branch
   - ✅ Último commit: e37bf34 (Production Deployment infrastructure)
   - ✅ 5 commits anteriores con CLASS MUNDIAL design system

3. **Aplicación en VPS:**
   - ✅ Repository clonado en `/root/citizen-reports`
   - ✅ npm install completado (825 packages)
   - ✅ Frontend compilado (Vite build: 835 kB)
   - ✅ citizen-reports-app ejecutándose en puerto 4000
   - ✅ Webhook server ejecutándose en puerto 3000
   - ✅ PM2 configurado con auto-restart

4. **Infraestructura de Deployment:**
   - ✅ `/root/deploy.sh` - Script de deployment automático
   - ✅ `/root/webhook-server.js` - Servidor de webhooks GitHub
   - ✅ `/root/.pm2/` - Configuración PM2 persistente
   - ✅ `/root/logs/` - Directorio de logs

---

## 📝 LO QUE HACE FALTA (1 PASO FINAL)

### Paso 1: Configurar GitHub Webhook

Este es el ÚNICO paso que falta para activar los deployments automáticos.

#### Opción A: Interface Web de GitHub (Recomendado - 2 minutos)

1. **Abre en el navegador:**
   ```
   https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports/settings/hooks
   ```

2. **Haz clic en "Add webhook"**

3. **Rellena el formulario:**
   ```
   Payload URL:   http://145.79.0.77:3000/webhook
   Content type:  application/json
   Secret:        [VER INSTRUCCIONES ABAJO]
   ```

4. **¿Cuál es el "Secret"?**
   
   El webhook secret es una contraseña que protege el webhook. GitHub la enviará con cada webhook, y nuestro servidor la verificará.

   **GENERAR UN SECRET SEGURO:**
   
   Opción 1 - Online (rápido):
   ```
   Usa: https://www.random.org/strings/
   - Tamaño: 32 caracteres
   - Caracteres: a-z, A-Z, 0-9
   Ejemplo: aBc1d2E3fG4hI5jK6lM7nO8pQ9rS0tU
   ```

   Opción 2 - Terminal (seguro):
   ```bash
   openssl rand -base64 32
   # Salida: aBc1d2E3fG4hI5jK6lM7nO8pQ9rS0tUvWxYzABC1234=
   ```

5. **Selecciona eventos:**
   - ☐ Deselecciona "Push events" primero
   - ☑ Marca SOLO "Push events"
   - ☐ Los demás eventos deseleccionados

6. **Estado Active:**
   - ✅ Marca "Active"

7. **Haz clic en "Add webhook"**

#### Opción B: Terminal (Avanzado - 1 minuto)

Si prefieres usar API de GitHub:

```bash
# Define variables
WEBHOOK_SECRET="tu-secret-aqui"  # Reemplaza con el secret generado
GITHUB_TOKEN="tu-github-token"     # Token con permisos de repo

# Crea el webhook via API
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -d '{
    "name": "web",
    "active": true,
    "events": ["push"],
    "config": {
      "url": "http://145.79.0.77:3000/webhook",
      "content_type": "json",
      "secret": "'$WEBHOOK_SECRET'",
      "insecure_ssl": "0"
    }
  }' \
  https://api.github.com/repos/PROGRESSIAGLOBALGROUP/citizen-reports/hooks
```

---

### Paso 2: Actualizar el Secret en el Servidor (IMPORTANTE!)

Una vez que tengas el secret, debes actualizarlo en el servidor:

```bash
# 1. Conecta al servidor
ssh root@145.79.0.77

# 2. Detén el webhook server
pm2 stop webhook-server

# 3. Elimina el proceso viejo
pm2 delete webhook-server

# 4. Inicia con el nuevo secret
PORT=3000 GITHUB_WEBHOOK_SECRET="tu-secret-aqui" \
pm2 start /root/webhook-server.js --name webhook-server

# 5. Guarda la configuración de PM2
pm2 save

# 6. Verifica que esté online
pm2 status
```

**Resultado esperado:**
```
│ ID │ Name           │ Status │ CPU │ Memory
├────┼────────────────┼────────┼─────┼────────
│ 1  │ citizen-...app │ online │ 0%  │ 50.1MB
│ 3  │ webhook-server │ online │ 0%  │ 18.5MB
```

---

### Paso 3: Probar el Webhook (OPCIONAL - para verificar)

#### Test 1: GitHub Interface
1. Ve a: Settings → Webhooks → Tu webhook
2. Scroll a "Recent Deliveries"
3. Haz clic en la entrega más reciente
4. Haz clic en "Redeliver"
5. Espera 5 segundos
6. Debería mostrar ✅ (código 200)

#### Test 2: Terminal
```bash
# Conecta al servidor
ssh root@145.79.0.77

# Mira los logs del webhook
tail -20 /root/logs/webhook-events.log

# Debería mostrar:
# [2025-11-04T...] ✅ Valid GitHub webhook received from branch: main
# [2025-11-04T...] ✅ Deployment started
```

#### Test 3: Full Deployment Test
1. Haz un cambio pequeño en el código local
   ```bash
   # En tu máquina, haz cambio pequeño, por ejemplo:
   echo "// Test deployment" >> client/src/App.jsx
   git add -A
   git commit -m "test: Deployment test"
   git push origin main
   ```

2. Observa el deployment en el servidor:
   ```bash
   ssh root@145.79.0.77
   tail -f /root/deployment.log
   
   # Debería mostrar:
   # Iniciando deployment...
   # Git pull exitoso
   # npm install completado
   # Frontend compilado
   # App reiniciada con PM2
   ```

3. Verifica que la aplicación esté actualizada:
   ```
   http://145.79.0.77:4000
   ```

---

## 🔄 CÓMO FUNCIONA EL DEPLOYMENT

Una vez que configures el webhook:

```
Desarrollador hace commit en GitHub main
         ↓ (1 segundo)
GitHub envía webhook a http://145.79.0.77:3000/webhook
         ↓ (instantáneo)
Servidor webhook verifica la firma GitHub
         ↓ (si es válida)
Ejecuta /root/deploy.sh que:
  - git pull origin main
  - npm install
  - npm run build (frontend)
  - pm2 restart citizen-reports-app
         ↓ (2-5 segundos)
Aplicación actualizada en http://145.79.0.77:4000
         ↓
Usuarios ven cambios automáticamente!
```

---

## 📋 CHECKLIST FINAL

- [ ] Generé un secret seguro (32 caracteres aleatorios)
- [ ] Añadí webhook en GitHub settings (Settings → Webhooks → Add webhook)
- [ ] Payload URL: `http://145.79.0.77:3000/webhook`
- [ ] Secret: Peguél el secret generado
- [ ] Content type: `application/json`
- [ ] Events: SOLO "Push events"
- [ ] Active: Marcado ✅
- [ ] Hizo clic en "Add webhook"
- [ ] Actualicé el secret en el servidor (SSH + GITHUB_WEBHOOK_SECRET)
- [ ] Corrí `pm2 save` en servidor
- [ ] Verifiqué `pm2 status` - ambos servicios online
- [ ] Probé con "Recent Deliveries" → Redeliver
- [ ] Verifiqué los logs: `tail -f /root/logs/webhook-events.log`

---

## 🎯 COMANDOS RÁPIDOS (Copy & Paste)

### En tu máquina local (Windows PowerShell):

```powershell
# Ver estado del repositorio
git status

# Hacer cambio de prueba
echo "# test" >> README.md
git add README.md
git commit -m "test: webhook deployment test"
git push origin main

# Esperar 5-10 segundos...
# El deployment debería ejecutarse automáticamente!
```

### En el servidor VPS (SSH):

```bash
# Conectar
ssh root@145.79.0.77

# Ver estado PM2
pm2 status

# Ver logs del webhook
tail -50 /root/logs/webhook-events.log

# Ver logs del deployment
tail -50 /root/deployment.log

# Ver logs de la aplicación
pm2 logs citizen-reports-app --lines 30
```

---

## ⚠️ TROUBLESHOOTING

### "El webhook no está disparándose"

```bash
# 1. Verifica que el servidor esté escuchando
ssh root@145.79.0.77
netstat -tlnp | grep 3000

# 2. Verifica que el proceso esté online
pm2 status

# 3. Verifica el archivo de configuración
cat /root/webhook-server.js | head -30

# 4. Mira los errores
pm2 logs webhook-server --lines 50
```

### "Deployment falla"

```bash
# 1. Ver log de deployment
ssh root@145.79.0.77
tail -100 /root/deployment.log

# 2. Ver log de la aplicación
pm2 logs citizen-reports-app --lines 100

# 3. Verificar que el directorio existe
ls -la /root/citizen-reports/

# 4. Verificar permisos en deploy script
ls -la /root/deploy.sh
```

### "La aplicación no se reinicia"

```bash
# 1. Detener manualmente
ssh root@145.79.0.77
pm2 stop citizen-reports-app

# 2. Iniciar manualmente
pm2 start /root/citizen-reports/server/server.js --name citizen-reports-app

# 3. Verifica que esté online
pm2 status
```

---

## 📞 SOPORTE

Si algo no funciona:

1. **Revisa el checklist** de arriba ✓
2. **Verifica los logs** en el servidor
3. **Prueba manualmente:** `curl http://145.79.0.77:4000`
4. **Verifica GitHub webhook deliveries** en settings

---

## 🎉 ¡Listo!

Cuando termines los pasos de arriba, tu sistema de deployment automático estará activo.

Desde ese momento, cada vez que hagas:
```bash
git push origin main
```

Se ejecutará automáticamente:
1. Webhook en GitHub
2. Deployment en el servidor
3. App actualizada en http://145.79.0.77:4000

**Sin necesidad de acceder al servidor manualmente.**

---

**Last Updated:** 4 Noviembre, 2025  
**Production Server:** 145.79.0.77:4000  
**Webhook Endpoint:** 145.79.0.77:3000/webhook
