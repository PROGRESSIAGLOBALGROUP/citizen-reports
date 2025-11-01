# ADR-0006: Sistema de Asignación de Reportes a Funcionarios

**Fecha:** 2025-10-02  
**Estado:** Aceptado  
**Decisores:** Equipo de desarrollo

---

## Contexto

Los funcionarios necesitan poder:
1. Ver reportes de su dependencia en el mapa
2. Acceder a la vista completa de un reporte
3. Agregar notas de trabajo sobre el reporte
4. Ver qué funcionarios están asignados a cada reporte
5. Solo editar notas si están asignados al reporte

Actualmente el sistema muestra reportes en el mapa pero no hay interacción con los mismos desde el punto de vista del funcionario.

---

## Decisión

### Arquitectura del Sistema

**Backend:**
1. Crear endpoint `GET /api/reportes/:id/asignaciones` - Lista funcionarios asignados a un reporte
2. Crear endpoint `POST /api/reportes/:id/asignaciones` - Asigna funcionario a un reporte
3. Crear endpoint `DELETE /api/reportes/:id/asignaciones/:usuarioId` - Desasigna funcionario
4. Crear endpoint `GET /api/reportes/:id` - Obtiene detalles completos de un reporte
5. Crear endpoint `PUT /api/reportes/:id/notas` - Actualiza notas de trabajo (solo si está asignado)

**Frontend:**
1. Modificar popup de Leaflet para mostrar botón "Ver Reporte" si el reporte pertenece a la dependencia del usuario
2. Crear componente `VerReporte.jsx` - Vista de solo lectura del reporte + edición de notas
3. Integrar en `App.jsx` con hash routing `#reporte/:id`
4. Mostrar badges con nombres de funcionarios asignados

### Tabla Relacional

Ya existe en `schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS asignaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporte_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  asignado_por INTEGER,
  notas TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (asignado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  UNIQUE(reporte_id, usuario_id)
);
```

**Ventajas:**
- Relación many-to-many (un reporte puede tener múltiples funcionarios)
- Constraint UNIQUE previene duplicados
- ON DELETE CASCADE mantiene integridad referencial
- Campo `asignado_por` para auditoría
- Campo `notas` para registro inicial

### Flujo de Usuario

1. **Funcionario ve mapa:**
   - Popup muestra botón "Ver Reporte" si `reporte.dependencia === usuario.dependencia`
   
2. **Click en "Ver Reporte":**
   - Navega a `#reporte/:id`
   - Fetch `GET /api/reportes/:id` y `GET /api/reportes/:id/asignaciones`
   - Renderiza `VerReporte.jsx`

3. **Vista de Reporte:**
   - Campos de solo lectura: tipo, descripción, ubicación, fecha
   - Badges de funcionarios asignados
   - Campo "Notas de Trabajo" editable solo si el usuario está en la lista de asignados

4. **Guardar Notas:**
   - `PUT /api/reportes/:id/notas { notas: "texto" }`
   - Backend valida que el usuario esté asignado
   - Actualiza campo `notas` en tabla `asignaciones`

### Validaciones Backend

```javascript
// Middleware para verificar asignación
function verificarAsignacion(req, res, next) {
  const { id } = req.params;
  const usuarioId = req.usuario.id; // del JWT
  
  db.get(`
    SELECT 1 FROM asignaciones 
    WHERE reporte_id = ? AND usuario_id = ?
  `, [id, usuarioId], (err, row) => {
    if (err || !row) {
      return res.status(403).json({ error: 'No estás asignado a este reporte' });
    }
    next();
  });
}
```

### Consideraciones de Seguridad

1. **Autenticación requerida:** Todos los endpoints de reportes requieren JWT válido
2. **Autorización por dependencia:** Solo ver reportes de su dependencia
3. **Edición restringida:** Solo editar notas si está asignado
4. **Auditoría:** Campo `asignado_por` registra quién hizo la asignación
5. **Validación de entrada:** Sanitizar notas antes de guardar

---

## Consecuencias

### Positivas
- ✅ Separación clara de responsabilidades (solo asignados pueden editar)
- ✅ Auditoría completa de asignaciones
- ✅ Escalabilidad (múltiples funcionarios por reporte)
- ✅ No se modifica el reporte original (solo notas en tabla separada)

### Negativas
- ⚠️ Requiere autenticación implementada previamente
- ⚠️ Más complejidad en la UI (condicional basado en asignación)
- ⚠️ Necesita gestión de permisos adicional

### Riesgos Mitigados
- **Edición no autorizada:** Verificación de asignación en backend
- **Pérdida de datos:** Transacciones para operaciones críticas
- **Rendimiento:** Índices en `asignaciones(reporte_id, usuario_id)`

---

## Implementación

### Fase 1: Backend API (server/)
- [ ] `server/asignaciones-routes.js` - Endpoints de asignaciones
- [ ] `server/reportes-detail-routes.js` - Endpoint de detalle de reporte
- [ ] Integrar rutas en `server/app.js`
- [ ] Tests unitarios con Supertest

### Fase 2: Frontend Component (client/src/)
- [ ] `client/src/VerReporte.jsx` - Vista de reporte completo
- [ ] Modificar `client/src/SimpleMapView.jsx` - Agregar botón en popup
- [ ] Modificar `client/src/App.jsx` - Routing `#reporte/:id`
- [ ] Tests con Vitest

### Fase 3: E2E Testing (tests/e2e/)
- [ ] Playwright: Login → Ver mapa → Click reporte → Ver notas
- [ ] Validar que no asignados no puedan editar
- [ ] Visual regression screenshots

---

## Referencias

- ADR-0001: Bootstrap del proyecto
- `server/schema.sql` líneas 50-62 (tabla asignaciones)
- `docs/tdd_philosophy.md` - Workflow de testing
- `code_surgeon/README.md` - Protocol de edición segura

---

**Aprobado por:** Sistema de gobernanza AI  
**Implementado por:** Code Surgeon Protocol
