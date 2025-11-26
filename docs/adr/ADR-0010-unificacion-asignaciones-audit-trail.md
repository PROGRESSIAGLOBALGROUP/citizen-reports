# ADR-0010: Unificación de Sistema de Asignaciones con Audit Trail Completo

**Estado**: Aprobado  
**Fecha**: 2025-10-04  
**Autor**: Sistema de Gestión de Reportes citizen-reports  
**Relacionado**: ADR-0006 (Sistema de Asignación de Reportes)

## Contexto

El sistema actual tiene dos mecanismos para asignar funcionarios a reportes:

1. **Botón "Asignar"** (`POST /api/reportes/:id/asignaciones`)
   - Permite asignar funcionarios de la misma dependencia
   - ❌ NO registra cambios en `historial_cambios` (audit trail)
   - Sin trazabilidad de quién asignó a quién

2. **Botón "Reasignar"** (`POST /api/reportes/:id/reasignar`)
   - Permite reasignación interdepartamental
   - ✅ Registra TODOS los cambios en audit trail
   - Incluye: desasignación anterior, nueva asignación, cambio de tipo
   - Requiere razón obligatoria (mínimo 10 caracteres)

### Problema Identificado

- **Inconsistencia de trazabilidad**: Asignaciones normales no quedan en historial
- **Complejidad UX**: Dos botones para funcionalidad similar confunde usuarios
- **Riesgo de auditoría**: Falta de evidencia de quién asignó reportes
- **Incumplimiento de mejores prácticas**: ISO 27001, SOC 2, ITIL v4 requieren audit trail completo

## Decisión

**Unificar ambos mecanismos en un solo botón "Asignar" con audit trail completo.**

### Principios de Diseño Aplicados:

1. **Completeness (Completitud)**: TODA acción debe registrarse
2. **Non-repudiation (No Repudio)**: Evidencia irrefutable de acciones
3. **Chronological Integrity (Integridad Cronológica)**: Timeline sin vacíos
4. **Single Responsibility**: Un botón, un propósito claro
5. **Backward Compatibility**: Mantener endpoint `/reasignar` como deprecated

## Implementación

### 1. Backend: Modificar `crearAsignacion()`

**Archivo**: `server/asignaciones-routes.js`

**Cambios**:
```javascript
// ANTES: No registraba en historial
db.run(sql, [id, usuario_id, asignado_por || null, notas], function(err) {
  // ... solo inserta en tabla asignaciones
});

// DESPUÉS: Registra en historial
db.run(sql, [id, usuario_id, asignado_por || null, notas], async function(err) {
  // ... inserta en asignaciones
  
  // Obtener nombres para audit trail
  const funcionario = await obtenerUsuario(db, usuario_id);
  const asignador = asignado_por ? await obtenerUsuario(db, asignado_por) : null;
  
  // Registrar en historial_cambios
  await registrarCambio(db, {
    reporte_id: id,
    usuario_id: asignado_por || usuario_id,
    tipo_cambio: 'asignacion',
    campo_modificado: 'funcionario_asignado',
    valor_anterior: null,
    valor_nuevo: `${funcionario.nombre} (${funcionario.email})`,
    razon: notas || 'Asignación de reporte',
    metadatos: {
      ip: req.ip,
      user_agent: req.headers['user-agent'],
      dependencia: funcionario.dependencia
    }
  });
});
```

### 2. Frontend: Simplificar UI

**Archivo**: `client/src/PanelFuncionario.jsx`

**Cambios**:
- ❌ Eliminar botón "Reasignar" (línea ~900)
- ✅ Mejorar modal "Asignar" con:
  - Campo "Razón" (opcional pero recomendado)
  - Selector de funcionarios de CUALQUIER dependencia (para supervisores/admins)
  - Mensaje informativo sobre audit trail

### 3. Schema de Audit Trail

**Tabla**: `historial_cambios`

**Tipos de cambio registrados**:
- `asignacion` - Nueva asignación de funcionario
- `desasignacion` - Remoción de funcionario asignado
- `reasignacion` - Cambio de departamento (legacy)
- `cambio_tipo` - Actualización de tipo de reporte
- `cambio_estado` - Cambio de estado del reporte

**Campos requeridos**:
- `reporte_id` - ID del reporte afectado
- `usuario_id` - Quién realizó la acción
- `tipo_cambio` - Tipo de operación
- `campo_modificado` - Qué se modificó
- `valor_anterior` - Valor antes del cambio (legible)
- `valor_nuevo` - Valor después del cambio (legible)
- `razon` - Justificación del cambio
- `metadatos` - JSON con contexto adicional (IP, user-agent, etc.)
- `creado_en` - Timestamp automático

## Consecuencias

### ✅ Positivas

1. **Trazabilidad completa**: Todas las acciones quedan registradas
2. **Cumplimiento normativo**: Satisface ISO 27001, SOC 2, GDPR
3. **UX simplificada**: Un solo botón, menos confusión
4. **Auditoría forense**: Timeline completo de eventos
5. **Accountability**: Responsabilidad clara de cada acción
6. **Mantenibilidad**: Menos código duplicado

### ⚠️ Consideraciones

1. **Rendimiento**: +1 INSERT por asignación (impacto mínimo)
2. **Storage**: Crecimiento de tabla `historial_cambios` (manejable con índices)
3. **Migración**: Reportes antiguos sin historial (documentar limitación)
4. **Backward compatibility**: Mantener `/reasignar` por 6 meses (deprecated)

### 🔧 Mitigaciones

- Índices en `historial_cambios(reporte_id, creado_en)` para queries rápidas
- Proceso de limpieza periódica (retener últimos 2 años por defecto)
- Documentación clara de cambio en changelog
- Mensaje en UI: "Esta acción quedará registrada en el historial del reporte"

## Alternativas Consideradas

### Opción A: Mantener ambos botones, agregar audit trail a "Asignar"
- ❌ Rechazada: Mantiene confusión UX
- ❌ Funcionalidad duplicada

### Opción B: Eliminar "Asignar", usar solo "Reasignar"
- ❌ Rechazada: Nombre confuso para asignación inicial
- ❌ "Reasignar" implica que ya estaba asignado

### Opción C: Unificar en "Asignar" con audit trail ✅ SELECCIONADA
- ✅ UX clara y simple
- ✅ Audit trail completo
- ✅ Cumplimiento de mejores prácticas

## Referencias

- [ISO 27001:2022](https://www.iso.org/standard/27001) - Control A.9.4.5 (Access Control)
- [SOC 2 Trust Services Criteria](https://us.aicpa.org/interestareas/frc/assuranceadvisoryservices/socforserviceorganizations) - CC6.3 (Logging and Monitoring)
- [ITIL v4](https://www.axelos.com/certifications/itil-service-management) - Change Enablement
- [NIST SP 800-53](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final) - AU-2 (Audit Events)
- ADR-0006: Sistema de Asignación de Reportes (many-to-many)

## Estado de Implementación

- [x] ADR documentado
- [ ] Backend: `crearAsignacion()` con audit trail
- [ ] Backend: `eliminarAsignacion()` con audit trail
- [ ] Frontend: Eliminar botón "Reasignar"
- [ ] Frontend: Mejorar modal "Asignar"
- [ ] Testing: Unit tests para audit trail
- [ ] Testing: E2E para flujo completo
- [ ] Documentación: Actualizar SISTEMA_AUTENTICACION.md
- [ ] Changelog: Documentar cambio breaking

## Fecha de Implementación

**Inicio**: 2025-10-04  
**Target**: 2025-10-04  
**Deprecation de `/reasignar`**: 2026-04-04 (6 meses)
