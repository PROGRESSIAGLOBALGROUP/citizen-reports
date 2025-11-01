# Fix: "No se encontró supervisor para esta dependencia" al Solicitar Cierre

**Fecha**: 2025-10-04  
**Tipo**: Bugfix - Asignaciones Interdepartamentales  
**Prioridad**: Alta  
**Issue**: Funcionarios no pueden cerrar reportes asignados interdepartamentalmente

---

## 🔍 Problema Identificado

### Síntomas
- Funcionario "Func. Parques" (parques_jardines) intenta cerrar reporte tipo "quema"
- Sistema muestra error: **"No se encontró supervisor para esta dependencia"**
- Supervisor "Parkeador" (parques_jardines) SÍ existe en el sistema

### Escenario Reproducible
```
1. Reporte #3: tipo="quema" → dependencia="medio_ambiente" (auto-asignado)
2. Asignación interdepartamental: Reporte asignado a "Func. Parques" (parques_jardines)
3. Funcionario intenta solicitar cierre con firma y evidencias
4. ❌ ERROR: "No se encontró supervisor para esta dependencia"
```

### Captura de Pantalla
Usuario ve modal de cierre con error en toast/alert superior.

---

## 🔬 Análisis de Causa Raíz (Ingeniería Inversa)

### Investigación del Código

**Archivo**: `server/reportes_auth_routes.js` línea ~189

```javascript
// ❌ CÓDIGO INCORRECTO (ANTES)
const supervisorId = await obtenerSupervisor(reporte.dependencia);
//                                            ^^^^^^^^^^^^^^^^^^
//                                            Busca supervisor del REPORTE
```

**Función**: `server/auth_middleware.js` línea 227

```javascript
export function obtenerSupervisor(dependencia) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    const sql = `
      SELECT id FROM usuarios 
      WHERE dependencia = ? AND rol = 'supervisor' AND activo = 1
      LIMIT 1
    `;
    
    db.get(sql, [dependencia], (err, supervisor) => {
      if (err) return reject(err);
      resolve(supervisor?.id || null);
    });
  });
}
```

### Flujo del Error

1. **Reporte #3**: 
   - `tipo = 'quema'`
   - Mapeo automático: `DEPENDENCIA_POR_TIPO['quema'] = 'medio_ambiente'`
   - `dependencia = 'medio_ambiente'`

2. **Asignación interdepartamental**:
   - Reporte de `medio_ambiente` asignado a funcionario de `parques_jardines`
   - Usuario: `func.parques1@jantetelco.gob.mx` (dependencia: `parques_jardines`)

3. **Solicitud de cierre**:
   - Código llama: `obtenerSupervisor(reporte.dependencia)` 
   - Busca: `obtenerSupervisor('medio_ambiente')`
   - Resultado: **NULL** (no existe supervisor de medio_ambiente)

4. **Supervisores existentes en DB**:
```sql
SELECT dependencia, nombre FROM usuarios WHERE rol = 'supervisor';

obras_publicas      | Supervisor Obras Públicas
parques_jardines    | Parkeador
servicios_publicos  | Supervisora Servicios Públicos
```

5. **Error lanzado**: 
```javascript
if (!supervisorId) {
  return res.status(500).json({ 
    error: 'No se encontró supervisor para esta dependencia' 
  });
}
```

### Problema de Diseño

**En asignaciones interdepartamentales**:
- El funcionario que cierra pertenece a una **dependencia diferente** a la del reporte
- Debería notificar a **SU supervisor** (de su dependencia)
- NO al supervisor de la dependencia original del reporte

**Ejemplo**:
- Reporte: tipo="quema" → dependencia="medio_ambiente"
- Funcionario: "Func. Parques" → dependencia="parques_jardines"
- Supervisor correcto: "Parkeador" (supervisor de parques_jardines) ✅
- Supervisor incorrecto: buscar en medio_ambiente ❌ (no existe)

---

## 🔧 Solución Implementada

### Cambio Aplicado

**Archivo**: `server/reportes_auth_routes.js` línea ~189

```diff
- // Obtener supervisor de la dependencia
- const supervisorId = await obtenerSupervisor(reporte.dependencia);
+ // Obtener supervisor de la dependencia DEL FUNCIONARIO (no del reporte)
+ // En asignaciones interdepartamentales, el funcionario notifica a SU supervisor
+ const supervisorId = await obtenerSupervisor(req.usuario.dependencia);

  if (!supervisorId) {
-   console.error(`No se encontró supervisor para dependencia: ${reporte.dependencia}`);
+   console.error(`No se encontró supervisor para la dependencia del funcionario: ${req.usuario.dependencia}`);
    return res.status(500).json({ error: 'No se encontró supervisor para esta dependencia' });
  }
```

### Justificación

**Antes**:
- Sistema buscaba supervisor de `reporte.dependencia` (ej: "medio_ambiente")
- Fallaba en asignaciones interdepartamentales

**Después**:
- Sistema busca supervisor de `req.usuario.dependencia` (ej: "parques_jardines")
- Funcionario notifica a SU supervisor directo
- Compatible con asignaciones interdepartamentales

### Flujo Corregido

1. **Funcionario "Func. Parques"** solicita cierre de reporte #3
2. Sistema obtiene: `req.usuario.dependencia = 'parques_jardines'`
3. Busca supervisor: `obtenerSupervisor('parques_jardines')`
4. Encuentra: **"Parkeador"** (id=8) ✅
5. Crea solicitud de cierre con `supervisor_id = 8`
6. Supervisor "Parkeador" recibe notificación para aprobar/rechazar

---

## 📊 Impacto

### Antes del Fix
- ❌ Funcionarios NO pueden cerrar reportes asignados interdepartamentalmente
- ❌ Sistema falla si no existe supervisor de la dependencia del reporte
- ❌ Bloquea workflow de cierre en coordinaciones multi-departamentales

### Después del Fix
- ✅ Funcionarios PUEDEN cerrar reportes asignados interdepartamentalmente
- ✅ Sistema notifica al supervisor CORRECTO (del funcionario)
- ✅ Compatible con asignaciones interdepartamentales
- ✅ Respeta jerarquía organizacional (funcionario → su supervisor)

---

## 🧪 Casos de Prueba

### Caso 1: Cierre Interdepartamental (Corregido)
```
Usuario: func.parques1@jantetelco.gob.mx (parques_jardines)
Reporte: #3 tipo="quema" (medio_ambiente)
Acción: Solicitar cierre con firma y evidencias
Resultado: ✅ Solicitud creada, notifica a "Parkeador" (supervisor de parques)
```

### Caso 2: Cierre Normal (Sigue Funcionando)
```
Usuario: func.obras1@jantetelco.gob.mx (obras_publicas)
Reporte: #1 tipo="baches" (obras_publicas)
Acción: Solicitar cierre
Resultado: ✅ Solicitud creada, notifica a "Supervisor Obras" (misma dependencia)
```

### Caso 3: Sin Supervisor (Edge Case)
```
Usuario: nuevo_funcionario@jantetelco.gob.mx (cultura) 
Reporte: cualquiera
Acción: Solicitar cierre
Resultado: ❌ Error: "No se encontró supervisor para esta dependencia" (correcto)
```

---

## 🔍 Verificación Manual

1. **Login** como `func.parques1@jantetelco.gob.mx` / `admin123`
2. **Ir a** Panel de Funcionario (`#panel`)
3. **Seleccionar** reporte #3 (tipo "quema")
4. **Clic** en "Solicitar Cierre"
5. **Completar**:
   - Notas: "Incendio controlado, área limpiada"
   - Firma digital: (dibujar firma)
   - Evidencias: (subir 1-3 fotos)
6. **Enviar**
7. ✅ **Resultado esperado**: 
   - Mensaje: "Solicitud de cierre enviada al supervisor"
   - Estado cambia a "pendiente_cierre"
   - Supervisor "Parkeador" ve solicitud en su panel

---

## 📚 Referencias

- **ADR-0006**: Sistema de asignación de reportes (asignaciones many-to-many)
- **ADR-0010**: Unificación de asignaciones con audit trail
- **Archivo modificado**: `server/reportes_auth_routes.js`
- **Función utilizada**: `obtenerSupervisor()` en `server/auth_middleware.js`
- **Tabla afectada**: `cierres_pendientes` (campo `supervisor_id`)

---

## 🚀 Deployment

### Desarrollo
```powershell
# Reiniciar backend para aplicar cambios
.\stop-servers.ps1
.\start-dev.ps1
```

### Producción
```powershell
# El cambio es solo backend, no requiere rebuild del frontend
.\stop-servers.ps1
.\start-prod.ps1
```

---

## ⚠️ Consideraciones

### Ventajas de la Solución
1. ✅ Respeta jerarquía organizacional (funcionario → su supervisor)
2. ✅ Compatible con asignaciones interdepartamentales
3. ✅ No requiere crear supervisores ficticios para cada tipo de reporte
4. ✅ Simplifica gestión de permisos

### Posibles Escenarios Futuros
- Si se requiere notificar a AMBOS supervisores (del funcionario Y del reporte):
  - Agregar campo `supervisor_secundario_id` en `cierres_pendientes`
  - Enviar notificaciones duplicadas
  - Requiere aprobación de ambos (workflow más complejo)

### Migración de Datos
- ❌ **NO requiere migración** de datos existentes
- Solicitudes de cierre previas mantienen su `supervisor_id` original
- Nuevas solicitudes usan la lógica corregida

---

## ✅ Checklist de Completitud

- [x] Causa raíz identificada por ingeniería inversa
- [x] Cambio aplicado en `reportes_auth_routes.js`
- [x] Comentarios explicativos agregados
- [x] Documentación completa creada
- [x] Casos de prueba documentados
- [x] Sin hardcoding ni mocks
- [x] Sigue lineamientos de `docs/`

---

**Próximo paso**: Reiniciar backend y probar solicitud de cierre con funcionario de parques en reporte tipo "quema".
