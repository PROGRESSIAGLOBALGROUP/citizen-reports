/**
 * Rutas de gestión de dependencias (Admin)
 * UUID: f9c3d7e5-4e8d-11ef-9a4c-0242ac120007
 * 
 * CRUD completo para dependencias municipales
 * Solo accesibles para usuarios con rol 'admin'
 */

import { getDb } from './db.js';

/**
 * GET /api/dependencias
 * Lista TODAS las dependencias activas (público)
 */
export function listarDependenciasPublico(req, res) {
  const db = getDb();
  
  db.all(
    `SELECT id, slug, nombre, icono, color, orden
     FROM dependencias
     WHERE activo = 1
     ORDER BY orden, nombre`,
    [],
    (err, rows) => {
      if (err) {
        console.error('❌ Error obteniendo dependencias:', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }
      
      console.log(`✅ Dependencias activas obtenidas: ${rows.length}`);
      res.json(rows);
    }
  );
}

/**
 * GET /api/admin/dependencias
 * Lista TODAS las dependencias (activas e inactivas) para admin
 */
export function listarDependencias(req, res) {
  const db = getDb();
  
  db.all(
    `SELECT *
     FROM dependencias
     ORDER BY orden, nombre`,
    [],
    (err, rows) => {
      if (err) {
        console.error('❌ Error obteniendo dependencias (admin):', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }
      
      console.log(`✅ Dependencias obtenidas (admin): ${rows.length}`);
      res.json(rows);
    }
  );
}

/**
 * GET /api/admin/dependencias/:id
 * Obtiene una dependencia específica
 */
export function obtenerDependencia(req, res) {
  const { id } = req.params;
  const db = getDb();
  
  db.get(
    'SELECT * FROM dependencias WHERE id = ?',
    [id],
    (err, row) => {
      if (err) {
        console.error('❌ Error obteniendo dependencia:', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Dependencia no encontrada' });
      }
      
      res.json(row);
    }
  );
}

/**
 * POST /api/admin/dependencias
 * Crea una nueva dependencia
 */
export function crearDependencia(req, res) {
  const { slug, nombre, descripcion, icono, color, responsable, telefono, email, direccion, orden } = req.body;
  
  // Validaciones
  if (!slug || !slug.trim() || !/^[a-z0-9_]+$/.test(slug.trim())) {
    return res.status(400).json({ error: 'El slug debe contener solo letras minúsculas, números y guiones bajos' });
  }
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  
  const db = getDb();
  
  // Verificar slug único
  db.get('SELECT id FROM dependencias WHERE slug = ?', [slug.trim()], (err, existe) => {
    if (err) {
      console.error('Error verificando dependencia:', err);
      return res.status(500).json({ error: 'Error al verificar dependencia' });
    }
    
    if (existe) {
      return res.status(409).json({ error: 'Ya existe una dependencia con ese slug' });
    }
    
    // Insertar dependencia
    db.run(
      `INSERT INTO dependencias (slug, nombre, descripcion, icono, color, responsable, telefono, email, direccion, orden, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        slug.trim(),
        nombre.trim(),
        descripcion || null,
        icono || '🏛️',
        color || '#6b7280',
        responsable || null,
        telefono || null,
        email || null,
        direccion || null,
        orden || 0
      ],
      function (err) {
        if (err) {
          console.error('Error creando dependencia:', err);
          return res.status(500).json({ error: 'Error al crear dependencia' });
        }
        
        // Registrar en historial
        db.run(
          `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, valor_nuevo, razon)
           VALUES (?, 'dependencia', ?, 'creacion', ?, 'Creación de dependencia desde panel admin')`,
          [req.usuario.id, this.lastID, JSON.stringify({ slug, nombre, descripcion, icono, color })]
        );
        
        res.status(201).json({
          id: this.lastID,
          slug: slug.trim(),
          nombre: nombre.trim(),
          mensaje: 'Dependencia creada exitosamente'
        });
      }
    );
  });
}

/**
 * PUT /api/admin/dependencias/:id
 * Actualiza una dependencia existente
 */
export function editarDependencia(req, res) {
  const { id } = req.params;
  const { slug, nombre, descripcion, icono, color, responsable, telefono, email, direccion, orden, activo } = req.body;
  
  // Validaciones
  if (!slug || !slug.trim() || !/^[a-z0-9_]+$/.test(slug.trim())) {
    return res.status(400).json({ error: 'El slug debe contener solo letras minúsculas, números y guiones bajos' });
  }
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  
  const db = getDb();
  
  // Obtener valores anteriores para audit trail
  db.get('SELECT * FROM dependencias WHERE id = ?', [id], (err, anterior) => {
    if (err) {
      console.error('Error obteniendo dependencia:', err);
      return res.status(500).json({ error: 'Error al obtener dependencia' });
    }
    
    if (!anterior) {
      return res.status(404).json({ error: 'Dependencia no encontrada' });
    }
    
    // Verificar slug único (excepto la misma dependencia)
    db.get(
      'SELECT id FROM dependencias WHERE slug = ? AND id != ?',
      [slug.trim(), id],
      (err, existe) => {
        if (err) {
          console.error('Error verificando slug:', err);
          return res.status(500).json({ error: 'Error al verificar slug' });
        }
        
        if (existe) {
          return res.status(409).json({ error: 'Ya existe otra dependencia con ese slug' });
        }
        
        // Actualizar dependencia
        db.run(
          `UPDATE dependencias
           SET slug = ?, nombre = ?, descripcion = ?, icono = ?, color = ?, responsable = ?, telefono = ?, email = ?, direccion = ?, orden = ?, activo = ?, actualizado_en = datetime('now')
           WHERE id = ?`,
          [
            slug.trim(),
            nombre.trim(),
            descripcion || null,
            icono,
            color,
            responsable || null,
            telefono || null,
            email || null,
            direccion || null,
            orden,
            activo ? 1 : 0,
            id
          ],
          function (err) {
            if (err) {
              console.error('Error actualizando dependencia:', err);
              return res.status(500).json({ error: 'Error al actualizar dependencia' });
            }
            
            // Registrar en historial
            db.run(
              `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, valor_anterior, valor_nuevo, razon)
               VALUES (?, 'dependencia', ?, 'edicion', ?, ?, 'Edición de dependencia desde panel admin')`,
              [
                req.usuario.id,
                id,
                JSON.stringify(anterior),
                JSON.stringify({ slug, nombre, descripcion, icono, color, responsable, telefono, email, direccion, orden, activo })
              ]
            );
            
            res.json({
              id,
              slug: slug.trim(),
              nombre: nombre.trim(),
              mensaje: 'Dependencia actualizada exitosamente'
            });
          }
        );
      }
    );
  });
}

/**
 * POST /api/admin/dependencias/:id/reactivar
 * Reactiva una dependencia desactivada
 */
export function reactivarDependencia(req, res) {
  const { id } = req.params;
  const db = getDb();
  
  db.get('SELECT * FROM dependencias WHERE id = ?', [id], (err, dependencia) => {
    if (err || !dependencia) {
      return res.status(404).json({ error: 'Dependencia no encontrada' });
    }
    
    if (dependencia.activo === 1) {
      return res.status(400).json({ error: 'La dependencia ya está activa' });
    }
    
    db.run(
      'UPDATE dependencias SET activo = 1, actualizado_en = datetime(\'now\') WHERE id = ?',
      [id],
      function(err) {
        if (err) {
          console.error('Error reactivando dependencia:', err);
          return res.status(500).json({ error: 'Error al reactivar dependencia' });
        }
        
        // Registrar en historial
        db.run(
          `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, valor_anterior, razon)
           VALUES (?, 'dependencia', ?, 'reactivacion', ?, 'Reactivación de dependencia desde panel admin')`,
          [req.usuario.id, id, JSON.stringify(dependencia)]
        );
        
        res.json({ mensaje: 'Dependencia reactivada exitosamente' });
      }
    );
  });
}

/**
 * DELETE /api/admin/dependencias/:id/permanente
 * Elimina PERMANENTEMENTE una dependencia (solo si está inactiva y sin dependientes)
 */
export function eliminarDependenciaPermanente(req, res) {
  const { id } = req.params;
  const db = getDb();
  
  db.get('SELECT * FROM dependencias WHERE id = ?', [id], (err, dependencia) => {
    if (err || !dependencia) {
      return res.status(404).json({ error: 'Dependencia no encontrada' });
    }
    
    // Solo se puede eliminar permanentemente si está inactiva
    if (dependencia.activo === 1) {
      return res.status(400).json({ error: 'Solo se pueden eliminar permanentemente dependencias inactivas. Primero desactívela.' });
    }
    
    // Verificar que no haya usuarios asociados (activos o inactivos)
    db.get('SELECT COUNT(*) as count FROM usuarios WHERE dependencia = ?', [dependencia.slug], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error verificando usuarios' });
      }
      
      if (result.count > 0) {
        return res.status(409).json({ 
          error: `No se puede eliminar permanentemente porque tiene ${result.count} usuario(s) asociado(s). Reasígnelos primero.` 
        });
      }
      
      // Verificar reportes asociados
      db.get('SELECT COUNT(*) as count FROM reportes WHERE dependencia = ?', [dependencia.slug], (err, reportesResult) => {
        if (err) {
          return res.status(500).json({ error: 'Error verificando reportes' });
        }
        
        if (reportesResult.count > 0) {
          return res.status(409).json({ 
            error: `No se puede eliminar permanentemente porque tiene ${reportesResult.count} reporte(s) histórico(s) asociado(s).` 
          });
        }
        
        // Eliminar tipos de reporte asociados permanentemente
        db.run('DELETE FROM tipos_reporte WHERE dependencia = ?', [dependencia.slug], function(err) {
          if (err) {
            console.error('Error eliminando tipos:', err);
            return res.status(500).json({ error: 'Error al eliminar tipos de reporte' });
          }
          
          const tiposEliminados = this.changes;
          
          // Eliminar la dependencia permanentemente
          db.run('DELETE FROM dependencias WHERE id = ?', [id], function(err) {
            if (err) {
              console.error('Error eliminando dependencia:', err);
              return res.status(500).json({ error: 'Error al eliminar dependencia' });
            }
            
            // Registrar en historial
            db.run(
              `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, valor_anterior, razon)
               VALUES (?, 'dependencia', ?, 'eliminacion_permanente', ?, ?)`,
              [
                req.usuario.id, 
                id, 
                JSON.stringify(dependencia),
                `Eliminación permanente. ${tiposEliminados} tipo(s) eliminado(s).`
              ]
            );
            
            res.json({ 
              mensaje: 'Dependencia eliminada permanentemente',
              tiposEliminados: tiposEliminados
            });
          });
        });
      });
    });
  });
}

/**
 * DELETE /api/admin/dependencias/:id
 * Elimina (desactiva) una dependencia y sus tipos de reporte asociados
 */
export function eliminarDependencia(req, res) {
  const { id } = req.params;
  const db = getDb();
  
  // Verificar si hay usuarios ACTIVOS asociados (consistente con GET /usuarios)
  db.get('SELECT COUNT(*) as count FROM usuarios WHERE dependencia = (SELECT slug FROM dependencias WHERE id = ?) AND activo = 1', [id], (err, result) => {
    if (err) {
      console.error('Error verificando usuarios:', err);
      return res.status(500).json({ error: 'Error al verificar usuarios' });
    }
    
    if (result.count > 0) {
      return res.status(409).json({ 
        error: `No se puede eliminar la dependencia porque tiene ${result.count} usuario(s) activo(s) asociado(s)` 
      });
    }
    
    // Obtener datos para historial
    db.get('SELECT * FROM dependencias WHERE id = ?', [id], (err, dependencia) => {
      if (err || !dependencia) {
        return res.status(404).json({ error: 'Dependencia no encontrada' });
      }
      
      // Contar tipos que serán desactivados
      db.get('SELECT COUNT(*) as count FROM tipos_reporte WHERE dependencia = ? AND activo = 1', [dependencia.slug], (err, tiposResult) => {
        if (err) {
          console.error('Error contando tipos:', err);
          return res.status(500).json({ error: 'Error al verificar tipos' });
        }
        
        const tiposDesactivados = tiposResult?.count || 0;
        
        // Primero desactivar tipos de reporte asociados
        db.run(
          'UPDATE tipos_reporte SET activo = 0, actualizado_en = datetime(\'now\') WHERE dependencia = ? AND activo = 1',
          [dependencia.slug],
          function(err) {
            if (err) {
              console.error('Error desactivando tipos:', err);
              return res.status(500).json({ error: 'Error al desactivar tipos de reporte' });
            }
            
            // Luego desactivar la dependencia (soft delete)
            db.run(
              'UPDATE dependencias SET activo = 0, actualizado_en = datetime(\'now\') WHERE id = ?',
              [id],
              function (err) {
                if (err) {
                  console.error('Error eliminando dependencia:', err);
                  return res.status(500).json({ error: 'Error al eliminar dependencia' });
                }
                
                // Registrar en historial
                db.run(
                  `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, valor_anterior, razon)
                   VALUES (?, 'dependencia', ?, 'eliminacion', ?, ?)`,
                  [
                    req.usuario.id, 
                    id, 
                    JSON.stringify(dependencia),
                    `Eliminación de dependencia. ${tiposDesactivados} tipo(s) de reporte desactivado(s) automáticamente.`
                  ]
                );
                
                res.json({ 
                  mensaje: 'Dependencia eliminada exitosamente',
                  tiposDesactivados: tiposDesactivados
                });
              }
            );
          }
        );
      });
    });
  });
}

/**
 * POST /api/admin/dependencias/:id/reasignar-y-eliminar
 * Reasigna todos los usuarios a otra dependencia y luego elimina esta
 */
export function reasignarYEliminar(req, res) {
  const { id } = req.params;
  const { dependenciaDestino } = req.body;
  const db = getDb();
  
  if (!dependenciaDestino) {
    return res.status(400).json({ error: 'Debe especificar una dependencia destino' });
  }
  
  // Obtener info de la dependencia a eliminar
  db.get('SELECT * FROM dependencias WHERE id = ?', [id], (err, depOrigen) => {
    if (err || !depOrigen) {
      return res.status(404).json({ error: 'Dependencia origen no encontrada' });
    }
    
    // Verificar que la dependencia destino existe
    db.get('SELECT * FROM dependencias WHERE slug = ? AND activo = 1', [dependenciaDestino], (err, depDestino) => {
      if (err || !depDestino) {
        return res.status(404).json({ error: 'Dependencia destino no encontrada' });
      }
      
      // Obtener usuarios a reasignar
      db.all('SELECT id, nombre, email FROM usuarios WHERE dependencia = ?', [depOrigen.slug], (err, usuarios) => {
        if (err) {
          return res.status(500).json({ error: 'Error obteniendo usuarios' });
        }
        
        const usuariosCount = usuarios.length;
        
        // Reasignar usuarios
        db.run(
          'UPDATE usuarios SET dependencia = ?, actualizado_en = datetime(\'now\') WHERE dependencia = ?',
          [dependenciaDestino, depOrigen.slug],
          function(err) {
            if (err) {
              console.error('Error reasignando usuarios:', err);
              return res.status(500).json({ error: 'Error al reasignar usuarios' });
            }
            
            // Ahora desactivar la dependencia
            db.run(
              'UPDATE dependencias SET activo = 0, actualizado_en = datetime(\'now\') WHERE id = ?',
              [id],
              function(err) {
                if (err) {
                  console.error('Error eliminando dependencia:', err);
                  return res.status(500).json({ error: 'Error al eliminar dependencia' });
                }
                
                // Registrar en historial
                db.run(
                  `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, valor_anterior, valor_nuevo, razon)
                   VALUES (?, 'dependencia', ?, 'eliminacion_con_reasignacion', ?, ?, ?)`,
                  [
                    req.usuario.id, 
                    id, 
                    JSON.stringify({ dependencia: depOrigen, usuarios_afectados: usuariosCount }),
                    JSON.stringify({ dependencia_destino: dependenciaDestino }),
                    `Eliminación con reasignación de ${usuariosCount} usuario(s) a ${dependenciaDestino}`
                  ]
                );
                
                res.json({ 
                  mensaje: `Dependencia eliminada. ${usuariosCount} usuario(s) reasignado(s) a ${depDestino.nombre}.`,
                  usuariosReasignados: usuariosCount
                });
              }
            );
          }
        );
      });
    });
  });
}

/**
 * GET /api/admin/dependencias/:id/usuarios
 * Obtiene los usuarios y tipos de reporte asociados a una dependencia
 */
export function obtenerUsuariosDependencia(req, res) {
  const { id } = req.params;
  const db = getDb();
  
  db.get('SELECT slug, nombre FROM dependencias WHERE id = ?', [id], (err, dep) => {
    if (err || !dep) {
      return res.status(404).json({ error: 'Dependencia no encontrada' });
    }
    
    // Obtener usuarios activos
    db.all(
      'SELECT id, nombre, email, rol FROM usuarios WHERE dependencia = ? AND activo = 1',
      [dep.slug],
      (err, usuarios) => {
        if (err) {
          return res.status(500).json({ error: 'Error obteniendo usuarios' });
        }
        
        // También obtener tipos de reporte activos asociados
        db.all(
          'SELECT id, tipo, nombre FROM tipos_reporte WHERE dependencia = ? AND activo = 1',
          [dep.slug],
          (err, tipos) => {
            if (err) {
              return res.status(500).json({ error: 'Error obteniendo tipos' });
            }
            
            res.json({
              dependencia: dep.nombre,
              slug: dep.slug,
              usuarios: usuarios,
              count: usuarios.length,
              tipos: tipos,
              tiposCount: tipos.length
            });
          }
        );
      }
    );
  });
}

/**
 * PATCH /api/admin/dependencias/:id/orden
 * Actualiza el orden de una dependencia (para drag & drop)
 */
export function actualizarOrdenDependencia(req, res) {
  const { id } = req.params;
  const { nuevoOrden } = req.body;
  
  if (typeof nuevoOrden !== 'number') {
    return res.status(400).json({ error: 'El orden debe ser un número' });
  }
  
  const db = getDb();
  
  db.run(
    'UPDATE dependencias SET orden = ?, actualizado_en = datetime(\'now\') WHERE id = ?',
    [nuevoOrden, id],
    function (err) {
      if (err) {
        console.error('Error actualizando orden:', err);
        return res.status(500).json({ error: 'Error al actualizar orden' });
      }
      
      res.json({ mensaje: 'Orden actualizado exitosamente' });
    }
  );
}
