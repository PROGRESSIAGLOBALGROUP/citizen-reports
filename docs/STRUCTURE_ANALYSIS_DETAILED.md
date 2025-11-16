# 📊 ANÁLISIS ESTRUCTURAL: Citizen Reports Root Directory
**Generado:** Nov 16, 2025  
**Análisis Por:** GitHub Copilot  
**Autoridad:** `.meta/FILE_STRUCTURE_PROTOCOL.md`  
**Estatus:** LISTO PARA EJECUCIÓN POR USUARIO

---

## 🎯 RESUMEN EJECUTIVO

**Estado Actual:** 45+ archivos en root, muchos violando protocolo  
**Archivos Permitidos:** 20  
**Archivos Que Requieren Mover:** 25+  
**Carpetas a Crear:** 7  
**Tiempo Estimado:** 25 minutos  
**Impacto:** Compliance total, prevención de futuros misplacements  

---

## 📁 INVENTARIO DETALLADO

### ✅ SECCIÓN 1: ARCHIVOS PERMITIDOS EN RAÍZ (NO mover - 20 archivos)

| Archivo | Categoría | Estado | Acción |
|---|---|---|---|
| `README.md` | Punto Entrada | ✅ Correcto | No hacer nada |
| `CHANGELOG.md` | Documentación Especial | ✅ Correcto | No hacer nada |
| `package.json` | NPM Config | ✅ Correcto | No hacer nada |
| `package-lock.json` | NPM Lock | ✅ Correcto | No hacer nada |
| `.gitignore` | Git Config | ✅ Correcto | No hacer nada |
| `.gitattributes` | Git Attributes | ✅ Correcto | No hacer nada |
| `.editorconfig` | Editor Config | ✅ Correcto | No hacer nada |
| `.prettierrc.json` | Prettier Config | ✅ Correcto | No hacer nada |
| `.eslintrc.json` | ESLint Config | ✅ Correcto | No hacer nada |
| `.prettierignore` | Prettier Ignore | ✅ Correcto | No hacer nada |
| `jest.config.cjs` | Jest Config | ⚠️ Puede mover a config/ | Opcional |
| `ecosystem.config.cjs` | PM2 Ecosytem | ⚠️ Puede mover a config/pm2/ | Opcional |
| `LICENSE` | Licencia | ✅ Correcto | No hacer nada |
| `.git/` | Git Repository | ✅ Correcto (oculto) | No hacer nada |
| `.github/` | GitHub Config | ✅ Correcto | No hacer nada |
| `.husky/` | Husky Hooks | ✅ Correcto | Actualizar (✓ Ya hecho) |
| `.meta/` | Governance | ✅ Correcto | No hacer nada |
| `.vscode/` | VS Code Config | ✅ Correcto | No hacer nada |
| `.pytest_cache/` | Pytest Cache | ⚠️ Puede ignorarse | Opcional eliminar |
| `node_modules/` | NPM Packages | ✅ Correcto | No hacer nada |

**Subtotal Permitidos:** 20 ✅

---

### ❌ SECCIÓN 2: ARCHIVOS QUE REQUIEREN MOVER (25+ archivos)

#### 2.1: DOCUMENTACIÓN .md (6 archivos → docs/)

| Archivo Actual | Destino Correcto | Categoría | Prioridad |
|---|---|---|---|
| `DEPLOYMENT_COMPLETE.md` | `docs/deployment/DEPLOYMENT_COMPLETE.md` | Deployment | 🔴 CRÍTICA |
| `WEBHOOK_DEPLOYED.md` | `docs/deployment/WEBHOOK_DEPLOYED.md` | Deployment | 🔴 CRÍTICA |
| `WEBHOOK_DEPLOYMENT_READY.md` | `docs/deployment/WEBHOOK_DEPLOYMENT_READY.md` | Deployment | 🔴 CRÍTICA |
| `HOW_TO_VERIFY_WEBHOOK.md` | `docs/validation/HOW_TO_VERIFY_WEBHOOK.md` | Validation | 🔴 CRÍTICA |
| `WEBHOOK_VERIFICATION.md` | `docs/validation/WEBHOOK_VERIFICATION.md` | Validation | 🔴 CRÍTICA |
| `ERRORS_FIXED.md` | `docs/technical/ERRORS_FIXED.md` | Technical | 🔴 CRÍTICA |

**Comando único:**
```powershell
mkdir -Force docs\guides, docs\technical, docs\deployment, docs\validation; `
git mv DEPLOYMENT_COMPLETE.md docs/deployment/; `
git mv WEBHOOK_DEPLOYED.md docs/deployment/; `
git mv WEBHOOK_DEPLOYMENT_READY.md docs/deployment/; `
git mv HOW_TO_VERIFY_WEBHOOK.md docs/validation/; `
git mv WEBHOOK_VERIFICATION.md docs/validation/; `
git mv ERRORS_FIXED.md docs/technical/; `
git commit -m "refactor: move documentation files to docs/ subdirectories"
```

**Subtotal Docs:** 6 ❌

---

#### 2.2: DOCKER FILES (3 archivos → config/docker/)

| Archivo Actual | Destino | Razón | Prioridad |
|---|---|---|---|
| `docker-compose-prod.yml` | `config/docker/docker-compose-prod.yml` | Orquestación Docker | 🔴 CRÍTICA |
| `docker-compose-prod-hardened.yml` | `config/docker/docker-compose-prod-hardened.yml` | Orquestación Docker | 🔴 CRÍTICA |
| `Dockerfile` | `config/docker/Dockerfile` | Especificación imagen | 🔴 CRÍTICA |

**Comando:**
```powershell
mkdir -Force config\docker; `
git mv docker-compose-prod.yml config/docker/; `
git mv docker-compose-prod-hardened.yml config/docker/; `
git mv Dockerfile config/docker/; `
git commit -m "refactor: move Docker files to config/docker/"
```

**⚠️ DESPUÉS DE MOVER:** Actualizar referencias en `.github/workflows/deploy.yml` si existen

**Subtotal Docker:** 3 ❌

---

#### 2.3: NGINX CONFIG (3 archivos → config/nginx/)

| Archivo Actual | Destino | Razón | Prioridad |
|---|---|---|---|
| `nginx-citizen-reports.conf` | `config/nginx/citizen-reports.conf` | Proxy Nginx | 🔴 CRÍTICA |
| `nginx-citizen-reports-ssl.conf` | `config/nginx/citizen-reports-ssl.conf` | Nginx SSL | 🔴 CRÍTICA |
| `nginx-webhook.conf` | `config/nginx/webhook.conf` | Nginx Webhook | 🔴 CRÍTICA |

**Comando:**
```powershell
mkdir -Force config\nginx; `
git mv nginx-citizen-reports.conf config/nginx/citizen-reports.conf; `
git mv nginx-citizen-reports-ssl.conf config/nginx/citizen-reports-ssl.conf; `
git mv nginx-webhook.conf config/nginx/webhook.conf; `
git commit -m "refactor: move Nginx configs to config/nginx/"
```

**⚠️ DESPUÉS DE MOVER:** Actualizar referencias en Dockerfile y deploy scripts

**Subtotal Nginx:** 3 ❌

---

#### 2.4: PM2 CONFIG (1 archivo → config/pm2/)

| Archivo Actual | Destino | Razón | Prioridad |
|---|---|---|---|
| `pm2-webhook.config.cjs` | `config/pm2/webhook.config.cjs` | PM2 Process | 🔴 CRÍTICA |

**Comando:**
```powershell
mkdir -Force config\pm2; `
git mv pm2-webhook.config.cjs config/pm2/webhook.config.cjs; `
git commit -m "refactor: move PM2 config to config/pm2/"
```

**🔴 CRÍTICO:** Actualizar referencias en:
- `server/webhook-github-auto-deploy.js` (línea con `const PM2_CONFIG = ...`)
- `.github/workflows/deploy.yml` (si existe)
- Deploy script en servidor

**Subtotal PM2:** 1 ❌

---

#### 2.5: TRAEFIK CONFIG (1 archivo → config/traefik/)

| Archivo Actual | Destino | Razón | Prioridad |
|---|---|---|---|
| `traefik-citizen-reports.yml` | `config/traefik/citizen-reports.yml` | Proxy Traefik | 🟡 MEDIA |

**Comando:**
```powershell
mkdir -Force config\traefik; `
git mv traefik-citizen-reports.yml config/traefik/citizen-reports.yml; `
git commit -m "refactor: move Traefik config to config/traefik/"
```

**Subtotal Traefik:** 1 ❌

---

#### 2.6: TEST OUTPUTS (4 archivos → test-results/)

| Archivo Actual | Destino | Razón | Prioridad |
|---|---|---|---|
| `full-test-output.txt` | `test-results/full-test-output.txt` | Test Output | 🟡 MEDIA |
| `test-output.txt` | `test-results/test-output.txt` | Test Output | 🟡 MEDIA |
| `test-final-run.txt` | `test-results/test-final-run.txt` | Test Output | 🟡 MEDIA |
| `playwright-report/` | `test-results/playwright-report/` | Test Report | 🟡 MEDIA |

**Comando:**
```powershell
git mv full-test-output.txt test-results/; `
git mv test-output.txt test-results/; `
git mv test-final-run.txt test-results/; `
git mv playwright-report test-results/; `
git commit -m "refactor: move test outputs to test-results/"
```

**Subtotal Test Outputs:** 4 ❌

---

#### 2.7: DIRECTORIOS CON DUPLICADOS (2 carpetas)

| Carpeta Actual | Acción | Razón | Prioridad |
|---|---|---|---|
| `prompts/` | Consolidar a `ai/prompts/` | Debe estar bajo ai/ | 🟡 MEDIA |
| `surgery/` | Evaluar si es duplicado de `code_surgeon/` | Verificar contenido | 🟡 MEDIA |

**Para prompts:**
```powershell
mkdir -Force ai\prompts; `
git mv prompts/* ai/prompts/; `
git rm -d prompts; `
git commit -m "refactor: consolidate prompts to ai/prompts/"
```

**Para surgery:**
```powershell
# PRIMERO: Verificar contenido
ls surgery/
ls code_surgeon/surgery

# Si es duplicado idéntico:
git rm -r surgery; `
git commit -m "chore: remove duplicate surgery directory"

# Si tiene contenido único:
git mv surgery/* code_surgeon/; `
git rm -d surgery; `
git commit -m "refactor: consolidate surgery to code_surgeon/"
```

**Subtotal Directorios:** 2 ❌

---

### 🚨 SECCIÓN 3: ARCHIVOS PROBLEMÁTICOS (Requieren investigación)

| Archivo | Estado | Acción Recomendada | Prioridad |
|---|---|---|---|
| `-sk` | Nombre malformado | ❓ Verificar contenido, luego eliminar | 🟡 MEDIA |
| `dy` | Nombre malformado | ❓ Verificar contenido, luego eliminar | 🟡 MEDIA |

**Investigación:**
```powershell
# Ver contenido
cat ./-sk
cat ./dy

# Si son archivos vacíos o errores de compilación:
git rm ./-sk
git rm ./dy
git commit -m "chore: remove malformed files"
```

**Subtotal Problemáticos:** 2 ❌

---

## 🔄 TOTAL DE CAMBIOS

| Categoría | Archivos | Acción |
|---|---|---|
| Permitidos en Raíz | 20 | ✅ No mover |
| Documentación MD | 6 | ❌ → docs/ |
| Docker Files | 3 | ❌ → config/docker/ |
| Nginx Config | 3 | ❌ → config/nginx/ |
| PM2 Config | 1 | ❌ → config/pm2/ |
| Traefik Config | 1 | ❌ → config/traefik/ |
| Test Outputs | 4 | ❌ → test-results/ |
| Directorios Duplicados | 2 | ❌ → consolidar |
| Malformados | 2 | ❌ → eliminar |
| **TOTAL** | **27+** | **⚠️ Requieren acción** |

---

## 🛡️ VALIDACIÓN IMPLEMENTADA (✅ YA HECHO)

### Pre-commit Hook
✅ `.husky/pre-commit` actualizado para bloquear:
- Archivos .md en raíz (excepto README.md, CHANGELOG.md)
- Archivos .ps1, .yml, .yaml, .conf en raíz
- Archivos malformados

### Documentación de Reglas
✅ `.gitignore.rules` creado con mapeo completo

### Planes de Ejecución
✅ `docs/FILE_MOVEMENT_PLAN.md` con instrucciones paso a paso
✅ `docs/QUICK_START_STRUCTURE_CLEANUP.md` con referencia rápida

---

## 📋 CHECKLIST DE EJECUCIÓN

### Fase 1: Preparar (5 min)
- [ ] Crear rama de trabajo: `git checkout -b refactor/structure-cleanup`
- [ ] Backup: `git tag backup-pre-cleanup-$(date +%Y%m%d_%H%M%S)`
- [ ] Revisar documentos: `docs/FILE_MOVEMENT_PLAN.md`

### Fase 2: Mover Documentación (2 min)
- [ ] Mover 6 archivos .md a docs/
- [ ] Commit: "refactor: move documentation to docs/"

### Fase 3: Mover Configuración (10 min)
- [ ] Crear estructura config/docker/, config/nginx/, config/pm2/, config/traefik/
- [ ] Mover docker files (3)
- [ ] Mover nginx configs (3)
- [ ] Mover pm2 config (1)
- [ ] Mover traefik config (1)
- [ ] **ACTUALIZAR REFERENCIAS** en archivos que llaman estas rutas
- [ ] Commits por categoría

### Fase 4: Mover Test Outputs (2 min)
- [ ] Mover archivos .txt a test-results/
- [ ] Mover playwright-report/
- [ ] Commit

### Fase 5: Consolidar Directorios (3 min)
- [ ] Consolidar prompts/ a ai/prompts/
- [ ] Evaluar y consolidar surgery/
- [ ] Commits

### Fase 6: Limpiar Malformados (2 min)
- [ ] Investigar -sk y dy
- [ ] Eliminar si no son necesarios
- [ ] Commit

### Fase 7: Validar (5 min)
- [ ] `npm run test:all` - Verificar que todo aún funciona
- [ ] `git log --oneline -10` - Revisar historio
- [ ] Simular commit nuevo - pre-commit hook debe permitir
- [ ] Prueba local de deployment

### Fase 8: Merge y Deploy (5 min)
- [ ] Push de rama: `git push origin refactor/structure-cleanup`
- [ ] Merge a main: `git merge --ff-only`
- [ ] Push a main: `git push origin main`
- [ ] Verificar webhook deployment

---

## ⚠️ REFERENCIAS CRÍTICAS QUE NECESITAN ACTUALIZAR

### 1. `server/webhook-github-auto-deploy.js`
Buscar línea con `pm2-webhook.config.cjs` y actualizar a `config/pm2/webhook.config.cjs`

```javascript
// ANTES:
const PM2_CONFIG_PATH = './pm2-webhook.config.cjs';
or
process.spawn('pm2', ['start', './pm2-webhook.config.cjs']);

// DESPUÉS:
const PM2_CONFIG_PATH = './config/pm2/webhook.config.cjs';
or
process.spawn('pm2', ['start', './config/pm2/webhook.config.cjs']);
```

### 2. `.github/workflows/*.yml` (si existen)
Actualizar referencias a pm2 config

### 3. `Dockerfile` (después de mover)
Si referencias copian archivos de nginx o docker-compose

```dockerfile
# ANTES:
COPY nginx-*.conf /etc/nginx/conf.d/

# DESPUÉS:
COPY config/nginx/*.conf /etc/nginx/conf.d/
```

---

## 🎯 BENEFICIOS POST-EJECUCIÓN

✅ **Compliance 100%:** Cumple con FILE_STRUCTURE_PROTOCOL  
✅ **Prevención:** Pre-commit hook bloquea futuros misplacements  
✅ **Mantenibilidad:** Estructura clara para nuevos developers  
✅ **Búsqueda:** Más fácil encontrar archivos por tipo  
✅ **CI/CD:** Mejor integración con pipelines  
✅ **Documentación:** Acceso centralizado en docs/  

---

## 📊 ESTADO ACTUAL vs POST-MIGRACIÓN

**ANTES:**
```
Raíz con 45+ archivos
- 6 archivos .md misplaced
- 3 docker files misplaced
- 3 nginx configs misplaced
- 1 pm2 config misplaced
- 1 traefik config misplaced
- 4 test output files misplaced
- 2 directorios con duplicados
- 2 archivos malformados
- NO pre-commit validation
```

**DESPUÉS:**
```
Raíz limpio con 20 archivos permitidos
├── docs/
│   ├── deployment/ [3 files]
│   ├── validation/ [2 files]
│   └── technical/ [1 file]
├── config/
│   ├── docker/ [3 files]
│   ├── nginx/ [3 files]
│   ├── pm2/ [1 file]
│   └── traefik/ [1 file]
├── test-results/ [4 files]
├── ai/prompts/ [consolidated]
└── code_surgeon/ [consolidated]

✅ Pre-commit hook activo
✅ Reglas de estructura documentadas
✅ Referencias internas actualizadas
```

---

## 🚀 SIGUIENTE PASO

Ejecutar instrucciones en `docs/QUICK_START_STRUCTURE_CLEANUP.md` o `docs/FILE_MOVEMENT_PLAN.md` siguiendo el orden de fases.

**Tiempo Total Estimado:** 25 minutos  
**Complejidad:** Media (requiere actualizar referencias)  
**Riesgo:** Bajo (git mv preserva historio, cambios revertibles)

---

**Análisis Completado Por:** GitHub Copilot  
**Generado:** Nov 16, 2025  
**Basado En:** FILE_STRUCTURE_PROTOCOL.md + Mejores Prácticas de Gobernanza

