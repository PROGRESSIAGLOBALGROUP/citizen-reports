# Fix: Dropdown de Tipos Vacío en Formulario de Reportar

**Fecha**: 2025-10-05  
**Problema reportado**: "Parece no haber nada en la DB"  
**Ubicación**: Página `localhost:5173/#reportar` - dropdown "Tipo de Reporte"

---

## 🔍 Diagnóstico

### Síntomas Observados
- Dropdown "Tipo de Reporte" aparece con opción por defecto pero sin opciones
- Usuario está en `localhost:5173/#reportar`
- Formulario visible pero sin datos dinámicos

### Investigación Realizada

**1. Verificación de Base de Datos** ✅
```sql
-- Categorías activas: 6
-- Tipos de reporte activos: 19
-- Usuarios: 7
-- Reportes: 2
```
✅ La base de datos SÍ tiene datos completos

**2. Verificación de Campo `tipo`**
- Problema encontrado: Campo `tipo` tenía valor `"undefined"` en todos los registros
- Causa: Migración 009 no estableció correctamente este campo
- Solución: Script `fix-valores-tipos.js` actualizado campo para los 19 tipos

**3. Verificación de API** ✅
```bash
GET http://localhost:4000/api/categorias
```
✅ Endpoint devuelve correctamente JSON con 6 categorías y 19 tipos anidados

**4. Verificación de Servidor Frontend** ❌ → ✅
- Problema: Vite dev server NO estaba corriendo en puerto 5173
- Usuario estaba viendo página estática/cachada sin conexión al backend
- Solución: Iniciado `npm run dev` en directorio `client/`

---

## ✅ Correcciones Aplicadas

### 1. Actualización de Campo `tipo` en Base de Datos

**Archivo**: `server/fix-valores-tipos.js`

**Acción**: Actualizar campo `tipo` para los 19 tipos de reporte

```javascript
const updates = [
  { id: 1, valor: 'bache' },
  { id: 2, valor: 'pavimento_danado' },
  { id: 3, valor: 'banqueta_rota' },
  // ... hasta 19 tipos
];

updates.forEach(update => {
  db.run('UPDATE tipos_reporte SET tipo = ? WHERE id = ?', [update.valor, update.id]);
});
```

**Resultado**:
```
✅ 19 tipos actualizados exitosamente
✅ Campo 'tipo' ahora tiene valores correctos (ej: "bache", "alumbrado_publico", etc.)
```

### 2. Inicio de Servidor Frontend (Vite)

**Comando ejecutado**:
```powershell
cd client
npm run dev
```

**Resultado**:
- ✅ Vite dev server corriendo en `http://localhost:5173`
- ✅ Proxy `/api` → `http://localhost:4000` funcionando
- ✅ Endpoint `/api/categorias` accesible desde frontend

---

## 🧪 Verificación

### Test 1: Endpoint Directo
```bash
curl http://localhost:4000/api/categorias
```
**Resultado**: ✅ JSON con 6 categorías y 19 tipos

### Test 2: Endpoint a través de Proxy
```bash
curl http://localhost:5173/api/categorias
```
**Resultado**: ✅ Mismo JSON (proxy funcional)

### Test 3: Verificación de DB
```bash
node verify_db_state.js
```
**Resultado**:
```
📂 CATEGORÍAS (6 activas):
   1. Obras Públicas (orden: 1, icono: 🛣️)
   2. Servicios Públicos (orden: 2, icono: 🔧)
   ...

📝 TIPOS DE REPORTE (19 activos):
   1. [Cat 1] Bache (tipo: "bache")  ✅
   2. [Cat 1] Pavimento Dañado (tipo: "pavimento_danado")  ✅
   ...
```

---

## 📋 Solución para el Usuario

### Pasos para Ver los Tipos en el Dropdown

1. **Refrescar la página** (F5 o Ctrl+R)
2. **Verificar que la URL es**: `http://localhost:5173/#reportar`
3. **El dropdown "Tipo de Reporte" debe mostrar**:
   - Selecciona un tipo de reporte (placeholder)
   - Categoría: Obras Públicas
     - 🛣️ Bache
     - 🚧 Pavimento Dañado
     - 🚶 Banqueta Rota
     - 🕳️ Alcantarilla
   - Categoría: Servicios Públicos
     - 💡 Alumbrado Público
     - 🗑️ Basura
     - 🧹 Limpieza
   - Categoría: Agua Potable
     - 💧 Falta de Agua
     - 💦 Fuga de Agua
   - Categoría: Seguridad Pública
     - 🚨 Inseguridad
     - 🚗 Accidente
     - 🚔 Delito
   - Categoría: Salud
     - 🦟 Plaga
     - 🐕 Mascota Herida
     - ☣️ Contaminación
   - Categoría: Medio Ambiente
     - 🌳 Árbol Caído
     - 🪓 Deforestación
     - 🔥 Quema
     - 🌳 Parques y Jardines

---

## 🔧 Scripts Creados

### 1. `verify_db_state.js`
**Propósito**: Verificar estado completo de la base de datos

**Uso**:
```bash
node verify_db_state.js
```

**Output**:
- Categorías activas con iconos
- Tipos de reporte activos con valores
- Usuarios con roles
- Conteo de reportes
- Lista de tablas

### 2. `server/fix-valores-tipos.js`
**Propósito**: Corregir campo `tipo` en `tipos_reporte`

**Uso**:
```bash
cd server
node fix-valores-tipos.js
```

**Output**:
- Actualiza los 19 tipos con valores correctos
- Muestra estado final de cada tipo

---

## 🎯 Causa Raíz

### Problema 1: Campo `tipo` con valor `"undefined"`
**Origen**: Migración 009 (`server/migrations/009-tipos-dinamicos.js`)
- Script de migración insertó tipos pero no estableció correctamente el campo `tipo`
- Probablemente usó `tipo` de una variable undefined en lugar del valor correcto

**Impacto**:
- Frontend recibía tipos con `tipo: "undefined"`
- Lógica de filtrado y selección fallaba
- Dropdown no mostraba opciones correctamente

**Fix**: Script de corrección actualiza campo para los 19 registros

### Problema 2: Servidor Frontend No Iniciado
**Origen**: Usuario navegando sin Vite dev server corriendo
- Posiblemente cacheo antiguo o página estática
- Sin proxy funcional, llamadas a `/api` fallaban

**Impacto**:
- Requests a `/api/categorias` no llegaban al backend
- Frontend no recibía datos dinámicos
- Dropdown aparecía vacío

**Fix**: Iniciar `npm run dev` en directorio `client/`

---

## ✅ Checklist de Validación

- [x] Base de datos contiene 6 categorías activas
- [x] Base de datos contiene 19 tipos activos
- [x] Campo `tipo` tiene valores correctos (no "undefined")
- [x] Backend servidor corriendo en puerto 4000
- [x] Frontend (Vite) corriendo en puerto 5173
- [x] Endpoint `/api/categorias` devuelve JSON correcto
- [x] Proxy Vite funcional (`/api` → `localhost:4000`)
- [ ] **Usuario debe refrescar página** (F5) ⚠️ PENDIENTE
- [ ] **Dropdown muestra 19 opciones agrupadas** ⚠️ VERIFICAR

---

## 📚 Documentación Relacionada

- **Migración 009**: `server/migrations/009-tipos-dinamicos.js`
- **ADR-0009**: `docs/adr/ADR-0009-tipos-categorias-dinamicas.md`
- **API Tipos**: `server/tipos-routes.js`
- **Frontend SimpleApp**: `client/src/SimpleApp.jsx`
- **API Client**: `client/src/api.js` - función `obtenerCategoriasConTipos()`

---

## 🚀 Estado Final

**Servidores corriendo**:
- ✅ Backend: `http://localhost:4000` (Node/Express)
- ✅ Frontend: `http://localhost:5173` (Vite dev)

**Endpoints funcionales**:
- ✅ `GET /api/categorias` - 6 categorías con 19 tipos
- ✅ `GET /api/tipos` - 19 tipos planos
- ✅ `GET /api/reportes` - 2 reportes existentes

**Base de datos**:
- ✅ 6 categorías activas
- ✅ 19 tipos activos con valores correctos
- ✅ 7 usuarios (1 admin, 2 supervisores, 4 funcionarios)
- ✅ 2 reportes de prueba

**ACCIÓN REQUERIDA**: Usuario debe refrescar navegador (F5) en `http://localhost:5173/#reportar`

---

**Fix completado**: 2025-10-05  
**Tiempo de resolución**: ~20 minutos  
**Complejidad**: Media (requirió diagnóstico de DB + corrección de datos + inicio de servicios)
