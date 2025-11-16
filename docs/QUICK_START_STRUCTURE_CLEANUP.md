# 📋 GUÍA RÁPIDA: Reorganizar Root Directory
**Generado:** Nov 16, 2025 | **Autoridad:** FILE_STRUCTURE_PROTOCOL.md | **Estatus:** LISTO

---

## 🎯 OBJETIVO
Mover 25+ archivos misplaced a ubicaciones correctas según protocolo de gobernanza.

## ✅ ARCHIVOS QUE PERMANECEN (NO mover)
```
README.md                       ✅ Punto entrada
CHANGELOG.md                    ✅ Historial
package.json / package-lock.json ✅ NPM
.git*, .vscode, .meta, .github, .husky  ✅ Config sistema
LICENSE, .editorconfig, .eslintrc.json, .prettierrc.json  ✅ Config proyecto
client/, server/, tests/, docs/, backups/, config/, assets/  ✅ Directorios
```

---

## 🚀 INSTRUCCIONES POR CATEGORÍA

### 1️⃣ DOCUMENTACIÓN (6 archivos → docs/)

```powershell
# Crear carpetas
mkdir -Force docs\guides, docs\technical, docs\deployment, docs\validation

# Mover archivos (usar git mv para preservar historio)
git mv DEPLOYMENT_COMPLETE.md docs/deployment/
git mv WEBHOOK_DEPLOYED.md docs/deployment/
git mv WEBHOOK_DEPLOYMENT_READY.md docs/deployment/
git mv HOW_TO_VERIFY_WEBHOOK.md docs/validation/
git mv WEBHOOK_VERIFICATION.md docs/validation/
git mv ERRORS_FIXED.md docs/technical/

# Commit
git commit -m "refactor: move documentation to docs/ subdirectories"
```

### 2️⃣ CONFIGURACIÓN (8 archivos → config/)

#### A. Docker Files
```powershell
mkdir -Force config\docker
git mv docker-compose-prod.yml config/docker/
git mv docker-compose-prod-hardened.yml config/docker/
git mv Dockerfile config/docker/
git commit -m "refactor: move Docker files to config/docker/"
```

#### B. Nginx Config
```powershell
mkdir -Force config\nginx
git mv nginx-citizen-reports.conf config/nginx/citizen-reports.conf
git mv nginx-citizen-reports-ssl.conf config/nginx/citizen-reports-ssl.conf
git mv nginx-webhook.conf config/nginx/webhook.conf
git commit -m "refactor: move Nginx configs to config/nginx/"
```

#### C. Traefik Config
```powershell
mkdir -Force config\traefik
git mv traefik-citizen-reports.yml config/traefik/citizen-reports.yml
git commit -m "refactor: move Traefik config to config/traefik/"
```

#### D. PM2 Config
```powershell
mkdir -Force config\pm2
git mv pm2-webhook.config.cjs config/pm2/webhook.config.cjs
git commit -m "refactor: move PM2 config to config/pm2/"

# ⚠️ CRÍTICO: Actualizar referencias en:
# - server/webhook-github-auto-deploy.js
# - .github/workflows/
# Buscar: pm2-webhook.config.cjs
# Reemplazar por: config/pm2/webhook.config.cjs
```

### 3️⃣ TEST OUTPUTS (4 archivos → test-results/)

```powershell
mkdir -Force test-results
git mv full-test-output.txt test-results/
git mv test-output.txt test-results/
git mv test-final-run.txt test-results/
git mv playwright-report test-results/
git commit -m "refactor: move test outputs to test-results/"
```

### 4️⃣ LIMPIAR MALFORMADOS (2+ archivos)

```powershell
# Verificar contenido
cat ./-sk
cat ./dy

# Si son errores, eliminar:
git rm -f ./-sk
git rm -f ./dy
git commit -m "chore: remove malformed files"
```

### 5️⃣ CONSOLIDAR DUPLICADOS (2 carpetas)

```powershell
# Opción A: Consolidar prompts a ai/
mkdir -Force ai\prompts
git mv prompts/* ai/prompts/
git rm -d prompts
git commit -m "refactor: consolidate prompts to ai/prompts/"

# Opción B: Consolidar surgery (si es duplicado)
# Revisar contenido primero:
ls surgery
ls code_surgeon/surgery

# Si idéntico, eliminar raíz:
git rm -r surgery
git commit -m "chore: remove duplicate surgery directory"
```

---

## 🔒 ACTUALIZAR REFERENCIAS POST-MIGRACIÓN

Buscar y reemplazar en los siguientes archivos:

### Archivo: `server/webhook-github-auto-deploy.js`
```javascript
// ANTES:
const PM2_CONFIG = './pm2-webhook.config.cjs';

// DESPUÉS:
const PM2_CONFIG = './config/pm2/webhook.config.cjs';
```

### Archivos: `.github/workflows/*.yml`
```yaml
# ANTES:
run: pm2 start pm2-webhook.config.cjs

# DESPUÉS:
run: pm2 start config/pm2/webhook.config.cjs
```

### Archivo: `Dockerfile` (si está en raíz)
```dockerfile
# ANTES:
COPY nginx-*.conf /etc/nginx/conf.d/
COPY docker-compose*.yml .

# DESPUÉS:
COPY config/nginx/*.conf /etc/nginx/conf.d/
COPY config/docker/docker-compose*.yml .
```

---

## 🛡️ VALIDACIÓN POST-MIGRACIÓN

```powershell
# 1. Verificar estructura completa
tree config/ -L 2
tree docs/ -L 2

# 2. Ejecutar tests (verifica que rutas relativas funcionan)
npm run test:all

# 3. Verificar que pre-commit hook funciona
git add .
git commit -m "test: verify structure enforcement"  # Debería pasar

# 4. Verificar deployment funciona
# Hacer push y validar webhook deployment

# 5. Verificar git history
git log --oneline -20
```

---

## ⚡ QUICK REFERENCE: Ubicación Correcta

| Tipo de Archivo | Ubicación | Ejemplos |
|---|---|---|
| Documentación .md | `docs/deployment/`, `docs/validation/`, `docs/technical/` | WEBHOOK_DEPLOYED.md → docs/deployment/ |
| Docker | `config/docker/` | docker-compose, Dockerfile |
| Nginx | `config/nginx/` | *.conf files |
| Traefik | `config/traefik/` | *.yml files |
| PM2 | `config/pm2/` | *.config.cjs |
| Scripts | `scripts/` | *.ps1, *.js runners |
| Test Output | `test-results/` | *.txt, reports/ |
| Código Frontend | `client/` | ✅ Ya está bien |
| Código Backend | `server/` | ✅ Ya está bien |
| Tests | `tests/` | ✅ Ya está bien |

---

## 📊 RESUMEN DE CAMBIOS

```
Antes:
├── DEPLOYMENT_COMPLETE.md        ❌
├── WEBHOOK_DEPLOYED.md           ❌
├── docker-compose-prod.yml       ❌
├── Dockerfile                    ❌
├── nginx-*.conf                  ❌
├── pm2-webhook.config.cjs        ❌
├── full-test-output.txt          ❌
├── playwright-report/            ❌
└── [otros 15+ archivos]          ❌

Después:
├── docs/
│   ├── deployment/
│   │   ├── DEPLOYMENT_COMPLETE.md    ✅
│   │   ├── WEBHOOK_DEPLOYED.md       ✅
│   ├── validation/
│   │   ├── HOW_TO_VERIFY_WEBHOOK.md  ✅
│   ├── technical/
│   │   ├── ERRORS_FIXED.md           ✅
├── config/
│   ├── docker/
│   │   ├── docker-compose-prod.yml   ✅
│   │   ├── Dockerfile                ✅
│   ├── nginx/
│   │   ├── citizen-reports.conf      ✅
│   ├── pm2/
│   │   ├── webhook.config.cjs        ✅
├── test-results/
│   ├── full-test-output.txt          ✅
│   ├── playwright-report/            ✅
```

---

## ⏱️ TIEMPO ESTIMADO
- Documentación: 2 minutos
- Configuración: 5 minutos
- Test outputs: 2 minutos
- Limpiar: 2 minutos
- Actualizar referencias: 5 minutos
- Validar: 5 minutos
- **TOTAL: ~20 minutos**

---

## ✨ BENEFICIOS
✅ Cumplimiento con protocolo de gobernanza  
✅ Estructura clara y mantenible  
✅ Pre-commit hook previene futuros misplacements  
✅ Más fácil para onboarding de nuevos developers  
✅ Mejor organización de archivos por tipo  

---

**SIGUIENTE:** Ejecutar movimientos siguiendo orden, luego correr validación.

