# Plan de Reorganización de Archivos - Citizen Reports
**Fecha:** Noviembre 16, 2025  
**Autoridad:** `.meta/FILE_STRUCTURE_PROTOCOL.md`  
**Estatus:** LISTO PARA EJECUCIÓN POR USUARIO  
**Nota:** ⚠️ Este documento SOLO proporciona instrucciones. NO se ejecutarán eliminaciones (privilegio del usuario).

---

## 📋 RESUMEN EJECUTIVO

**Archivos requieren reorganización:** 25+  
**Carpetas a crear:** 7  
**Archivos sin cambios:** 20+ (permitidos en raíz)  
**Impacto:** Compliance con gobierno de repositorio, prevención de futuros misplacements

---

## 🗂️ SECCION 1: DOCUMENTACIÓN MD (6 archivos)

### Paso 1.1: Crear carpetas de documentación
```powershell
# En raíz del proyecto
mkdir -Force docs\guides
mkdir -Force docs\technical
mkdir -Force docs\deployment
mkdir -Force docs\validation
```

### Paso 1.2: Mover archivos de documentación

| Archivo Actual | Destino | Categoría | Razón |
|---|---|---|---|
| `DEPLOYMENT_COMPLETE.md` | `docs/deployment/DEPLOYMENT_COMPLETE.md` | Deployment | Documento sobre finalización de deployment |
| `WEBHOOK_DEPLOYED.md` | `docs/deployment/WEBHOOK_DEPLOYED.md` | Deployment | Documento sobre webhook deployment |
| `WEBHOOK_DEPLOYMENT_READY.md` | `docs/deployment/WEBHOOK_DEPLOYMENT_READY.md` | Deployment | Documento sobre readiness de webhook |
| `HOW_TO_VERIFY_WEBHOOK.md` | `docs/validation/HOW_TO_VERIFY_WEBHOOK.md` | Validation | Guía de verificación |
| `WEBHOOK_VERIFICATION.md` | `docs/validation/WEBHOOK_VERIFICATION.md` | Validation | Documento de verificación |
| `ERRORS_FIXED.md` | `docs/technical/ERRORS_FIXED.md` | Technical | Registro de errores solucionados |

**Instrucciones de movimiento (PowerShell):**
```powershell
# Windows PowerShell (desde raíz del proyecto)
Move-Item .\DEPLOYMENT_COMPLETE.md .\docs\deployment\
Move-Item .\WEBHOOK_DEPLOYED.md .\docs\deployment\
Move-Item .\WEBHOOK_DEPLOYMENT_READY.md .\docs\deployment\
Move-Item .\HOW_TO_VERIFY_WEBHOOK.md .\docs\validation\
Move-Item .\WEBHOOK_VERIFICATION.md .\docs\validation\
Move-Item .\ERRORS_FIXED.md .\docs\technical\

# Verificación
ls docs/deployment/WEBHOOK*.md
ls docs/validation/
ls docs/technical/ERRORS_FIXED.md
```

---

## 🔧 SECCION 2: ARCHIVOS DE CONFIGURACIÓN (8 archivos)

### Paso 2.1: Crear estructura de configuración
```powershell
mkdir -Force config\docker
mkdir -Force config\nginx
mkdir -Force config\traefik
mkdir -Force config\pm2
```

### Paso 2.2: Mover archivos de configuración

#### 2.2.1 Docker Compose Files
| Archivo Actual | Destino | Razón |
|---|---|---|
| `docker-compose-prod.yml` | `config/docker/docker-compose-prod.yml` | Orquestación de contenedores |
| `docker-compose-prod-hardened.yml` | `config/docker/docker-compose-prod-hardened.yml` | Orquestación de contenedores (hardened) |

**Instrucciones:**
```powershell
Move-Item .\docker-compose-prod.yml .\config\docker\
Move-Item .\docker-compose-prod-hardened.yml .\config\docker\

# Verificación
ls config/docker/docker-compose*.yml
```

#### 2.2.2 Dockerfile
| Archivo Actual | Destino | Razón |
|---|---|---|
| `Dockerfile` | `config/docker/Dockerfile` | Especificación de imagen Docker |

**Instrucciones:**
```powershell
Move-Item .\Dockerfile .\config\docker\

# Nota: Actualizar referencias en scripts y GitHub Actions
# Buscar: ENTRYPOINT ["node", "./Dockerfile"]
# Cambiar a: ENTRYPOINT ["node", "./config/docker/Dockerfile"]
```

#### 2.2.3 Nginx Config Files
| Archivo Actual | Destino | Razón |
|---|---|---|
| `nginx-citizen-reports.conf` | `config/nginx/citizen-reports.conf` | Configuración Nginx principal |
| `nginx-citizen-reports-ssl.conf` | `config/nginx/citizen-reports-ssl.conf` | Configuración Nginx SSL |
| `nginx-webhook.conf` | `config/nginx/webhook.conf` | Configuración Nginx webhook |

**Instrucciones:**
```powershell
Move-Item .\nginx-citizen-reports.conf .\config\nginx\
Move-Item .\nginx-citizen-reports-ssl.conf .\config\nginx\
Move-Item .\nginx-webhook.conf .\config\nginx\

# Verificación
ls config/nginx/

# Nota: Actualizar referencias en:
# - Dockerfile: COPY nginx-*.conf → COPY config/nginx/
# - Deploy scripts: referencias a nginx-*.conf
```

#### 2.2.4 Traefik Config
| Archivo Actual | Destino | Razón |
|---|---|---|
| `traefik-citizen-reports.yml` | `config/traefik/citizen-reports.yml` | Configuración Traefik |

**Instrucciones:**
```powershell
Move-Item .\traefik-citizen-reports.yml .\config\traefik\

# Verificación
ls config/traefik/
```

#### 2.2.5 PM2 Config
| Archivo Actual | Destino | Razón |
|---|---|---|
| `pm2-webhook.config.cjs` | `config/pm2/webhook.config.cjs` | Configuración PM2 para webhook |

**Instrucciones:**
```powershell
Move-Item .\pm2-webhook.config.cjs .\config\pm2\

# Verificación
ls config/pm2/

# CRÍTICO: Actualizar referencias en:
# - server/webhook-github-auto-deploy.js
# - Deploy scripts
# - GitHub Actions workflows
# Cambiar de: pm2-webhook.config.cjs
# A: config/pm2/webhook.config.cjs
```

### Paso 2.3: Verificar estructura completa
```powershell
# Tree de config/ después de movimientos
tree config/ -L 2
# Esperado:
# config/
# ├── docker/
# │   ├── docker-compose-prod-hardened.yml
# │   ├── docker-compose-prod.yml
# │   └── Dockerfile
# ├── nginx/
# │   ├── citizen-reports-ssl.conf
# │   ├── citizen-reports.conf
# │   └── webhook.conf
# ├── pm2/
# │   └── webhook.config.cjs
# ├── traefik/
# │   └── citizen-reports.yml
# └── [otros archivos config existentes]
```

---

## 📊 SECCION 3: ARCHIVOS DE PRUEBA (4 archivos)

### Paso 3.1: Mover outputs de pruebas

| Archivo Actual | Destino | Acción |
|---|---|---|
| `full-test-output.txt` | `test-results/full-test-output.txt` | Mover |
| `test-output.txt` | `test-results/test-output.txt` | Mover |
| `test-final-run.txt` | `test-results/test-final-run.txt` | Mover |
| `playwright-report/` | `test-results/playwright-report/` | Mover carpeta |

**Instrucciones:**
```powershell
# Crear test-results si no existe
mkdir -Force test-results

# Mover archivos
Move-Item .\full-test-output.txt .\test-results\ -Force
Move-Item .\test-output.txt .\test-results\ -Force
Move-Item .\test-final-run.txt .\test-results\ -Force

# Mover carpeta de reportes
if (Test-Path .\playwright-report\) {
    Move-Item .\playwright-report\ .\test-results\
}

# Verificación
ls test-results/
```

### Paso 3.2: Actualizar .gitignore para outputs
```powershell
# Agregar a .gitignore
Add-Content .\.gitignore @"

# Test outputs (generados dinámicamente)
test-results/*.txt
test-results/playwright-report/
*.log
"@
```

---

## 🐛 SECCION 4: ARCHIVOS PROBLEMÁTICOS (2+ archivos)

### Paso 4.1: Archivos con nombres malformados
Estos deben ser ELIMINADOS o renombrados (REQUIERE verificación manual):

| Archivo | Estado | Acción Recomendada |
|---|---|---|
| `-sk` | Malformado | ❓ Verificar si es error. Si es: ELIMINAR |
| `dy` | Malformado | ❓ Verificar si es error. Si es: ELIMINAR |

**Investigación recomendada:**
```powershell
# Ver contenido para determinar si son legítimos
cat ./-sk
cat ./dy

# Si son archivos vacíos o errores:
Remove-Item ./-sk
Remove-Item ./dy
```

---

## 📁 SECCION 5: CARPETAS QUE REQUIEREN CONSOLIDACIÓN (2 carpetas)

### Paso 5.1: Consolidar carpeta `prompts/`
Actualmente hay `prompts/` en raíz. Debería estar en `ai/prompts/`:

```powershell
# Ver si existe
ls ai/prompts/

# Si NO existe:
mkdir -Force ai/prompts

# Mover archivos
Move-Item .\prompts\* .\ai\prompts\ -Force

# Eliminar carpeta vacía
Remove-Item .\prompts\ -Force
```

### Paso 5.2: Consolidar carpeta `surgery/`
Actualmente hay `surgery/` en raíz. Debería estar integrada a `code_surgeon/`:

```powershell
# Ver contenido
ls surgery/
ls code_surgeon/

# Esto probablemente es duplicado de code_surgeon/surgery
# Opción 1: Si es idéntico, ELIMINAR surgery/ raíz
Remove-Item .\surgery\ -Recurse -Force

# Opción 2: Si tiene contenido único, mover a code_surgeon/
# Move-Item .\surgery\* .\code_surgeon\ -Force
```

---

## ✅ SECCION 6: ARCHIVOS QUE PERMANECEN EN RAÍZ (VERIFICADO)

Estos archivos **DEBEN** estar en raíz según protocolo. ✅ No mover:

```
✅ README.md                      - Punto entrada del proyecto
✅ CHANGELOG.md                   - Historial de cambios
✅ package.json                   - Definición de dependencias Node
✅ package-lock.json              - Lock file
✅ .gitignore                     - Configuración git
✅ .editorconfig                  - Configuración editor
✅ .prettierrc.json               - Configuración Prettier
✅ .eslintrc.json                 - Configuración ESLint
✅ jest.config.cjs                - Configuración Jest (o en config/)
✅ ecosystem.config.cjs           - PM2 ecosytem (o en config/pm2/)
✅ .husky/                        - Husky hooks
✅ .meta/                         - Governance
✅ .github/                       - GitHub config & workflows
✅ .vscode/                       - VS Code settings
✅ .git/                          - Git repository
✅ .gitattributes                 - Git attributes
✅ LICENSE                        - Licencia
✅ node_modules/                  - Dependencias
✅ client/                        - Frontend
✅ server/                        - Backend
✅ tests/                         - Test suites
✅ docs/                          - Documentación
✅ backups/                       - Database backups
✅ config/                        - Configuración centralizada
✅ ai/                            - AI governance & prompts
✅ code_surgeon/                  - Code modification tools
✅ assets/                        - Recursos del proyecto
✅ test-results/                  - Test output directory
```

---

## 🔐 SECCION 7: PREVENCIÓN DE FUTUROS MISPLACEMENTS

### Paso 7.1: Crear pre-commit hook
Este hook bloquea commits que violen estructura:

**Archivo: `.husky/pre-commit`**

```bash
#!/bin/sh
# Pre-commit hook: Validar estructura de archivos según FILE_STRUCTURE_PROTOCOL.md
# Generado: Nov 16, 2025

set -e

# Obtener archivos staged
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Lista de archivos prohibidos en raíz
PROHIBITED_PATTERNS=(
    "^[^/]*\.md$"           # *.md en raíz (excepto README.md, CHANGELOG.md)
    "^[^/]*\.ps1$"          # *.ps1 en raíz
    "^[^/]*\.yml$"          # *.yml en raíz sin config/
    "^[^/]*\.yaml$"         # *.yaml en raíz sin config/
    "^[^/]*\.conf$"         # *.conf en raíz (nginx)
    "^ecosystem\.config\."  # ecosystem.config en raíz (debería ir a config/pm2/)
    "^pm2-"                 # pm2-* en raíz (debería ir a config/pm2/)
    "^docker-compose"       # docker-compose en raíz (debería ir a config/docker/)
    "^Dockerfile"           # Dockerfile en raíz (debería ir a config/docker/)
    "^nginx-"               # nginx-*.conf en raíz (debería ir a config/nginx/)
    "^traefik-"             # traefik-*.yml en raíz (debería ir a config/traefik/)
)

# Excepciones permitidas
ALLOWED_FILES=(
    "README.md"
    "CHANGELOG.md"
    "package.json"
    "package-lock.json"
    ".gitignore"
    ".editorconfig"
    "LICENSE"
)

VIOLATION_FOUND=false

for FILE in $STAGED_FILES; do
    # Saltar si no está en raíz
    if [[ "$FILE" == *"/"* ]]; then
        continue
    fi
    
    # Saltar archivos permitidos
    ALLOWED=false
    for ALLOWED_FILE in "${ALLOWED_FILES[@]}"; do
        if [[ "$FILE" == "$ALLOWED_FILE" ]]; then
            ALLOWED=true
            break
        fi
    done
    
    if [ "$ALLOWED" = true ]; then
        continue
    fi
    
    # Verificar patrones prohibidos
    for PATTERN in "${PROHIBITED_PATTERNS[@]}"; do
        if [[ "$FILE" =~ $PATTERN ]]; then
            echo "❌ VIOLACIÓN DE ESTRUCTURA: '$FILE' no debe estar en raíz"
            echo "   Consulta .meta/FILE_STRUCTURE_PROTOCOL.md para ubicación correcta"
            echo "   Ejecuta: git reset HEAD $FILE"
            VIOLATION_FOUND=true
        fi
    done
done

if [ "$VIOLATION_FOUND" = true ]; then
    echo ""
    echo "⛔ Commit bloqueado: Archivos violan estructura de repositorio"
    echo "   Mueve archivos a ubicación correcta y reintentar"
    exit 1
fi

exit 0
```

**Instalación:**
```powershell
# Este hook ya debería existir si .husky está inicializado
# Si no existe, crearlo manualmente:

# Windows:
mkdir -Force .husky
New-Item -Path .\.husky\pre-commit -Type File -Force

# Linux/Mac:
touch .husky/pre-commit
chmod +x .husky/pre-commit
```

### Paso 7.2: Actualizar .gitignore global
```powershell
# Agregar a .gitignore (root)
@"

# Patrones para prevenir misplaced files
# Los archivos de configuración pertenecen a config/
docker-compose*.yml
Dockerfile
pm2*.config.cjs
ecosystem*.config.cjs
*.conf
nginx-*.conf
traefik-*.yml

# Los archivos .md (excepto README, CHANGELOG) pertenecen a docs/
# Esto no es un bloqueo, solo documentación

# Test outputs pertenecen a test-results/
*.log
test-output*.txt
full-test-output.txt

# Cache y temporales
.pytest_cache/
*.pyc
__pycache__/
"@ | Add-Content .gitignore
```

### Paso 7.3: Actualizar docs/INDEX.md
Crear o actualizar referencia central:

```markdown
# Índice de Documentación

## Estructura de Carpetas
Ver: .meta/FILE_STRUCTURE_PROTOCOL.md

## Documentación por Categoría

### Deployment (docs/deployment/)
- DEPLOYMENT_COMPLETE.md - Guía de deployment completado
- WEBHOOK_DEPLOYED.md - Webhook deployment status
- WEBHOOK_DEPLOYMENT_READY.md - Readiness checklist
- DEPLOYMENT_PROCESS.md - Proceso completo

### Validación (docs/validation/)
- HOW_TO_VERIFY_WEBHOOK.md - Guía de verificación webhook
- WEBHOOK_VERIFICATION.md - Checklist de verificación

### Técnico (docs/technical/)
- ERRORS_FIXED.md - Registro de bugfixes
- Architecture.md - Arquitectura del sistema
- API.md - Documentación de API

### Configuración
Ver carpeta config/:
- config/docker/ - Configuración Docker & docker-compose
- config/nginx/ - Configuración Nginx
- config/pm2/ - Configuración PM2
- config/traefik/ - Configuración Traefik
```

---

## 🚀 SECCION 8: PASOS DE EJECUCIÓN (CHECKLIST)

### FASE 1: Preparar (5 min)
- [ ] Backup de repo: `git tag backup-pre-structure-cleanup`
- [ ] Crear branches: `git checkout -b refactor/structure-cleanup`
- [ ] Revisar este documento completamente

### FASE 2: Documentación MD (2 min)
- [ ] Crear carpetas en docs/
- [ ] Mover 6 archivos .md
- [ ] `git add docs/` & `git commit -m "refactor: move documentation to docs/ subdirectories"`

### FASE 3: Configuración (5 min)
- [ ] Crear estructura config/
- [ ] Mover 8 archivos de configuración
- [ ] **CRÍTICO:** Actualizar referencias en scripts y Dockerfile
- [ ] `git add config/` & `git commit -m "refactor: consolidate config files to config/"`

### FASE 4: Test Outputs (2 min)
- [ ] Mover archivos .txt a test-results/
- [ ] Actualizar .gitignore
- [ ] `git add test-results/ .gitignore` & commit

### FASE 5: Limpieza (2 min)
- [ ] Investigar y eliminar archivos malformados (-sk, dy)
- [ ] Consolidar prompts/ a ai/prompts/
- [ ] Consolidar surgery/ a code_surgeon/ (o eliminar si duplicado)
- [ ] `git add -A` & commit

### FASE 6: Prevención (5 min)
- [ ] Crear/actualizar pre-commit hook
- [ ] Actualizar .gitignore para patrones prohibidos
- [ ] Actualizar docs/INDEX.md
- [ ] `git add .husky/ .gitignore docs/INDEX.md` & commit

### FASE 7: Validación Final (5 min)
- [ ] Ejecutar tests: `npm run test:all`
- [ ] Verificar no hay warnings pre-commit
- [ ] `git log --oneline -10` verificar histórico limpio
- [ ] Crear PR para review

### FASE 8: Merge (2 min)
- [ ] Merge a main con `git merge --ff-only`
- [ ] Push a GitHub: `git push origin main`
- [ ] Verificar deployment automático vía webhook

---

## 📍 REFERENCIAS Y DOCUMENTOS RELACIONADOS

- **Protocolo de Estructura:** `.meta/FILE_STRUCTURE_PROTOCOL.md`
- **Proyecto:** Citizen Reports - Heatmap de reportes cívicos
- **Autoridad:** Copilot-instructions.md (File Creation Protocol)
- **Gobierno:** .meta/FILE_STRUCTURE_PROTOCOL.md (CRITICAL)

---

## ⚠️ NOTAS IMPORTANTES

1. **NO SE EJECUTARÁN ELIMINACIONES**: Este documento solo proporciona instrucciones. El usuario tiene privilegio exclusivo de eliminar archivos.

2. **ACTUALIZAR REFERENCIAS**: Después de mover archivos de configuración (especialmente `pm2-webhook.config.cjs`), verificar que se actualicen todas las referencias en:
   - `server/webhook-github-auto-deploy.js`
   - `.github/workflows/*.yml`
   - Scripts de deployment
   - Dockerfile

3. **TESTING POST-MIGRACIÓN**: Ejecutar `npm run test:all` después de los movimientos para asegurar que las rutas relativas sigan funcionando.

4. **GIT HISTORY**: Los archivos movidos conservarán su historio git con `git mv` en lugar de `Move-Item`. Usar git cuando sea posible:
   ```powershell
   git mv DEPLOYMENT_COMPLETE.md docs/deployment/
   ```

---

**Estatus:** LISTO PARA EJECUCIÓN  
**Generado:** Nov 16, 2025  
**Por:** GitHub Copilot - Citizen Reports Structure Governance

