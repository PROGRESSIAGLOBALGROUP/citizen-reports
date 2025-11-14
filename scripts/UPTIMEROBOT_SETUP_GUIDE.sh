#!/bin/bash
# 🚨 UptimeRobot Setup Guide
# Configure uptime monitoring with automatic alerts
# This is a MANUAL guide - UptimeRobot is a web service

cat << 'EOF'
╔════════════════════════════════════════════════════════════════════════════╗
║                   🚨 UPTIMEROBOT SETUP GUIDE                             ║
║          Configure External Uptime Monitoring with Alerts                 ║
╚════════════════════════════════════════════════════════════════════════════╝

📋 PASO 1: CREAR CUENTA EN UPTIMEROBOT (Gratuito)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Ir a https://uptimerobot.com/
2. Click en "Sign Up For Free"
3. Llenar formulario:
   - Email: tu@email.com
   - Password: (segura)
   - Username: progressia-citizen-reports
4. Verificar email
5. Login

📋 PASO 2: AGREGAR MONITOR PRINCIPAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Dashboard → "Add New Monitor"
2. Configurar:
   Monitor Type:        HTTPS
   Friendly Name:       citizen-reports Production API
   URL:                 https://reportes.progressiagroup.com/api/reportes
   Check Interval:      5 minutes (cada 5 minutos)
   Timeout:             10 seconds
   Alert Contacts:      (configurar en siguiente paso)

3. Click "Create Monitor"

📋 PASO 3: CONFIGURAR ALERTAS POR EMAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Settings → "Alert Contacts"
2. Click "Add Alert Contact"
3. Tipo: Email
4. Nombre: DevOps Team
5. Email: devops@progressiagroup.com
6. Enviar notificación: Cuando está down/back online

📋 PASO 4: AGREGAR MONITORES SECUNDARIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Crear 3 monitores adicionales para diferentes endpoints:

Monitor 2: Frontend
├─ Type: HTTPS
├─ URL: https://reportes.progressiagroup.com/
├─ Interval: 10 minutes
└─ Alert: Same as Monitor 1

Monitor 3: Health Check
├─ Type: HTTPS
├─ URL: https://reportes.progressiagroup.com/health
├─ Interval: 5 minutes
└─ Alert: Same as Monitor 1

Monitor 4: DNS + Port
├─ Type: TCP (port 443)
├─ Hostname: reportes.progressiagroup.com:443
├─ Interval: 15 minutes
└─ Alert: Same as Monitor 1

📋 PASO 5: CONFIGURAR DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Dashboard → Personalizar vista
2. Orden: Ordena por criticidad
3. Notificaciones: Habilitar sonido
4. Frequency: Mostrar último mes

📋 PASO 6: WEBHOOK PARA NOTIFICACIONES AVANZADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para alertas en Slack/Teams (Opcional pero recomendado):

1. En UptimeRobot → Settings → Alert Contacts
2. Click "Add Alert Contact"
3. Type: Webhook
4. URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
5. Keyword Macros:
   - *[MONITORNAME]* → Nombre del monitor
   - *[STATUS]* → Estado (up/down)
   - *[REASON]* → Razón del downtime
6. Example POST Data:
{
  "text": "[MONITORNAME] is [STATUS] - [REASON]",
  "color": "danger"
}

📋 PASO 7: CONTACTOS ADICIONALES (SMS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UptimeRobot tiene plan PREMIUM con SMS alerts:
- Personal: $9.99/mes (1 contact)
- Professional: $24.99/mes (10 contacts)
- Business: $99.99/mes (100 contacts)

Recomendación: Usar plan Personal para SMS en números críticos

Alternativa GRATUITA: Usar IFTTT
- IFTTT.com → Crear applet
- Trigger: RSS feed from UptimeRobot
- Action: Send SMS via Twilio

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 VERIFICACIÓN FINAL

Después de configurar, verificar:

1. Dashboard muestra 4+ monitores
2. Todos están GREEN (All up)
3. Email test: Click "Send Test Alert"
4. Verificar que recibiste email

Expected Response Times:
  API /api/reportes:  < 200ms
  Frontend /: < 300ms
  Health check: < 100ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 SLA TARGETS

Con esta configuración:
- Detection time: < 5 minutes (intervalo de check)
- Alert time: < 1 minute (email + webhook)
- Total: < 6 minutes desde downtime hasta notificación

Target: 99.5% uptime por mes
- Máximo permitido downtime: 3.6 horas/mes
- En 5 min checks: ~430 checks/mes
- Máximo failures: 43 (10%)

EOF
