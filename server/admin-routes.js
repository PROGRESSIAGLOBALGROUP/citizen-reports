/**
 * Rutas de administración para gestión de categorías y tipos de reporte
 * Solo accesibles para usuarios con rol 'admin'
 * 
 * Endpoints:
 * - POST   /api/admin/categorias
 * - PUT    /api/admin/categorias/:id
 * - DELETE /api/admin/categorias/:id
 * - PATCH  /api/admin/categorias/:id/orden
 * - POST   /api/admin/tipos
 * - PUT    /api/admin/tipos/:id
 * - DELETE /api/admin/tipos/:id
 * - GET    /api/admin/database/backup
 * - DELETE /api/admin/database/reports
 * - POST   /api/admin/database/reset
 */

import { getDb } from './db.js';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Crear nueva categoría
 */
export function crearCategoria(req, res) {
  const { nombre, icono, color, orden } = req.body;
  
  // Validaciones
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  if (!icono || !icono.trim()) {
    return res.status(400).json({ error: 'El icono es obligatorio' });
  }
  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return res.status(400).json({ error: 'El color debe ser formato hex (#rrggbb)' });
  }
  
  const db = getDb();
  
  // Verificar nombre único
  db.get('SELECT id FROM categorias WHERE nombre = ?', [nombre.trim()], (err, existe) => {
    if (err) {
      console.error('Error verificando categoría:', err);
      return res.status(500).json({ error: 'Error al verificar categoría' });
    }
    
    if (existe) {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    
    // Insertar categoría
    db.run(
      `INSERT INTO categorias (nombre, icono, color, orden, activo)
       VALUES (?, ?, ?, ?, 1)`,
      [nombre.trim(), icono.trim(), color, orden || 999],
      function (err) {
        if (err) {
          console.error('Error creando categoría:', err);
          return res.status(500).json({ error: 'Error al crear categoría' });
        }
        
        // Registrar en historial
        db.run(
          `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, valor_nuevo, razon)
           VALUES (?, 'categoria', ?, 'creacion', ?, 'Creación de categoría desde panel admin')`,
          [req.usuario.id, this.lastID, JSON.stringify({ nombre, icono, color, orden })]
        );
        
        res.status(201).json({
          id: this.lastID,
          nombre: nombre.trim(),
          icono: icono.trim(),
          color,
          orden: orden || 999,
          activo: 1
        });
      }
    );
  });
}

/**
 * Editar categoría existente
 */
export function editarCategoria(req, res) {
  const { id } = req.params;
  const { nombre, icono, color, orden, activo } = req.body;
  
  // Validaciones
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  if (!icono || !icono.trim()) {
    return res.status(400).json({ error: 'El icono es obligatorio' });
  }
  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return res.status(400).json({ error: 'El color debe ser formato hex (#rrggbb)' });
  }
  
  const db = getDb();
  
  // Obtener valores anteriores para audit trail
  db.get('SELECT * FROM categorias WHERE id = ?', [id], (err, anterior) => {
    if (err) {
      console.error('Error obteniendo categoría:', err);
      return res.status(500).json({ error: 'Error al obtener categoría' });
    }
    
    if (!anterior) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    // Verificar nombre único (excepto la misma categoría)
    db.get(
      'SELECT id FROM categorias WHERE nombre = ? AND id != ?',
      [nombre.trim(), id],
      (err, existe) => {
        if (err) {
          console.error('Error verificando nombre:', err);
          return res.status(500).json({ error: 'Error al verificar nombre' });
        }
        
        if (existe) {
          return res.status(409).json({ error: 'Ya existe otra categoría con ese nombre' });
        }
        
        // Actualizar categoría
        db.run(
          `UPDATE categorias
           SET nombre = ?, icono = ?, color = ?, orden = ?, activo = ?
           WHERE id = ?`,
          [nombre.trim(), icono.trim(), color, orden, activo ? 1 : 0, id],
          function (err) {
            if (err) {
              console.error('Error actualizando categoría:', err);
              return res.status(500).json({ error: 'Error al actualizar categoría' });
            }
            
            // Registrar en historial
            db.run(
              `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, valor_anterior, valor_nuevo, razon)
               VALUES (?, 'categoria', ?, 'edicion', ?, ?, 'Edición de categoría desde panel admin')`,
              [
                req.usuario.id,
                id,
                JSON.stringify(anterior),
                JSON.stringify({ nombre, icono, color, orden, activo })
              ]
            );
            
            res.json({
              id: Number(id),
              nombre: nombre.trim(),
              icono: icono.trim(),
              color,
              orden,
              activo: activo ? 1 : 0
            });
          }
        );
      }
    );
  });
}

/**
 * Eliminar categoría (solo si no tiene tipos asociados)
 */
export function eliminarCategoria(req, res) {
  const { id } = req.params;
  const db = getDb();
  
  // Verificar si tiene tipos asociados
  db.get(
    'SELECT COUNT(*) as total FROM tipos_reporte WHERE categoria_id = ? AND activo = 1',
    [id],
    (err, result) => {
      if (err) {
        console.error('Error verificando tipos asociados:', err);
        return res.status(500).json({ error: 'Error al verificar tipos asociados' });
      }
      
      if (result.total > 0) {
        return res.status(409).json({
          error: 'No se puede eliminar la categoría porque tiene tipos de reporte asociados',
          tiposAsociados: result.total
        });
      }
      
      // Obtener datos para audit trail
      db.get('SELECT * FROM categorias WHERE id = ?', [id], (err, categoria) => {
        if (err) {
          console.error('Error obteniendo categoría:', err);
          return res.status(500).json({ error: 'Error al obtener categoría' });
        }
        
        if (!categoria) {
          return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        
        // Soft delete (marcar como inactivo)
        db.run(
          'UPDATE categorias SET activo = 0 WHERE id = ?',
          [id],
          function (err) {
            if (err) {
              console.error('Error eliminando categoría:', err);
              return res.status(500).json({ error: 'Error al eliminar categoría' });
            }
            
            // Registrar en historial
            db.run(
              `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, valor_anterior, razon)
               VALUES (?, 'categoria', ?, 'eliminacion', ?, 'Eliminación de categoría desde panel admin')`,
              [req.usuario.id, id, JSON.stringify(categoria)]
            );
            
            res.json({ mensaje: 'Categoría eliminada correctamente' });
          }
        );
      });
    }
  );
}

/**
 * Reordenar categorías
 */
export function reordenarCategorias(req, res) {
  const { id } = req.params;
  const { nuevoOrden } = req.body;
  
  if (typeof nuevoOrden !== 'number') {
    return res.status(400).json({ error: 'El orden debe ser un número' });
  }
  
  const db = getDb();
  
  db.run(
    'UPDATE categorias SET orden = ? WHERE id = ?',
    [nuevoOrden, id],
    function (err) {
      if (err) {
        console.error('Error reordenando categoría:', err);
        return res.status(500).json({ error: 'Error al reordenar categoría' });
      }
      
      res.json({ mensaje: 'Orden actualizado correctamente' });
    }
  );
}

/**
 * Crear nuevo tipo de reporte
 */
export function crearTipo(req, res) {
  const { categoria_id, slug, nombre, descripcion, icono, dependencia } = req.body;
  
  // Validaciones
  if (!categoria_id) {
    return res.status(400).json({ error: 'La categoría es obligatoria' });
  }
  if (!slug || !slug.trim() || !/^[a-z0-9_]+$/.test(slug.trim())) {
    return res.status(400).json({ error: 'El slug debe contener solo letras minúsculas, números y guiones bajos' });
  }
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  
  const db = getDb();
  
  // Verificar slug único
  db.get('SELECT id FROM tipos_reporte WHERE tipo = ?', [slug.trim()], (err, existe) => {
    if (err) {
      console.error('Error verificando tipo:', err);
      return res.status(500).json({ error: 'Error al verificar tipo' });
    }
    
    if (existe) {
      return res.status(409).json({ error: 'Ya existe un tipo con ese slug' });
    }
    
    // Verificar que la categoría existe
    db.get('SELECT id FROM categorias WHERE id = ? AND activo = 1', [categoria_id], (err, cat) => {
      if (err) {
        console.error('Error verificando categoría:', err);
        return res.status(500).json({ error: 'Error al verificar categoría' });
      }
      
      if (!cat) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      
      // Insertar tipo
      db.run(
        `INSERT INTO tipos_reporte (categoria_id, tipo, nombre, descripcion, icono, dependencia, activo)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [categoria_id, slug.trim(), nombre.trim(), descripcion || null, icono || '📋', dependencia || 'servicios_publicos'],
        function (err) {
          if (err) {
            console.error('Error creando tipo:', err);
            return res.status(500).json({ error: 'Error al crear tipo' });
          }
          
          // Registrar en historial
          db.run(
            `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, valor_nuevo, razon)
             VALUES (?, 'tipo_reporte', ?, 'creacion', ?, 'Creación de tipo desde panel admin')`,
            [req.usuario.id, this.lastID, JSON.stringify({ categoria_id, slug, nombre, descripcion, icono, dependencia })]
          );
          
          res.status(201).json({
            id: this.lastID,
            categoria_id,
            slug: slug.trim(),
            nombre: nombre.trim(),
            descripcion: descripcion || null,
            icono: icono || '📋',
            dependencia: dependencia || 'servicios_publicos',
            activo: 1
          });
        }
      );
    });
  });
}

/**
 * Editar tipo de reporte existente
 */
export function editarTipo(req, res) {
  const { id } = req.params;
  const { categoria_id, slug, nombre, descripcion, icono, dependencia, activo } = req.body;
  
  // Validaciones
  if (!categoria_id) {
    return res.status(400).json({ error: 'La categoría es obligatoria' });
  }
  if (!slug || !slug.trim() || !/^[a-z0-9_]+$/.test(slug.trim())) {
    return res.status(400).json({ error: 'El slug debe contener solo letras minúsculas, números y guiones bajos' });
  }
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  
  const db = getDb();
  
  // Obtener valores anteriores para audit trail
  db.get('SELECT * FROM tipos_reporte WHERE id = ?', [id], (err, anterior) => {
    if (err) {
      console.error('Error obteniendo tipo:', err);
      return res.status(500).json({ error: 'Error al obtener tipo' });
    }
    
    if (!anterior) {
      return res.status(404).json({ error: 'Tipo no encontrado' });
    }
    
    // Verificar slug único (excepto el mismo tipo)
    db.get(
      'SELECT id FROM tipos_reporte WHERE tipo = ? AND id != ?',
      [slug.trim(), id],
      (err, existe) => {
        if (err) {
          console.error('Error verificando slug:', err);
          return res.status(500).json({ error: 'Error al verificar slug' });
        }
        
        if (existe) {
          return res.status(409).json({ error: 'Ya existe otro tipo con ese slug' });
        }
        
        // Actualizar tipo
        db.run(
          `UPDATE tipos_reporte
           SET categoria_id = ?, tipo = ?, nombre = ?, descripcion = ?, icono = ?, dependencia = ?, activo = ?
           WHERE id = ?`,
          [categoria_id, slug.trim(), nombre.trim(), descripcion || null, icono, dependencia, activo ? 1 : 0, id],
          function (err) {
            if (err) {
              console.error('Error actualizando tipo:', err);
              return res.status(500).json({ error: 'Error al actualizar tipo' });
            }
            
            // Registrar en historial
            db.run(
              `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, valor_anterior, valor_nuevo, razon)
               VALUES (?, 'tipo_reporte', ?, 'edicion', ?, ?, 'Edición de tipo desde panel admin')`,
              [
                req.usuario.id,
                id,
                JSON.stringify(anterior),
                JSON.stringify({ categoria_id, slug, nombre, descripcion, icono, dependencia, activo })
              ]
            );
            
            res.json({
              id: Number(id),
              categoria_id,
              slug: slug.trim(),
              nombre: nombre.trim(),
              descripcion: descripcion || null,
              icono,
              dependencia,
              activo: activo ? 1 : 0
            });
          }
        );
      }
    );
  });
}

/**
 * Eliminar tipo de reporte
 */
export function eliminarTipo(req, res) {
  const { id } = req.params;
  const db = getDb();
  
  // Obtener datos para audit trail
  db.get('SELECT * FROM tipos_reporte WHERE id = ?', [id], (err, tipo) => {
    if (err) {
      console.error('Error obteniendo tipo:', err);
      return res.status(500).json({ error: 'Error al obtener tipo' });
    }
    
    if (!tipo) {
      return res.status(404).json({ error: 'Tipo no encontrado' });
    }
    
    // Soft delete (marcar como inactivo)
    db.run(
      'UPDATE tipos_reporte SET activo = 0 WHERE id = ?',
      [id],
      function (err) {
        if (err) {
          console.error('Error eliminando tipo:', err);
          return res.status(500).json({ error: 'Error al eliminar tipo' });
        }
        
        // Registrar en historial
        db.run(
          `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, valor_anterior, razon)
           VALUES (?, 'tipo_reporte', ?, 'eliminacion', ?, 'Eliminación de tipo desde panel admin')`,
          [req.usuario.id, id, JSON.stringify(tipo)]
        );
        
        res.json({ mensaje: 'Tipo eliminado correctamente' });
      }
    );
  });
}

/**
 * ============================================
 * FUNCIONES DE MANTENIMIENTO DE BASE DE DATOS
 * ============================================
 */

/**
 * Descargar respaldo de la base de datos
 * GET /api/admin/database/backup
 */
export function descargarBackupDatabase(req, res) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  
  // Usar la misma lógica que resolveDbPath() en db.js
  let dbPath;
  const custom = process.env.DB_PATH;
  if (custom) {
    dbPath = path.isAbsolute(custom) ? custom : path.resolve(process.cwd(), custom);
  } else {
    dbPath = path.join(__dirname, '..', 'data.db');
  }
  
  // Verificar que el archivo existe
  if (!fs.existsSync(dbPath)) {
    return res.status(404).json({ error: 'Base de datos no encontrada: ' + dbPath });
  }
  
  try {
    // Obtener tamaño del archivo
    const stats = fs.statSync(dbPath);
    
    // Configurar headers para descarga
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `citizen-reports-backup-${timestamp}.db`;
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);
    
    // Enviar archivo como stream
    const fileStream = fs.createReadStream(dbPath);
    fileStream.pipe(res);
    
    // Registrar en historial
    const db = getDb();
    db.run(
      `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, razon)
       VALUES (?, 'database', 0, 'backup_descargado', 'Descarga de respaldo de BD desde panel admin')`,
      [req.usuario.id]
    );
    
  } catch (error) {
    console.error('Error descargando backup:', error);
    res.status(500).json({ error: 'Error al descargar respaldo' });
  }
}

/**
 * Eliminar todos los reportes
 * DELETE /api/admin/database/reports
 * Body: { confirmacion: "eliminar_todos_reportes" }
 */
export function eliminarTodosReportes(req, res) {
  const { confirmacion } = req.body;
  
  // Validación de confirmación
  if (confirmacion !== 'eliminar_todos_reportes') {
    return res.status(400).json({ error: 'Confirmación inválida' });
  }
  
  const db = getDb();
  
  // Contar reportes antes de eliminar
  db.get('SELECT COUNT(*) as total FROM reportes', [], (err, result) => {
    if (err) {
      console.error('Error contando reportes:', err);
      return res.status(500).json({ error: 'Error al contar reportes' });
    }
    
    const totalAntes = result.total;
    
    // Eliminar todas las asignaciones relacionadas (cascade)
    db.run('DELETE FROM asignaciones WHERE reporte_id IN (SELECT id FROM reportes)', (err) => {
      if (err) {
        console.error('Error eliminando asignaciones:', err);
        return res.status(500).json({ error: 'Error al eliminar asignaciones' });
      }
      
      // Eliminar todos los cierres pendientes
      db.run('DELETE FROM cierres_pendientes WHERE reporte_id IN (SELECT id FROM reportes)', (err) => {
        if (err) {
          console.error('Error eliminando cierres pendientes:', err);
          return res.status(500).json({ error: 'Error al eliminar cierres pendientes' });
        }
        
        // Eliminar todas las notas de trabajo
        db.run('DELETE FROM notas_trabajo WHERE reporte_id IN (SELECT id FROM reportes)', (err) => {
          if (err) {
            console.error('Error eliminando notas de trabajo:', err);
            return res.status(500).json({ error: 'Error al eliminar notas de trabajo' });
          }
          
          // Eliminar todos los reportes
          db.run('DELETE FROM reportes', function (err) {
            if (err) {
              console.error('Error eliminando reportes:', err);
              return res.status(500).json({ error: 'Error al eliminar reportes' });
            }
            
            // Registrar en historial
            db.run(
              `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, razon)
               VALUES (?, 'database', 0, 'reportes_eliminados_totales', ?)`,
              [req.usuario.id, `Eliminación de ${totalAntes} reportes desde panel admin`]
            );
            
            res.json({ 
              mensaje: `✅ Se eliminaron ${totalAntes} reportes correctamente`,
              reportesEliminados: totalAntes
            });
          });
        });
      });
    });
  });
}

/**
 * Reiniciar base de datos (elimina todo excepto usuarios admin)
 * POST /api/admin/database/reset
 * Body: { confirmacion: "reiniciar_base_datos" }
 */
export function reiniciarBaseData(req, res) {
  const { confirmacion } = req.body;
  
  // Validación de confirmación
  if (confirmacion !== 'reiniciar_base_datos') {
    return res.status(400).json({ error: 'Confirmación inválida' });
  }
  
  const db = getDb();
  
  // Obtener datos para registrar en historial
  db.get('SELECT COUNT(*) as total_reportes FROM reportes', [], (err1, countReportes) => {
    db.get('SELECT COUNT(*) as total_usuarios FROM usuarios WHERE rol != "admin"', [], (err2, countUsuarios) => {
      db.get('SELECT COUNT(*) as total_sesiones FROM sesiones', [], (err3, countSesiones) => {
        
        if (err1 || err2 || err3) {
          console.error('Error contando registros:', err1 || err2 || err3);
          return res.status(500).json({ error: 'Error al contar registros' });
        }
        
        const totalReportes = countReportes.total_reportes;
        const totalUsuarios = countUsuarios.total_usuarios;
        const totalSesiones = countSesiones.total_sesiones;
        
        // 1. Eliminar todas las asignaciones
        db.run('DELETE FROM asignaciones', (err) => {
          if (err) {
            console.error('Error eliminando asignaciones:', err);
            return res.status(500).json({ error: 'Error al eliminar asignaciones' });
          }
          
          // 2. Eliminar cierres pendientes
          db.run('DELETE FROM cierres_pendientes', (err) => {
            if (err) {
              console.error('Error eliminando cierres pendientes:', err);
              return res.status(500).json({ error: 'Error al eliminar cierres pendientes' });
            }
            
            // 3. Eliminar notas de trabajo
            db.run('DELETE FROM notas_trabajo', (err) => {
              if (err) {
                console.error('Error eliminando notas de trabajo:', err);
                return res.status(500).json({ error: 'Error al eliminar notas de trabajo' });
              }
              
              // 4. Eliminar reportes
              db.run('DELETE FROM reportes', (err) => {
                if (err) {
                  console.error('Error eliminando reportes:', err);
                  return res.status(500).json({ error: 'Error al eliminar reportes' });
                }
                
                // 5. Eliminar sesiones
                db.run('DELETE FROM sesiones', (err) => {
                  if (err) {
                    console.error('Error eliminando sesiones:', err);
                    return res.status(500).json({ error: 'Error al eliminar sesiones' });
                  }
                  
                  // 6. Eliminar usuarios NO admin
                  db.run('DELETE FROM usuarios WHERE rol != "admin"', (err) => {
                    if (err) {
                      console.error('Error eliminando usuarios:', err);
                      return res.status(500).json({ error: 'Error al eliminar usuarios' });
                    }
                    
                    // 7. Limpiar historial (excepto este mismo registro)
                    db.run('DELETE FROM historial_cambios', (err) => {
                      if (err) {
                        console.error('Error limpiando historial:', err);
                        return res.status(500).json({ error: 'Error al limpiar historial' });
                      }
                      
                      // Registrar en historial (insert después del delete)
                      const razon = `Reinicio total de BD: ${totalReportes} reportes, ${totalUsuarios} usuarios, ${totalSesiones} sesiones eliminadas. Usuarios admin preservados.`;
                      db.run(
                        `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, razon)
                         VALUES (?, 'database', 0, 'reset_completo', ?)`,
                        [req.usuario.id, razon]
                      );
                      
                      res.json({
                        mensaje: '✅ Base de datos reiniciada correctamente',
                        estadisticas: {
                          reportesEliminados: totalReportes,
                          usuariosEliminados: totalUsuarios,
                          sesionesEliminadas: totalSesiones,
                          usuariosPreservados: 'Admin'
                        }
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}
