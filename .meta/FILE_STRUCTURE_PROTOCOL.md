# 📋 FILE STRUCTURE PROTOCOL - Gobernanza de Archivos

**Versión:** 1.0  
**Fecha Creación:** Octubre 31, 2025  
**Última Actualización:** Octubre 31, 2025  
**Status:** ✅ ACTIVO - Todos deben cumplir

---

## 🎯 PROPÓSITO

Este documento define DÓNDE deben ir los archivos para mantener una estructura **clase mundial** y evitar que el directorio raíz se contamined con archivos que no pertenecen ahí.

**Episodio Anterior (Oct 31):**
- 11 archivos de documentación creados en RAÍz ❌
- Debe haberse criado en `/docs` ✅
- Causó desorden y confusión
- **Solución:** Protocolo obligatorio para futuro

---

## 📂 ESTRUCTURA CORRECTA

### ✅ RAÍZ (Solo 5 Tipos de Archivos)

```
citizen-reports/
├── README.md                    ← Punto entrada principal
├── package.json                 ← Node.js config
├── .gitignore                   ← Git config
├── LICENSE                      ← (Opcional) Licencia
├── CHANGELOG.md                 ← (Opcional) Cambios
├── .github/                     ← GitHub config (directorio)
│   └── copilot-instructions.md
├── .meta/                       ← METADATA (este protocolo)
└── .editorconfig                ← (Opcional) Editor config
```

**PROHIBIDO en raíz:**
- ❌ Documentación técnica (.md adicionales)
- ❌ Scripts de deployment
- ❌ Guías de usuario
- ❌ Resúmenes ejecutivos
- ❌ Índices o mapas
- ❌ Checklists de validación

---

### 📚 `/docs` (Documentación Centralizada)

```
docs/
├── INDEX.md                     ← Master index (ENTRADA)
├── README.md                    ← Overview (opcional)
│
├── guides/                      ← Guías de usuario
│   ├── QUICK_START.md           ← 2 minutos
│   ├── SUMMARY_TODAY.md         ← 1 minuto
│   ├── EXECUTIVE_SUMMARY.md     ← 15 minutos
│   └── ... más guías
│
├── validation/                  ← Checklists y validación
│   ├── VISUAL_VALIDATION.md     ← Paso-a-paso visual
│   ├── VALIDATION_CHECKLIST.md  ← Técnico
│   └── ... más validaciones
│
├── deployment/                  ← Deployment & DevOps
│   ├── README.md                ← Guía completa
│   ├── QUICK_START.md           ← Quick reference
│   ├── INDEX.md                 ← Navigation
│   └── ... más deployment
│
├── technical/                   ← Técnico & arquitectura
│   ├── RESPONSIVE_MOBILE_IMPROVEMENTS.md
│   ├── architecture.md
│   ├── API_SPEC.md
│   └── ... más técnico
│
├── adr/                         ← Architecture Decision Records
│   ├── ADR-0001-bootstrap.md
│   ├── ADR-0002-...md
│   └── ... ADRs
│
└── adr/ (existente)             ← Registros de decisiones
    ├── existentes...
```

**REGLA:** Todos los `.md` excepto `README.md` van en `/docs`

---

### 🔧 `/scripts` (Automation & Maintenance)

```
scripts/
├── deploy.ps1                   ← Deployment automático
├── start-dev.ps1                ← Dev server startup
├── stop-servers.ps1             ← Server shutdown
├── backup-db.ps1                ← Database backup
├── maintenance.js               ← Maintenance tasks
└── ... más scripts
```

**REGLA:** Todos los scripts de automatización van aquí

---

### 📦 `/code_surgeon` (Safe Code Editing)

```
code_surgeon/
├── bin/
├── prompts/
├── tests/
└── ... (Existente - No cambiar)
```

---

### 🧪 `/tests` (Testing)

```
tests/
├── backend/                     ← Jest tests
├── frontend/                    ← Vitest tests
├── e2e/                         ← Playwright tests
└── ... (Existente)
```

---

### ⚙️ `/config` (Configuration Files)

```
config/
├── jest.config.cjs
├── playwright.config.ts
├── vitest.config.ts
└── ... (Existente)
```

---

### 💾 `/.meta` (Protocol & Governance)

```
.meta/
├── FILE_STRUCTURE_PROTOCOL.md   ← ESTE ARCHIVO
├── CHECKLIST_FILE_PLACEMENT.md  ← Validación antes de commit
└── ... governance files
```

---

## 📋 TABLA DE DECISIÓN

**¿Dónde va mi archivo?**

| Tipo de Archivo | Extensión | Ubicación | Ejemplo |
|-----------------|-----------|-----------|---------|
| Documentación de usuario | `.md` | `docs/guides/` | `QUICK_START.md` |
| Documentación técnica | `.md` | `docs/technical/` | `RESPONSIVE_MOBILE_IMPROVEMENTS.md` |
| Validación/Checklist | `.md` | `docs/validation/` | `VISUAL_VALIDATION.md` |
| Deployment/DevOps | `.md` | `docs/deployment/` | `QUICK_START.md` |
| Decisión arquitectura | `.md` | `docs/adr/` | `ADR-0001-bootstrap.md` |
| Bugreport/Fix | `.md` | `docs/` | `BUGFIX_*.md` |
| Script deployment | `.ps1` | `scripts/` | `deploy.ps1` |
| Script maintenance | `.js` | `scripts/` | `maintenance.js` |
| Punto entrada principal | `README.md` | **RAÍZ** | `README.md` |
| Node config | `package.json` | **RAÍZ** | `package.json` |
| Git config | `.gitignore` | **RAÍZ** | `.gitignore` |
| Licencia | `LICENSE` | **RAÍZ** | `LICENSE` |
| GitHub config | `.md` | `.github/` | `.github/copilot-instructions.md` |
| Protocol/Governance | `.md` | `.meta/` | `.meta/FILE_STRUCTURE_PROTOCOL.md` |

---

## ✅ CHECKLIST ANTES DE CREAR ARCHIVO

**OBLIGATORIO leer antes de crear cualquier `.md` nuevo:**

### Paso 1: Identifica el Tipo
```
¿Qué es este archivo?
- [ ] Documentación de usuario?
- [ ] Documentación técnica?
- [ ] Checklist de validación?
- [ ] Deployment/DevOps?
- [ ] Decisión arquitectura (ADR)?
- [ ] Reporte de bug/fix?
- [ ] Punto entrada (README)?
```

### Paso 2: Elige Ubicación Correcta
```
Según tipo, va en:
- [ ] docs/guides/
- [ ] docs/technical/
- [ ] docs/validation/
- [ ] docs/deployment/
- [ ] docs/adr/
- [ ] docs/ (root of docs)
- [ ] RAÍZ (SOLO SI es README.md)
```

### Paso 3: Valida NO va en Raíz
```
❌ Esto NUNCA va en raíz (citizen-reports/):
- [ ] Cualquier .md excepto README.md
- [ ] Scripts (.ps1, .js, .sh)
- [ ] Archivos de configuración (excepto .gitignore)
- [ ] Documentación técnica
- [ ] Guías de usuario
- [ ] Índices o mapas
- [ ] Resúmenes ejecutivos

✅ Si tu archivo es uno de estos, DETENTE y crea en /docs
```

### Paso 4: Nombra Correctamente
```
Convención de nombres:
- docs/guides/      → QUICK_START.md, SUMMARY_TODAY.md
- docs/technical/   → RESPONSIVE_*.md, API_*.md
- docs/validation/  → VISUAL_*.md, *_CHECKLIST.md
- docs/deployment/  → README.md, QUICK_START.md
- docs/adr/         → ADR-NNNN-{title}.md
```

### Paso 5: Actualiza INDEX.md
```
Si es nuevo documento:
- [ ] Añade entrada en docs/INDEX.md
- [ ] Categoría correcta
- [ ] Link funciona
```

---

## 🚫 VIOLACIONES & CONSECUENCIAS

### Violación: Archivo `.md` en raíz (excepto README.md)

**Esto está prohibido:**
```
citizen-reports/
├── NUEVA_DOCUMENTACION.md    ❌ VIOLACIÓN
├── GUIA_RAPIDA.md            ❌ VIOLACIÓN
├── README.md                 ✅ OK
```

**Consecuencia:**
1. CI/CD rechaza (pre-commit hook)
2. PR review lo marca como "Fix structure first"
3. No se puede mergear hasta mover a `/docs`

### Violación: Script en raíz (excepto deploy.ps1 que se moverá)

**Esto está prohibido:**
```
citizen-reports/
├── nuevo-script.ps1         ❌ VIOLACIÓN
├── scripts/
│   └── deploy.ps1           ✅ OK
```

**Consecuencia:**
1. Pre-commit hook bloquea commit
2. Mensaje: "Scripts must go in /scripts directory"

---

## 🛠️ HERRAMIENTAS DE VALIDACIÓN

### Pre-commit Hook (Automático)

```bash
# .husky/pre-commit
# Bloquea commits con archivos en raíz (excepto permitidos)
```

Archivos permitidos en raíz:
```
README.md
package.json
package-lock.json
.gitignore
.gitattributes
.editorconfig
LICENSE
CHANGELOG.md (opcional)
```

### Pre-push Checklist (Manual)

Antes de hacer `git push`, ejecuta:
```powershell
# Verifica estructura
.\scripts\validate-structure.ps1

# Debe retornar: ✅ Structure OK
```

---

## 📖 EJEMPLOS DE MIGRATION (Antes → Después)

### Ejemplo 1: Guía de Usuario
**ANTES (❌ Incorrecto):**
```
citizen-reports/
└── EMPIEZA_AQUI.md
```

**DESPUÉS (✅ Correcto):**
```
citizen-reports/
└── docs/
    └── guides/
        └── QUICK_START.md
```

---

### Ejemplo 2: Deployment Docs
**ANTES (❌ Incorrecto):**
```
citizen-reports/
├── DEPLOYMENT_DOCS_RESUMEN.md
├── deploy.ps1
```

**DESPUÉS (✅ Correcto):**
```
citizen-reports/
├── scripts/
│   └── deploy.ps1
└── docs/
    └── deployment/
        └── README.md
```

---

### Ejemplo 3: Technical Documentation
**ANTES (❌ Incorrecto):**
```
citizen-reports/
├── RESPONSIVE_MOBILE_IMPROVEMENTS.md
├── VISUAL_VALIDATION_GUIDE.md
```

**DESPUÉS (✅ Correcto):**
```
citizen-reports/
└── docs/
    ├── technical/
    │   └── RESPONSIVE_MOBILE_IMPROVEMENTS.md
    └── validation/
        └── VISUAL_VALIDATION.md
```

---

## 🔄 PROCESO DE REVISIÓN

### Para Cada Nuevo Documento:

1. **Crea en ubicación correcta** (`docs/` subdirectorio)
2. **Actualiza `docs/INDEX.md`** con nueva entrada
3. **Verifica links** internos funcionan
4. **Commit:** mensaje debe incluir "docs: add ..."
5. **Push** → PR automática si aplica

**Ejemplo commit:**
```bash
git add docs/guides/NEW_GUIDE.md docs/INDEX.md
git commit -m "docs: add quick start guide for new feature"
git push
```

---

## 📊 ESTRUCTURA COMPLETA (Referencia Visual)

```
citizen-reports/ (RAÍZ - Limpio)
├── README.md                    ← Punto entrada
├── package.json                 ← Config
├── .gitignore                   ← Git
├── .editorconfig                ← Editor
├── CHANGELOG.md                 ← (Opcional)
├── LICENSE                      ← (Opcional)
│
├── .meta/                       ← GOVERNANCE
│   ├── FILE_STRUCTURE_PROTOCOL.md
│   └── CHECKLIST_FILE_PLACEMENT.md
│
├── .github/                     ← GitHub
│   └── copilot-instructions.md
│
├── docs/                        ← DOCUMENTACIÓN CENTRALIZADA ✅
│   ├── INDEX.md
│   ├── guides/
│   │   ├── QUICK_START.md
│   │   ├── SUMMARY_TODAY.md
│   │   ├── EXECUTIVE_SUMMARY.md
│   │   └── ...
│   ├── validation/
│   │   ├── VISUAL_VALIDATION.md
│   │   ├── VALIDATION_CHECKLIST.md
│   │   └── ...
│   ├── deployment/
│   │   ├── README.md
│   │   ├── QUICK_START.md
│   │   ├── INDEX.md
│   │   └── ...
│   ├── technical/
│   │   ├── RESPONSIVE_MOBILE_IMPROVEMENTS.md
│   │   ├── architecture.md
│   │   └── ...
│   ├── adr/
│   │   ├── ADR-0001-bootstrap.md
│   │   └── ...
│   └── [otros BUGFIX_*.md, etc.]
│
├── scripts/                     ← AUTOMATION
│   ├── deploy.ps1
│   ├── start-dev.ps1
│   ├── stop-servers.ps1
│   └── ...
│
├── code_surgeon/                ← Code editing toolkit
│   ├── bin/
│   ├── prompts/
│   └── ...
│
├── config/                      ← Configuration
│   ├── jest.config.cjs
│   ├── playwright.config.ts
│   └── ...
│
├── tests/                       ← Testing
│   ├── backend/
│   ├── frontend/
│   ├── e2e/
│   └── ...
│
├── server/                      ← Backend
│   ├── src/
│   └── ...
│
├── client/                      ← Frontend
│   ├── src/
│   └── ...
│
└── [otros directorios]
```

---

## ✅ CUMPLIMIENTO

| Equipo | Debe Cumplir | Verificación |
|--------|-------------|--------------|
| **Developers** | Crear archivos en ubicación correcta | Pre-commit hook |
| **Copilot/AI Agent** | Respetar protocolo en cada creación | `.meta/CHECKLIST_FILE_PLACEMENT.md` |
| **DevOps** | Revisar estructura antes de merge | Pre-push script |
| **Managers** | Recordar protocolo en reviews | Link a este doc en PRs |

---

## 📞 PREGUNTAS FRECUENTES

**P: ¿Dónde va mi README para un módulo nuevo?**  
R: Si es nuevo módulo en servidor/cliente, va en ese directorio. Documentación de ese módulo va en `docs/technical/`.

**P: ¿Puedo crear un .md nuevo en raíz?**  
R: NO, excepto `README.md` (punto entrada). Todo otro `.md` va en `docs/`.

**P: ¿Qué pasa si violo el protocolo?**  
R: Pre-commit hook lo bloquea. No puedes hacer commit. Mueve el archivo a ubicación correcta.

**P: ¿Se puede cambiar el protocolo?**  
R: SÍ, pero es decisión de equipo. Actualiza este documento con fecha y versión.

---

## 🎯 OBJETIVO FINAL

**Estructura Clase Mundial** que sea:
- ✅ **Clara:** Cada archivo sabe dónde debe estar
- ✅ **Escalable:** Crece sin desorden
- ✅ **Mantenible:** Fácil encontrar archivo
- ✅ **Automatizada:** Pre-commit hooks lo validan
- ✅ **Documentada:** Protocolo explícito

---

## 📝 HISTORIAL DE CAMBIOS

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0 | Oct 31, 2025 | Versión inicial (post-incident) |
| - | - | - |

---

**Status:** ✅ ACTIVO  
**Vigencia:** A partir de Octubre 31, 2025  
**Próxima revisión:** 3 meses (Enero 31, 2026)

**Responsable:** GitHub Copilot / AI Agent  
**Aprobado por:** Development Team

---

**¡CUMPLE ESTE PROTOCOLO EN CADA CREACIÓN DE ARCHIVO!** 🛡️
