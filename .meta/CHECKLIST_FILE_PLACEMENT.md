# ✅ CHECKLIST: File Placement Before Commit

**Versión:** 1.0  
**Fecha:** Octubre 31, 2025  
**Propósito:** Validar que ANTES de crear/modificar archivos, vayan en lugar correcto

---

## 🎯 USO DE ESTE CHECKLIST

**Cuándo usarlo:**
- ✅ Antes de crear CUALQUIER `.md` nuevo
- ✅ Antes de hacer `git add` en archivos documentación
- ✅ Antes de hacer `git commit`
- ✅ Como referencia rápida

**Quién lo usa:**
- Developers escribiendo documentación
- AI Agents (Copilot) creando archivos
- DevOps/Leads reviewando PRs

---

## 📋 CHECKLIST (Copiar y Completar)

### PASO 1: Identifica el Archivo

```
Nombre: _________________________
Tipo: ___________________________  (ej: guía de usuario, config técnico)
Extensión: ______________________  (ej: .md, .ps1, .js)
```

### PASO 2: Responde Preguntas

```
❓ ¿Es documentación de usuario?
   [ ] SÍ → Va en docs/guides/
   [ ] NO → Continúa

❓ ¿Es documentación técnica?
   [ ] SÍ → Va en docs/technical/
   [ ] NO → Continúa

❓ ¿Es validación/checklist?
   [ ] SÍ → Va en docs/validation/
   [ ] NO → Continúa

❓ ¿Es deployment/DevOps?
   [ ] SÍ → Va en docs/deployment/ (o scripts/ si es script)
   [ ] NO → Continúa

❓ ¿Es decisión arquitectura (ADR)?
   [ ] SÍ → Va en docs/adr/
   [ ] NO → Continúa

❓ ¿Es README punto entrada?
   [ ] SÍ → Va en RAÍZ (Jantetelco/)
   [ ] NO → Continúa

❓ ¿Es script de automatización?
   [ ] SÍ → Va en scripts/
   [ ] NO → Continúa

❓ ¿Es config o dependencias?
   [ ] SÍ → Va en RAÍZ o config/
   [ ] NO → Continúa

❓ ¿Es protocol/governance?
   [ ] SÍ → Va en .meta/
   [ ] NO → Continúa

❓ ¿No sabes dónde va?
   [ ] Consulta FILE_STRUCTURE_PROTOCOL.md
   [ ] Pregunta a team lead
```

### PASO 3: Confirma Ubicación

```
Ubicación decidida: _________________________________

Verifica:
[ ] ¿Directorio existe?
[ ] ¿Es la ubicación más lógica?
[ ] ¿Va en RAÍZ? (SOLO si es README.md, package.json, .gitignore)
```

### PASO 4: Valida Estructura de Archivos

```
Antes de hacer commit, verifica:

[ ] Todos los .md (excepto README.md) están en docs/
[ ] Scripts están en scripts/
[ ] Config está en config/ o RAÍZ
[ ] Governance está en .meta/
[ ] Nada de .md sueltos en RAÍZ (excepto README.md)
```

### PASO 5: Actualiza docs/INDEX.md (si corresponde)

```
Si creaste nuevo .md en docs/:

[ ] Abierto docs/INDEX.md
[ ] Añadido entrada en categoría correcta
[ ] Link es funcional (comprobado)
[ ] Guardado cambio
```

### PASO 6: Verifica Antes de Commit

```
git status (lista archivos nuevos)

Verifica cada archivo:
[ ] Ubicación correcta
[ ] Nombre correcto
[ ] Links internos funcionan
[ ] Si es .md, ¿está en docs/?
[ ] Si es script, ¿está en scripts/?
[ ] Nada debe estar suelto en RAÍZ (excepto permitidos)
```

### PASO 7: Commit Message

```
Formato: git commit -m "docs: describe what you added"

Para documentación:
[ ] Mensaje comienza con "docs:"
[ ] Describe qué documento/cambio
[ ] Referencia archivo: docs/[path]/filename.md

Ejemplos:
✅ "docs: add quick start guide for new users"
✅ "docs: add technical spec for responsive mobile"
✅ "docs: update INDEX.md with new guide links"
```

### PASO 8: Pre-Push Verification (Final)

```
Antes de git push:

[ ] git status (limpio de cambios sin commit)
[ ] git log --oneline -5 (commits tienen mensaje descriptivo)
[ ] Estructura de directorio correcta
[ ] Nada extra en RAÍZ
[ ] docs/INDEX.md actualizado (si corresponde)
```

---

## 🚫 CHECKLIST DE VIOLACIONES (Lo que NUNCA debe pasar)

```
❌ NUNCA:
[ ] Crear .md directamente en Jantetelco/
[ ] Crear script en RAÍZ (excepto deploy.ps1 temporal)
[ ] Dejar archivos sin ubicación clara
[ ] Crear directorio aleatorio en RAÍZ

✅ SIEMPRE:
[ ] Crear en docs/[subdirectorio]/
[ ] Scripts en scripts/
[ ] Governance en .meta/
[ ] Actualizar INDEX.md cuando creas nuevo doc
```

---

## 📝 TEMPLATE COMPLETADO (Ejemplo)

```
PASO 1: Identifica
  Nombre: QUICK_START.md
  Tipo: Guía de usuario rápida
  Extensión: .md

PASO 2: Responde
  ¿Es documentación de usuario? SÍ ✅
  
PASO 3: Ubicación
  Ubicación decidida: docs/guides/QUICK_START.md ✅

PASO 4: Valida
  Todos los .md están en docs/ ✅
  Nada suelto en RAÍZ ✅
  
PASO 5: Actualiza INDEX.md
  Añadido en categoría "Guías & Resúmenes" ✅
  Link verificado ✅
  
PASO 6: Verifica Antes de Commit
  git status → docs/guides/QUICK_START.md ✅
  Ubicación correcta ✅
  Links internos OK ✅
  
PASO 7: Commit
  git commit -m "docs: add quick start guide"
  
PASO 8: Pre-Push
  Structure OK ✅
  No cambios pendientes ✅
  Listo para push ✅
```

---

## ⚡ QUICK REFERENCE (Tabla Rápida)

| Si tu archivo es... | Va en... |
|-------------------|----------|
| Guía de usuario | `docs/guides/` |
| Documentación técnica | `docs/technical/` |
| Checklist/Validación | `docs/validation/` |
| Deployment/DevOps | `docs/deployment/` o `scripts/` |
| Decisión arquitectura | `docs/adr/` |
| README punto entrada | **RAÍZ** |
| Script de automatización | `scripts/` |
| Protocol/Governance | `.meta/` |

---

## 🔍 TROUBLESHOOTING

### "No sé dónde va mi archivo"

1. Abre `FILE_STRUCTURE_PROTOCOL.md`
2. Busca tu tipo de archivo en la tabla
3. Sigue la recomendación

### "Me falta un directorio"

1. Verifica que existe en `docs/`
2. Si no existe, créalo: `mkdir docs/[subdirectorio]`
3. Luego crea el archivo adentro

### "¿Puedo crear un directorio nuevo en RAÍZ?"

**NO** (excepto permitidos en protocolo)

Pregunta primero al team, luego actualiza protocolo.

---

## ✅ SEÑAL VERDE (Listo para Commit)

Si todas las casillas están ✅:

```bash
git add .
git commit -m "docs: [descripción]"
git push
```

---

## ❌ SEÑAL ROJA (NO hacer commit)

Si algo está ❌:

1. **DETENTE**
2. Lee el protocolo
3. Mueve archivo a ubicación correcta
4. Actualiza INDEX.md
5. Luego commit

---

## 📞 NECESITO AYUDA

**Pregunta:** ¿Dónde va?  
**Respuesta:** Usa la tabla de "QUICK REFERENCE" arriba

**Pregunta:** Archivo en raíz, ¿qué hago?  
**Respuesta:** Muévelo a `docs/[subdirectorio]/`

**Pregunta:** ¿Cambio la estructura?  
**Respuesta:** NO, a menos que apruebes con team. Protocolo es vinculante.

---

## 🎯 OBJETIVO

Cada archivo en lugar correcto, siempre. Estructura clara, predecible, clase mundial.

**Estado:** ✅ VIGENTE  
**Obligatorio desde:** Octubre 31, 2025

---

**¡USA ESTE CHECKLIST ANTES DE CADA COMMIT!** ✅
