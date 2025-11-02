// DOCUMENTO RESUMEN: Problemas Identificados y Soluciones Implementadas
// Fecha: 2025-10-03

## PROBLEMAS REPORTADOS:

### 1. No se muestra quién tiene asignado el reporte
**Causa Raíz:** 
- El frontend no consultaba la lista de asignaciones existentes
- El modal de asignación no mostraba los funcionarios ya asignados

**Solución Implementada:**
- Nueva función `cargarAsignaciones()` que consulta GET `/api/reportes/:id/asignaciones`
- Modal de asignación actualizado para mostrar lista de funcionarios ya asignados
- Se muestra nombre, email y notas de cada asignación existente

**Archivos Modificados:**
- `client/src/PanelFuncionario.jsx`: Agregado `asignacionesReporte` state y visualización en modal

### 2. Guardar draft de notas sin cerrar reporte
**Causa Raíz:**
- No existía funcionalidad para guardar notas de trabajo en progreso
- Solo se podía "Solicitar Cierre" (que requiere firma y evidencia)

**Solución Implementada:**
- Nueva tabla `notas_funcionario` para almacenar borradores
- Endpoints nuevos:
  * GET `/api/reportes/:id/notas-draft?usuario_id=X` - Obtener borrador
  * POST `/api/reportes/:id/notas-draft` - Guardar borrador (UPSERT)
- Botón "✏️ Editar Notas" en vista "Mis Reportes Asignados"
- Modal dedicado para editar y guardar borradores

**Archivos Creados:**
- `server/migrations/002-notas-funcionario.sql` - Esquema de nueva tabla
- `server/migrations/aplicar-migracion-002.js` - Script de migración

**Archivos Modificados:**
- `server/asignaciones-routes.js`: Funciones `obtenerNotasDraft()` y `guardarNotasDraft()`
- `server/app.js`: Rutas agregadas
- `client/src/PanelFuncionario.jsx`: Modal de notas draft y funciones relacionadas

### 3. Almacenamiento de firmas y evidencias
**Respuesta:**
- **Firmas digitales**: Se almacenan como **base64 (PNG)** en campos TEXT
  * `usuarios.firma_digital` - Firma predeterminada del usuario
  * `cierres_pendientes.firma_digital` - Firma específica del cierre
- **Evidencias fotográficas**: Se almacenan como **JSON array de base64** en TEXT
  * `cierres_pendientes.evidencia_fotos` - Array de imágenes en base64
  * Ejemplo: `'["data:image/png;base64,iVBOR...","data:image/png;base64,iVBOR..."]'`
  * Límite recomendado: 3 fotos máximo (por tamaño de BD)

**Consideraciones:**
- SQLite maneja bien TEXT de gran tamaño (hasta 1GB por campo)
- Base64 aumenta tamaño ~33% vs binario
- Para producción a gran escala, considerar almacenamiento externo (S3, Azure Blob)
- Compresión JPEG recomendada antes de base64 (calidad 80%, max 1024px)

## ESTADO DE IMPLEMENTACIÓN:

✅ Migración 002 aplicada exitosamente
✅ Backend actualizado con nuevos endpoints
✅ Frontend actualizado con modales y funciones
⚠️ Error de sintaxis JSX en línea 583 (en revisión)

## PRÓXIMOS PASOS:

1. Corregir error de sintaxis en PanelFuncionario.jsx línea 583
2. Reiniciar servidores para aplicar cambios
3. Probar flujo completo:
   - Login como supervisor
   - Asignar reporte a funcionario
   - Verificar que se muestra quien está asignado
   - Login como funcionario
   - Abrir "Editar Notas" y guardar borrador
   - Verificar que el borrador se recupera al reabrir

## ENDPOINTS NUEVOS:

```
GET    /api/reportes/:id/notas-draft?usuario_id=X
       → Obtiene borrador de notas del funcionario
       
POST   /api/reportes/:id/notas-draft
       Body: { usuario_id, notas }
       → Guarda/actualiza borrador (UPSERT)
```

## ESQUEMA DE BD:

```sql
CREATE TABLE notas_funcionario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporte_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  notas TEXT NOT NULL,
  es_borrador INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE(reporte_id, usuario_id)
);
```
