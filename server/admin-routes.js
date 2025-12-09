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
 * - GET    /api/admin/database/backup?encrypted=true (cifrado)
 * - DELETE /api/admin/database/reports
 * - POST   /api/admin/database/reset
 * - GET    /api/admin/dashboard (US-A06: métricas del dashboard)
 */

import { getDb, resolveDbPath } from './db.js';
import fs from 'fs';
import { dirname, resolve } from 'path';
import { encryptFile } from './security.js';

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
 * Query params:
 *   - encrypted=true: Cifrar backup con AES-256-GCM
 */
export function descargarBackupDatabase(req, res) {
  const dbPath = resolveDbPath();
  const timestamp = new Date().toISOString().split('T')[0];
  const isEncrypted = req.query.encrypted === 'true';
  const extension = isEncrypted ? '.db.enc' : '.db';
  const filename = `citizen-reports-backup-${timestamp}${extension}`;
  // Use a temp file in the same directory to ensure we can write to it
  const tempPath = resolve(dirname(dbPath), `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.tmp`);
  
  const db = getDb();
  
  // Use SQLite Online Backup API for safe, consistent, non-blocking backup
  const backup = db.backup(tempPath);
  
  // Copy all pages (-1)
  backup.step(-1, (err) => {
    if (err) {
      console.error('❌ Backup step failed:', err);
      backup.finish(); // Close backup handle
      // Try to clean up temp file if created
      try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch(e) {}
      
      return res.status(500).json({ error: 'Error generando respaldo de base de datos' });
    }
    
    backup.finish(); // Close backup handle
    
    try {
      // Verify file exists and has size
      if (!fs.existsSync(tempPath)) {
        throw new Error('Backup file was not created');
      }
      
      // Read the backup file
      const backupData = fs.readFileSync(tempPath);
      let outputData = backupData;
      let outputSize = backupData.length;
      
      // Encrypt if requested
      if (isEncrypted) {
        console.log('🔐 Cifrando backup con AES-256-GCM...');
        const { encrypted, iv, authTag } = encryptFile(backupData);
        outputData = encrypted;
        outputSize = encrypted.length;
        console.log(`✅ Backup cifrado: ${backupData.length} → ${encrypted.length} bytes`);
      }
      
      // Log audit
      if (req.usuario && req.usuario.id) {
        const tipoBackup = isEncrypted ? 'backup_cifrado_descargado' : 'backup_descargado';
        db.run(
          `INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, razon)
           VALUES (?, 'database', 0, ?, ?)`,
          [req.usuario.id, tipoBackup, `Descarga de respaldo ${isEncrypted ? 'cifrado' : 'plano'} desde panel admin`],
          (err) => { if (err) console.error('Audit log error:', err); }
        );
      }
      
      // Clean up temp file
      try { fs.unlinkSync(tempPath); } catch(e) {}
      
      // Send response
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', outputSize);
      if (isEncrypted) {
        res.setHeader('X-Encryption', 'AES-256-GCM');
        res.setHeader('X-Encryption-Note', 'Decryption requires ENCRYPTION_KEY environment variable');
      }
      
      res.end(outputData);
      
    } catch (error) {
      console.error('❌ Error finalizing backup:', error);
      try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch(e) {}
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error finalizando respaldo: ' + error.message });
      }
    }
  });
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

/**
 * GET /api/admin/dashboard
 * Obtener métricas del dashboard para administradores
 */
export function obtenerDashboardMetricas(req, res) {
  const db = getDb();
  
  // Query complejo para obtener todas las métricas en una sola llamada
  const queries = {
    // Estadísticas generales
    general: `
      SELECT 
        (SELECT COUNT(*) FROM reportes) as total_reportes,
        (SELECT COUNT(*) FROM usuarios WHERE activo = 1) as usuarios_activos,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'funcionario') as total_funcionarios,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'supervisor') as total_supervisores,
        (SELECT COUNT(DISTINCT dependencia) FROM reportes WHERE dependencia IS NOT NULL) as dependencias_activas
    `,
    
    // Reportes por estado
    porEstado: `
      SELECT estado, COUNT(*) as cantidad 
      FROM reportes 
      GROUP BY estado
    `,
    
    // Reportes por tipo (top 10)
    porTipo: `
      SELECT tipo, COUNT(*) as cantidad 
      FROM reportes 
      GROUP BY tipo 
      ORDER BY cantidad DESC 
      LIMIT 10
    `,
    
    // Reportes por dependencia
    porDependencia: `
      SELECT dependencia, COUNT(*) as cantidad 
      FROM reportes 
      WHERE dependencia IS NOT NULL
      GROUP BY dependencia 
      ORDER BY cantidad DESC
    `,
    
    // Tendencia semanal (últimos 7 días)
    tendenciaSemanal: `
      SELECT 
        date(creado_en) as fecha,
        COUNT(*) as cantidad
      FROM reportes 
      WHERE creado_en >= date('now', '-7 days')
      GROUP BY date(creado_en)
      ORDER BY fecha ASC
    `,
    
    // Tendencia mensual (últimos 30 días)
    tendenciaMensual: `
      SELECT 
        date(creado_en) as fecha,
        COUNT(*) as cantidad
      FROM reportes 
      WHERE creado_en >= date('now', '-30 days')
      GROUP BY date(creado_en)
      ORDER BY fecha ASC
    `,
    
    // Tiempo promedio de resolución (reportes cerrados) - usando historial_cambios
    tiempoResolucion: `
      SELECT 
        AVG(CASE WHEN h.creado_en IS NOT NULL THEN julianday(h.creado_en) - julianday(r.creado_en) ELSE NULL END) as dias_promedio,
        MIN(CASE WHEN h.creado_en IS NOT NULL THEN julianday(h.creado_en) - julianday(r.creado_en) ELSE NULL END) as dias_minimo,
        MAX(CASE WHEN h.creado_en IS NOT NULL THEN julianday(h.creado_en) - julianday(r.creado_en) ELSE NULL END) as dias_maximo
      FROM reportes r
      LEFT JOIN historial_cambios h ON r.id = h.entidad_id AND h.entidad = 'reporte' AND h.tipo_cambio = 'cierre_aprobado'
      WHERE r.estado = 'cerrado'
    `,
    
    // Cierres pendientes de aprobación
    cierresPendientes: `
      SELECT COUNT(*) as cantidad 
      FROM cierres_pendientes 
      WHERE aprobado = 0
    `,
    
    // Reportes recientes (últimas 24h)
    recientes24h: `
      SELECT COUNT(*) as cantidad 
      FROM reportes 
      WHERE creado_en >= datetime('now', '-24 hours')
    `,
    
    // Personal por rol
    personal: `
      SELECT 
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'funcionario' AND activo = 1) as funcionarios,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'supervisor' AND activo = 1) as supervisores,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'admin' AND activo = 1) as admins
    `,
    
    // Reportes por prioridad
    porPrioridad: `
      SELECT 
        CASE 
          WHEN tipo IN ('fuga_agua', 'colapso_drenaje', 'incendio', 'accidente_vehicular', 'riña', 'robo', 'emergencia_medica') THEN 'critica'
          WHEN tipo IN ('bache', 'alumbrado', 'semaforo', 'inundacion') THEN 'alta'
          ELSE 'normal'
        END as prioridad,
        COUNT(*) as cantidad
      FROM reportes
      GROUP BY prioridad
    `
  };
  
  const results = {};
  let completedQueries = 0;
  const totalQueries = Object.keys(queries).length;
  
  const checkComplete = () => {
    completedQueries++;
    if (completedQueries === totalQueries) {
      res.json({
        timestamp: new Date().toISOString(),
        ...results
      });
    }
  };
  
  // Ejecutar todas las queries
  Object.entries(queries).forEach(([key, sql]) => {
    if (key === 'general' || key === 'tiempoResolucion' || key === 'cierresPendientes' || key === 'recientes24h' || key === 'personal') {
      db.get(sql, (err, row) => {
        if (err) {
          console.error(`Error en query ${key}:`, err);
          results[key] = null;
        } else {
          results[key] = row;
        }
        checkComplete();
      });
    } else {
      db.all(sql, (err, rows) => {
        if (err) {
          console.error(`Error en query ${key}:`, err);
          results[key] = [];
        } else {
          results[key] = rows || [];
        }
        checkComplete();
      });
    }
  });
}

/**
 * Obtener estadísticas de la base de datos
 * GET /api/admin/database/stats
 */
export function obtenerStatsDatabase(req, res) {
  const db = getDb();
  const dbPath = resolveDbPath();
  
  const queries = {
    reportes: 'SELECT COUNT(*) as total FROM reportes',
    usuarios: 'SELECT COUNT(*) as total FROM usuarios',
    sesiones: 'SELECT COUNT(*) as total FROM sesiones',
    historial: 'SELECT COUNT(*) as total FROM historial_cambios',
    categorias: 'SELECT COUNT(*) as total FROM categorias',
    dependencias: 'SELECT COUNT(*) as total FROM dependencias',
    asignaciones: 'SELECT COUNT(*) as total FROM asignaciones',
    cierres: 'SELECT COUNT(*) as total FROM cierres_pendientes',
    notas: 'SELECT COUNT(*) as total FROM notas_trabajo'
  };
  
  const stats = {};
  let completed = 0;
  const total = Object.keys(queries).length;
  
  const checkComplete = () => {
    completed++;
    if (completed === total) {
      // Obtener tamaño del archivo
      let fileSize = 0;
      try {
        const stat = fs.statSync(dbPath);
        fileSize = stat.size;
      } catch (e) {
        console.warn('No se pudo obtener tamaño de BD:', e.message);
      }
      
      res.json({
        timestamp: new Date().toISOString(),
        database: {
          path: dbPath,
          sizeBytes: fileSize,
          sizeHuman: formatBytes(fileSize)
        },
        tables: stats
      });
    }
  };
  
  Object.entries(queries).forEach(([key, sql]) => {
    db.get(sql, (err, row) => {
      stats[key] = err ? 0 : row.total;
      checkComplete();
    });
  });
}

/**
 * Obtener logs de errores recientes
 * GET /api/admin/database/logs
 * Query: limit (default 50)
 */
export function obtenerLogsRecientes(req, res) {
  const db = getDb();
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  
  // Obtener últimos cambios del historial (incluye errores y acciones)
  // Nota: ip y user_agent están dentro del campo metadatos (JSON)
  const sql = `
    SELECT 
      hc.id,
      hc.usuario_id,
      u.nombre as usuario_nombre,
      u.email as usuario_email,
      hc.entidad,
      hc.entidad_id,
      hc.tipo_cambio,
      hc.razon,
      hc.metadatos,
      hc.creado_en
    FROM historial_cambios hc
    LEFT JOIN usuarios u ON hc.usuario_id = u.id
    ORDER BY hc.creado_en DESC
    LIMIT ?
  `;
  
  db.all(sql, [limit], (err, rows) => {
    if (err) {
      console.error('Error obteniendo logs:', err);
      return res.status(500).json({ error: 'Error al obtener logs' });
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      total: rows.length,
      logs: rows.map(r => {
        // Parse metadatos if present (contains ip, user_agent, etc.)
        let meta = {};
        try {
          meta = r.metadatos ? JSON.parse(r.metadatos) : {};
        } catch (e) {
          // Ignore parse errors
        }
        return {
          ...r,
          ip: meta.ip || null,
          user_agent: meta.user_agent || null,
          creado_en: r.creado_en,
          tipo: clasificarTipoCambio(r.tipo_cambio)
        };
      })
    });
  });
}

/**
 * Clasificar tipo de cambio para UI
 */
function clasificarTipoCambio(tipo) {
  const errores = ['error', 'fallo', 'rechazado', 'denegado'];
  const advertencias = ['eliminacion', 'reset', 'backup'];
  const exitos = ['creacion', 'aprobacion', 'asignacion', 'cierre'];
  
  if (errores.some(e => tipo?.toLowerCase().includes(e))) return 'error';
  if (advertencias.some(a => tipo?.toLowerCase().includes(a))) return 'warning';
  if (exitos.some(s => tipo?.toLowerCase().includes(s))) return 'success';
  return 'info';
}

/**
 * Formatear bytes a unidad legible
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

