# 🎬 LISTO: Instrucciones Finales Para Reorganizar Tu Raíz

**Status:** ✅ Análisis Completado | ⏳ Listo para Ejecución | 📱 Solo copiar/pegar

---

## 📌 OPCIÓN 1: SOLO VER RESUMEN (5 min)

```powershell
cat STRUCTURE_CLEANUP_SUMMARY.md
```

---

## 🚀 OPCIÓN 2: EJECUTAR RÁPIDAMENTE (20 min)

### Paso 1: Crear rama de trabajo
```powershell
git checkout -b refactor/structure-cleanup
```

### Paso 2: Crear carpetas necesarias
```powershell
mkdir -Force docs\deployment, docs\validation, docs\technical
mkdir -Force config\docker, config\nginx, config\pm2, config\traefik
mkdir -Force test-results
mkdir -Force ai\prompts
```

### Paso 3: Mover Documentación (2 min)
```powershell
git mv DEPLOYMENT_COMPLETE.md docs/deployment/
git mv WEBHOOK_DEPLOYED.md docs/deployment/
git mv WEBHOOK_DEPLOYMENT_READY.md docs/deployment/
git mv HOW_TO_VERIFY_WEBHOOK.md docs/validation/
git mv WEBHOOK_VERIFICATION.md docs/validation/
git mv ERRORS_FIXED.md docs/technical/
git commit -m "refactor: move documentation files to docs/"
```

### Paso 4: Mover Docker Files (2 min)
```powershell
git mv docker-compose-prod.yml config/docker/
git mv docker-compose-prod-hardened.yml config/docker/
git mv Dockerfile config/docker/
git commit -m "refactor: move Docker files to config/docker/"
```

### Paso 5: Mover Nginx Configs (2 min)
```powershell
git mv nginx-citizen-reports.conf config/nginx/citizen-reports.conf
git mv nginx-citizen-reports-ssl.conf config/nginx/citizen-reports-ssl.conf
git mv nginx-webhook.conf config/nginx/webhook.conf
git commit -m "refactor: move Nginx configs to config/nginx/"
```

### Paso 6: Mover PM2 Config (⚠️ CRÍTICO - 2 min)
```powershell
git mv pm2-webhook.config.cjs config/pm2/webhook.config.cjs
git commit -m "refactor: move PM2 config to config/pm2/"
```

**DESPUÉS DE ESTE PASO:** Ver sección "ACTUALIZAR REFERENCIAS" abajo

### Paso 7: Mover Traefik Config (1 min)
```powershell
git mv traefik-citizen-reports.yml config/traefik/citizen-reports.yml
git commit -m "refactor: move Traefik config to config/traefik/"
```

### Paso 8: Mover Test Outputs (2 min)
```powershell
git mv full-test-output.txt test-results/
git mv test-output.txt test-results/
git mv test-final-run.txt test-results/
git mv playwright-report test-results/
git commit -m "refactor: move test outputs to test-results/"
```

### Paso 9: Consolidar Prompts (1 min)
```powershell
git mv prompts/* ai/prompts/ -Force
git rm -r prompts
git commit -m "refactor: consolidate prompts to ai/prompts/"
```

### Paso 10: Limpiar Malformados (1 min)
```powershell
# Primero verificar si son necesarios
cat ./-sk    # Si es vacío o error:
git rm -f ./-sk

cat ./dy     # Si es vacío o error:
git rm -f ./dy

git commit -m "chore: remove malformed files"
```

---

## 🔄 ACTUALIZAR REFERENCIAS (⚠️ CRÍTICO - 5 min)

Cuando moviste `pm2-webhook.config.cjs` a `config/pm2/webhook.config.cjs`, ahora debes actualizar archivos que lo llaman.

### Archivo: `server/webhook-github-auto-deploy.js`

Busca esta línea:
```javascript
pm2-webhook.config.cjs
```

Reemplaza por:
```javascript
config/pm2/webhook.config.cjs
```

**O en PowerShell:**
```powershell
$file = "server/webhook-github-auto-deploy.js"
(Get-Content $file) -replace 'pm2-webhook\.config\.cjs', 'config/pm2/webhook.config.cjs' | Set-Content $file
git add $file
git commit -m "fix: update PM2 config path reference in webhook deployment script"
```

### Archivo: `.github/workflows/deploy.yml` (si existe)
Busca referencias y actualiza (similar a arriba)

---

## ✅ VALIDACIÓN (5 min)

### Test 1: Verificar estructura creada
```powershell
tree config/ -L 2
tree docs/deployment/ -L 1
ls test-results/
```

### Test 2: Ejecutar tests
```powershell
npm run test:all
```
Debe pasar sin errores

### Test 3: Verificar pre-commit hook funciona
```powershell
# Crear un archivo .md en raíz para probar
echo "test" > test-md-file.md
git add test-md-file.md
git commit -m "test: verify pre-commit hook" # DEBE FALLAR

# Limpiar
git reset HEAD test-md-file.md
rm test-md-file.md
```

---

## 🎯 FINALIZAR (5 min)

### Paso A: Ver cambios
```powershell
git log --oneline -10
```

### Paso B: Mergear
```powershell
git push origin refactor/structure-cleanup
# Luego hacer PR en GitHub y mergear
# O si tienes acceso directo:
git checkout main
git merge refactor/structure-cleanup
git push origin main
```

### Paso C: Verificar webhook deployment
Webhook debe:
1. ✅ Detectar push a main
2. ✅ Ejecutar deploy automático
3. ✅ Usar `config/pm2/webhook.config.cjs` (ruta nueva)

---

## 📊 TIEMPO TOTAL

| Paso | Duración |
|---|---|
| Movimientos de archivos | 15 min |
| Actualizar referencias | 5 min |
| Validación | 5 min |
| Merge & Deploy | 5 min |
| **TOTAL** | **30 min** |

---

## 🆘 SI ALGO VA MAL

### Revertir TODO
```powershell
git reset --hard HEAD~10
# Reemplaza 10 por el número de commits atrás que necesites
```

### Ver qué cambió
```powershell
git diff HEAD~5..HEAD --stat
```

### Revisar un commit específico
```powershell
git show <commit-hash>
```

---

## 💾 ALTERNATIVA: Que lo haga Yo

Si prefieres que lo haga automáticamente:
```
Di: "Adelante Copilot, ejecuta los movimientos"
```

Yo haré:
1. Todos los `git mv`
2. Todos los commits
3. Actualizar referencias automáticamente
4. Validar `npm run test:all`
5. Push a GitHub

**Tiempo:** 5-10 minutos

---

## 📚 ARCHIVOS DE REFERENCIA

Si tienes dudas o preguntas:

| Pregunta | Ver Archivo |
|---|---|
| ¿Por qué X archivo va en Y ubicación? | `docs/STRUCTURE_ANALYSIS_DETAILED.md` |
| ¿Cuál es el comando exacto? | `docs/QUICK_START_STRUCTURE_CLEANUP.md` |
| ¿Cuál es el plan completo? | `docs/FILE_MOVEMENT_PLAN.md` |
| ¿Cuál es el resumen ejecutivo? | `STRUCTURE_CLEANUP_SUMMARY.md` |

---

## ✨ UNA VEZ COMPLETADO

✅ Raíz limpio con ~20 archivos permitidos  
✅ Archivos organizados lógicamente por tipo  
✅ Pre-commit hook previene futuros misplacements  
✅ Documentación centralizada en docs/  
✅ Configuraciones centralizadas en config/  
✅ Tests separados en test-results/  
✅ 100% compliance con FILE_STRUCTURE_PROTOCOL.md  

---

## 🎬 COMENZAR AHORA

### Opción A: Ver guía detallada primero
```powershell
cat docs/QUICK_START_STRUCTURE_CLEANUP.md
```

### Opción B: Comenzar directamente
```powershell
git checkout -b refactor/structure-cleanup
mkdir -Force docs\deployment, docs\validation, docs\technical
# ... ejecutar Paso 2 arriba
```

### Opción C: Que lo haga Copilot
```
Di en el chat: "Ejecuta los movimientos de archivos"
```

---

**¿Listo?** Elige opción A, B o C arriba y comienza.

