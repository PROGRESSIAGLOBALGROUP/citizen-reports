# Sistema de Reasignación Interdepartamental y Audit Trail

**Fecha:** 2025-10-03  
**Requerimiento:** Permitir que el administrador reasigne reportes entre departamentos con trazabilidad completa

---

## 🎯 Objetivos

1. **Reasignación Inteligente:** Al asignar un funcionario de otro departamento, actualizar automáticamente el tipo de reporte
2. **Audit Trail Completo:** Registrar todos los cambios con: quién, qué, cuándo, por qué
3. **Trazabilidad:** Mantener historial inmutable de todas las modificaciones
4. **Actualización Visual:** Reflejar cambios en iconos del mapa según nuevo tipo

---

## 📊 Diseño de Base de Datos

### Nueva Tabla: `historial_cambios`

```sql
CREATE TABLE historial_cambios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporte_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  tipo_cambio TEXT NOT NULL,  -- 'asignacion', 'reasignacion', 'cambio_tipo', 'cambio_estado', etc.
  campo_modificado TEXT,       -- Nombre del campo (tipo, estado, dependencia, etc.)
  valor_anterior TEXT,          -- Valor antes del cambio (JSON si es complejo)
  valor_nuevo TEXT,             -- Valor después del cambio (JSON si es complejo)
  razon TEXT,                   -- Motivo del cambio (proporcionado por usuario)
  metadatos TEXT,               -- JSON con info adicional (IP, user agent, etc.)
  creado_en TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_historial_reporte ON historial_cambios(reporte_id);
CREATE INDEX idx_historial_usuario ON historial_cambios(usuario_id);
CREATE INDEX idx_historial_fecha ON historial_cambios(creado_en);
CREATE INDEX idx_historial_tipo ON historial_cambios(tipo_cambio);
```

---

## 🔄 Lógica de Reasignación Interdepartamental

### Mapeo: Departamento → Tipos de Reporte

```javascript
const TIPOS_POR_DEPENDENCIA = {
  'obras_publicas': ['bache', 'pavimento_danado', 'banqueta_rota', 'alcantarilla'],
  'servicios_publicos': ['alumbrado', 'falta_agua', 'fuga_agua', 'basura'],
  'seguridad_publica': ['inseguridad', 'accidente', 'delito'],
  'salud': ['plaga', 'mascota_herida', 'contaminacion'],
  'medio_ambiente': ['arbol_caido', 'deforestacion', 'quema']
};

const DEPENDENCIA_POR_TIPO = {
  'bache': 'obras_publicas',
  'pavimento_danado': 'obras_publicas',
  'banqueta_rota': 'obras_publicas',
  'alcantarilla': 'obras_publicas',
  'alumbrado': 'servicios_publicos',
  'falta_agua': 'servicios_publicos',
  'fuga_agua': 'servicios_publicos',
  'basura': 'servicios_publicos',
  'inseguridad': 'seguridad_publica',
  'accidente': 'seguridad_publica',
  'delito': 'seguridad_publica',
  'plaga': 'salud',
  'mascota_herida': 'salud',
  'contaminacion': 'salud',
  'arbol_caido': 'medio_ambiente',
  'deforestacion': 'medio_ambiente',
  'quema': 'medio_ambiente'
};
```

### Flujo de Reasignación

```javascript
/**
 * POST /api/reportes/:id/reasignar
 * Reasigna un reporte a funcionario de otro departamento
 * Actualiza tipo de reporte automáticamente si es necesario
 */
export function reasignarReporte(req, res) {
  const { id } = req.params;
  const { 
    funcionario_id,      // Nuevo funcionario
    razon,               // Motivo de la reasignación
    nuevo_tipo,          // Tipo sugerido (opcional, calculado si no se provee)
    mantener_tipo        // Flag para NO cambiar el tipo (casos especiales)
  } = req.body;
  const usuario_actual = req.usuario; // Del middleware de auth
  const db = getDb();

  // 1. Validaciones
  if (!funcionario_id || !razon || razon.trim().length < 10) {
    return res.status(400).json({ 
      error: 'Se requiere funcionario_id y razón (mínimo 10 caracteres)' 
    });
  }

  // 2. Obtener reporte actual
  db.get('SELECT * FROM reportes WHERE id = ?', [id], (err, reporte) => {
    if (err) return res.status(500).json({ error: 'Error de BD' });
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });

    // 3. Obtener funcionario destino
    db.get('SELECT * FROM usuarios WHERE id = ? AND rol = "funcionario" AND activo = 1', 
      [funcionario_id], (err, funcionario) => {
        if (err) return res.status(500).json({ error: 'Error de BD' });
        if (!funcionario) {
          return res.status(404).json({ error: 'Funcionario no encontrado o inactivo' });
        }

        // 4. Detectar cambio de departamento
        const dependenciaActual = DEPENDENCIA_POR_TIPO[reporte.tipo];
        const dependenciaNueva = funcionario.dependencia;
        const esCambioDependencia = dependenciaActual !== dependenciaNueva;

        let tipoFinal = reporte.tipo;
        let cambioTipo = false;

        // 5. Si cambia de departamento y no se fuerza mantener tipo
        if (esCambioDependencia && !mantener_tipo) {
          // Determinar nuevo tipo
          const tiposDisponibles = TIPOS_POR_DEPENDENCIA[dependenciaNueva] || [];
          
          if (nuevo_tipo && tiposDisponibles.includes(nuevo_tipo)) {
            tipoFinal = nuevo_tipo;
          } else if (tiposDisponibles.length > 0) {
            // Usar primer tipo de la nueva dependencia como default
            tipoFinal = tiposDisponibles[0];
          }

          cambioTipo = (tipoFinal !== reporte.tipo);
        }

        // 6. Obtener asignaciones actuales
        db.all('SELECT usuario_id FROM asignaciones WHERE reporte_id = ?', [id], 
          (err, asignacionesActuales) => {
            if (err) return res.status(500).json({ error: 'Error de BD' });

            // 7. Iniciar transacción
            db.serialize(() => {
              db.run('BEGIN TRANSACTION');

              try {
                // 7a. Eliminar asignaciones anteriores
                const funcionariosAnteriores = asignacionesActuales.map(a => a.usuario_id);
                
                db.run('DELETE FROM asignaciones WHERE reporte_id = ?', [id], (err) => {
                  if (err) throw err;

                  // Registrar desasignaciones en historial
                  funcionariosAnteriores.forEach(antiguoId => {
                    db.run(`
                      INSERT INTO historial_cambios 
                      (reporte_id, usuario_id, tipo_cambio, campo_modificado, valor_anterior, valor_nuevo, razon, metadatos)
                      VALUES (?, ?, 'desasignacion', 'asignaciones', ?, NULL, ?, ?)
                    `, [
                      id, 
                      usuario_actual.id, 
                      antiguoId.toString(),
                      razon,
                      JSON.stringify({ 
                        ip: req.ip, 
                        user_agent: req.get('user-agent'),
                        motivo: 'reasignacion_interdepartamental'
                      })
                    ]);
                  });

                  // 7b. Crear nueva asignación
                  db.run(`
                    INSERT INTO asignaciones (reporte_id, usuario_id, asignado_por, notas)
                    VALUES (?, ?, ?, ?)
                  `, [id, funcionario_id, usuario_actual.id, `Reasignado: ${razon}`], function(err) {
                    if (err) throw err;

                    // Registrar nueva asignación
                    db.run(`
                      INSERT INTO historial_cambios 
                      (reporte_id, usuario_id, tipo_cambio, campo_modificado, valor_anterior, valor_nuevo, razon, metadatos)
                      VALUES (?, ?, 'asignacion', 'asignaciones', NULL, ?, ?, ?)
                    `, [
                      id,
                      usuario_actual.id,
                      funcionario_id.toString(),
                      razon,
                      JSON.stringify({
                        ip: req.ip,
                        user_agent: req.get('user-agent'),
                        funcionario_nombre: funcionario.nombre,
                        dependencia: funcionario.dependencia
                      })
                    ]);

                    // 7c. Actualizar tipo si cambió departamento
                    if (cambioTipo) {
                      db.run('UPDATE reportes SET tipo = ? WHERE id = ?', [tipoFinal, id], (err) => {
                        if (err) throw err;

                        // Registrar cambio de tipo
                        db.run(`
                          INSERT INTO historial_cambios 
                          (reporte_id, usuario_id, tipo_cambio, campo_modificado, valor_anterior, valor_nuevo, razon, metadatos)
                          VALUES (?, ?, 'cambio_tipo', 'tipo', ?, ?, ?, ?)
                        `, [
                          id,
                          usuario_actual.id,
                          reporte.tipo,
                          tipoFinal,
                          `Cambio automático por reasignación a ${dependenciaNueva}`,
                          JSON.stringify({
                            dependencia_anterior: dependenciaActual,
                            dependencia_nueva: dependenciaNueva,
                            razon_original: razon
                          })
                        ]);
                      });
                    }

                    // 7d. Actualizar estado a 'asignado' si estaba 'abierto'
                    db.run(`UPDATE reportes SET estado = 'asignado' WHERE id = ? AND estado = 'abierto'`, [id]);

                    // 8. Commit transacción
                    db.run('COMMIT', (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Error al confirmar cambios' });
                      }

                      // 9. Respuesta exitosa
                      res.json({
                        mensaje: 'Reporte reasignado exitosamente',
                        cambios: {
                          tipo_actualizado: cambioTipo,
                          tipo_anterior: reporte.tipo,
                          tipo_nuevo: tipoFinal,
                          dependencia_anterior: dependenciaActual,
                          dependencia_nueva: dependenciaNueva,
                          funcionario_anterior: funcionariosAnteriores,
                          funcionario_nuevo: funcionario_id
                        }
                      });
                    });
                  });
                });

              } catch (error) {
                db.run('ROLLBACK');
                console.error('Error en reasignación:', error);
                return res.status(500).json({ error: 'Error en la transacción' });
              }
            });
          });
      });
  });
}
```

---

## 🔍 Endpoint para Consultar Historial

```javascript
/**
 * GET /api/reportes/:id/historial
 * Obtiene el audit trail completo de un reporte
 */
export function obtenerHistorial(req, res) {
  const { id } = req.params;
  const db = getDb();

  const sql = `
    SELECT 
      h.*,
      u.nombre as usuario_nombre,
      u.email as usuario_email,
      u.rol as usuario_rol
    FROM historial_cambios h
    JOIN usuarios u ON h.usuario_id = u.id
    WHERE h.reporte_id = ?
    ORDER BY h.creado_en DESC
  `;

  db.all(sql, [id], (err, rows) => {
    if (err) {
      console.error('Error obteniendo historial:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }

    // Parsear metadatos JSON
    const historial = rows.map(row => ({
      ...row,
      metadatos: row.metadatos ? JSON.parse(row.metadatos) : null
    }));

    res.json(historial);
  });
}
```

---

## 🎨 Frontend: Modal de Reasignación

```jsx
// Nuevo modal en PanelFuncionario.jsx
const [mostrarModalReasignacion, setMostrarModalReasignacion] = useState(false);
const [reporteAReasignar, setReporteAReasignar] = useState(null);
const [razonReasignacion, setRazonReasignacion] = useState('');
const [nuevoTipoSugerido, setNuevoTipoSugerido] = useState('');
const [mantenerTipo, setMantenerTipo] = useState(false);

const abrirModalReasignacion = (reporte) => {
  setReporteAReasignar(reporte);
  setRazonReasignacion('');
  setMantenerTipo(false);
  setMostrarModalReasignacion(true);
  cargarFuncionarios(); // Cargar todos los funcionarios
};

const handleReasignar = async () => {
  if (!funcionarioSeleccionado) {
    alert('Selecciona un funcionario');
    return;
  }

  if (razonReasignacion.trim().length < 10) {
    alert('La razón debe tener al menos 10 caracteres');
    return;
  }

  try {
    const response = await fetch(`/api/reportes/${reporteAReasignar.id}/reasignar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        funcionario_id: funcionarioSeleccionado,
        razon: razonReasignacion,
        nuevo_tipo: nuevoTipoSugerido || undefined,
        mantener_tipo: mantenerTipo
      })
    });

    if (!response.ok) throw new Error('Error en reasignación');

    const resultado = await response.json();

    // Mostrar resumen de cambios
    let mensaje = '✅ Reasignación exitosa\n\n';
    if (resultado.cambios.tipo_actualizado) {
      mensaje += `📝 Tipo actualizado:\n`;
      mensaje += `   De: "${resultado.cambios.tipo_anterior}"\n`;
      mensaje += `   A: "${resultado.cambios.tipo_nuevo}"\n\n`;
      mensaje += `🏛️ Departamento:\n`;
      mensaje += `   De: "${resultado.cambios.dependencia_anterior}"\n`;
      mensaje += `   A: "${resultado.cambios.dependencia_nueva}"`;
    }

    alert(mensaje);
    setMostrarModalReasignacion(false);
    cargarReportes(); // Recargar lista
  } catch (error) {
    console.error('Error reasignando:', error);
    alert('Error al reasignar reporte');
  }
};

// JSX del modal
{mostrarModalReasignacion && (
  <div style={{ /* modal overlay */ }}>
    <div style={{ /* modal content */ }}>
      <h3>🔄 Reasignar Reporte #{reporteAReasignar?.id}</h3>
      
      <div>
        <strong>Tipo actual:</strong> {reporteAReasignar?.tipo}
        <br />
        <strong>Departamento actual:</strong> {DEPENDENCIA_POR_TIPO[reporteAReasignar?.tipo]}
      </div>

      <label>
        Nuevo Funcionario *
        <select value={funcionarioSeleccionado} onChange={(e) => {
          setFuncionarioSeleccionado(e.target.value);
          
          // Auto-detectar si cambia departamento
          const func = funcionariosDisponibles.find(f => f.id === parseInt(e.target.value));
          if (func) {
            const depActual = DEPENDENCIA_POR_TIPO[reporteAReasignar.tipo];
            const depNueva = func.dependencia;
            
            if (depActual !== depNueva) {
              const tiposNuevos = TIPOS_POR_DEPENDENCIA[depNueva] || [];
              setNuevoTipoSugerido(tiposNuevos[0] || '');
            }
          }
        }}>
          <option value="">-- Selecciona funcionario --</option>
          {funcionariosDisponibles.map(f => (
            <option key={f.id} value={f.id}>
              {f.nombre} - {f.dependencia}
            </option>
          ))}
        </select>
      </label>

      {nuevoTipoSugerido && (
        <div style={{ background: '#fff3cd', padding: 10, borderRadius: 5 }}>
          ⚠️ <strong>Cambio de departamento detectado</strong>
          <br />
          Tipo sugerido: <strong>{nuevoTipoSugerido}</strong>
          <br />
          <label>
            <input 
              type="checkbox" 
              checked={mantenerTipo}
              onChange={(e) => setMantenerTipo(e.target.checked)}
            />
            Mantener tipo "{reporteAReasignar.tipo}" (no cambiar automáticamente)
          </label>
        </div>
      )}

      <label>
        Razón de la reasignación * (mínimo 10 caracteres)
        <textarea
          value={razonReasignacion}
          onChange={(e) => setRazonReasignacion(e.target.value)}
          placeholder="Ej: El reporte fue mal categorizado, corresponde a otro departamento..."
          rows={4}
          style={{ width: '100%' }}
        />
        <small>{razonReasignacion.length} caracteres</small>
      </label>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setMostrarModalReasignacion(false)}>
          Cancelar
        </button>
        <button 
          onClick={handleReasignar}
          disabled={!funcionarioSeleccionado || razonReasignacion.length < 10}
          style={{ background: '#007bff', color: 'white' }}
        >
          🔄 Reasignar
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 📜 Frontend: Visualización de Historial

```jsx
const [mostrarHistorial, setMostrarHistorial] = useState(false);
const [historialReporte, setHistorialReporte] = useState([]);

const cargarHistorial = async (reporteId) => {
  try {
    const response = await fetch(`/api/reportes/${reporteId}/historial`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Error cargando historial');

    const data = await response.json();
    setHistorialReporte(data);
    setMostrarHistorial(true);
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar historial');
  }
};

// JSX del modal de historial
{mostrarHistorial && (
  <div style={{ /* modal overlay */ }}>
    <div style={{ /* modal content, width: 80%, maxHeight: 600px */ }}>
      <h3>📜 Historial de Cambios</h3>
      
      <div style={{ overflowY: 'auto', maxHeight: 500 }}>
        {historialReporte.map((cambio, idx) => (
          <div key={idx} style={{ 
            borderLeft: '3px solid #007bff', 
            paddingLeft: 15, 
            marginBottom: 20 
          }}>
            <div style={{ fontSize: 12, color: '#666' }}>
              {new Date(cambio.creado_en).toLocaleString('es-MX')}
            </div>
            
            <div style={{ fontWeight: 'bold', marginTop: 5 }}>
              {cambio.tipo_cambio.toUpperCase()}
            </div>

            <div>
              👤 {cambio.usuario_nombre} ({cambio.usuario_rol})
            </div>

            {cambio.valor_anterior && (
              <div>
                ❌ Antes: <code>{cambio.valor_anterior}</code>
              </div>
            )}

            {cambio.valor_nuevo && (
              <div>
                ✅ Después: <code>{cambio.valor_nuevo}</code>
              </div>
            )}

            {cambio.razon && (
              <div style={{ fontStyle: 'italic', marginTop: 5 }}>
                💬 "{cambio.razon}"
              </div>
            )}

            {cambio.metadatos && (
              <details style={{ fontSize: 11, marginTop: 5 }}>
                <summary>Metadatos</summary>
                <pre>{JSON.stringify(cambio.metadatos, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>

      <button onClick={() => setMostrarHistorial(false)}>
        Cerrar
      </button>
    </div>
  </div>
)}
```

---

## ✅ Checklist de Implementación

- [ ] Crear migración `003-audit-trail.sql`
- [ ] Implementar `reasignarReporte()` en `server/asignaciones-routes.js`
- [ ] Implementar `obtenerHistorial()` en `server/asignaciones-routes.js`
- [ ] Agregar rutas en `server/app.js`
- [ ] Agregar modal de reasignación en `client/src/PanelFuncionario.jsx`
- [ ] Agregar modal de historial en `client/src/PanelFuncionario.jsx`
- [ ] Agregar botón "🔄 Reasignar" en lista de reportes (solo admin)
- [ ] Agregar botón "📜 Ver Historial" en detalles de reporte
- [ ] Crear tests unitarios para reasignación
- [ ] Crear tests E2E para flujo completo
- [ ] Documentar en `docs/api/openapi.yaml`

---

## 🚀 Próximos Pasos

¿Quieres que implemente esta funcionalidad completa ahora? Incluye:

1. ✅ Migración de base de datos
2. ✅ Endpoints backend con transacciones
3. ✅ UI completa con modales
4. ✅ Audit trail visualizable
5. ✅ Actualización automática de tipos según departamento

**Tiempo estimado de implementación:** ~2 horas
