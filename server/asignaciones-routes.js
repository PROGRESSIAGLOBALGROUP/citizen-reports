/**
 * Rutas para gestión de asignaciones de reportes a funcionarios
 * Sistema de asignación many-to-many entre reportes y usuarios
 * ADR-0010: Audit trail completo en todas las operaciones
 */

import { getDb } from './db.js';
import { registrarCambio } from './reasignacion-utils.js';

/**
 * GET /api/reportes/:id
 * Obtiene detalles completos de un reporte específico
 */
export function obtenerReporteDetalle(req, res) {
  const { id } = req.params;
  const db = getDb();

  const sql = `
    SELECT 
      id, tipo, descripcion, descripcion_corta, lat, lng, peso, estado, 
      dependencia, prioridad, fingerprint, creado_en
    FROM reportes
    WHERE id = ?
  `;

  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Error al obtener reporte:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    res.json(row);
  });
}

/**
 * GET /api/reportes/:id/asignaciones
 * Lista todos los funcionarios asignados a un reporte
 */
export function listarAsignaciones(req, res) {
  const { id } = req.params;
  const db = getDb();

  // Primero verificar que el reporte existe
  db.get('SELECT id FROM reportes WHERE id = ?', [id], (err, reporte) => {
    if (err) {
      console.error('Error al verificar reporte:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    if (!reporte) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    // Obtener asignaciones con nombres de usuarios
    const sql = `
      SELECT 
        a.id,
        a.reporte_id,
        a.usuario_id,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        u.dependencia as usuario_dependencia,
        a.asignado_por,
        asignador.nombre as asignado_por_nombre,
        a.notas,
        a.creado_en
      FROM asignaciones a
      JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN usuarios asignador ON a.asignado_por = asignador.id
      WHERE a.reporte_id = ?
      ORDER BY a.creado_en ASC
    `;

    db.all(sql, [id], (err, rows) => {
      if (err) {
        console.error('Error al listar asignaciones:', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }
      res.json(rows || []);
    });
  });
}

/**
 * POST /api/reportes/:id/asignaciones
 * Asigna un funcionario a un reporte
 */
export function crearAsignacion(req, res) {
  const { id } = req.params;
  const { usuario_id, asignado_por, notas = null } = req.body;
  const db = getDb();

  // Validaciones
  if (!usuario_id) {
    return res.status(400).json({ error: 'El campo usuario_id es requerido' });
  }

  // Verificar que el reporte existe
  db.get('SELECT id FROM reportes WHERE id = ?', [id], (err, reporte) => {
    if (err) {
      console.error('Error al verificar reporte:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    if (!reporte) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    // Verificar que el usuario existe
    db.get('SELECT id FROM usuarios WHERE id = ?', [usuario_id], (err, usuario) => {
      if (err) {
        console.error('Error al verificar usuario:', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar que asignado_por existe (si se proporciona)
      if (asignado_por) {
        db.get('SELECT id FROM usuarios WHERE id = ?', [asignado_por], (err, asignador) => {
          if (err) {
            console.error('Error al verificar asignador:', err);
            return res.status(500).json({ error: 'Error de base de datos' });
          }
          if (!asignador) {
            return res.status(400).json({ error: 'El usuario asignador no existe' });
          }

          // Proceder con la inserción
          insertarAsignacion();
        });
      } else {
        insertarAsignacion();
      }

      async function insertarAsignacion() {
        const sql = `
          INSERT INTO asignaciones (reporte_id, usuario_id, asignado_por, notas)
          VALUES (?, ?, ?, ?)
        `;

        db.run(sql, [id, usuario_id, asignado_por || null, notas], async function(err) {
          if (err) {
            // Error de constraint UNIQUE(reporte_id, usuario_id)
            if (err.message.includes('UNIQUE constraint')) {
              return res.status(409).json({ error: 'El usuario ya está asignado a este reporte' });
            }
            console.error('Error al crear asignación:', err);
            return res.status(500).json({ error: 'Error de base de datos' });
          }

          const asignacionId = this.lastID;

          // ADR-0010: Obtener información completa para audit trail
          db.get(
            `SELECT u.id, u.nombre, u.email, u.dependencia 
             FROM usuarios u WHERE u.id = ?`,
            [usuario_id],
            async (err, funcionario) => {
              if (err) {
                console.error('Error obteniendo funcionario para audit trail:', err);
                // Continuar aunque falle el audit trail (no bloquear operación)
                return finalizarRespuesta(asignacionId);
              }

              // Obtener asignador si existe
              let asignadorInfo = null;
              if (asignado_por) {
                asignadorInfo = await new Promise((resolve) => {
                  db.get(
                    'SELECT nombre, email FROM usuarios WHERE id = ?',
                    [asignado_por],
                    (err, row) => resolve(err ? null : row)
                  );
                });
              }

              // Registrar en audit trail (ADR-0010)
              try {
                await registrarCambio(db, {
                  reporte_id: id,
                  usuario_id: asignado_por || usuario_id,
                  tipo_cambio: 'asignacion',
                  campo_modificado: 'funcionario_asignado',
                  valor_anterior: null,
                  valor_nuevo: `${funcionario.nombre} (${funcionario.email})`,
                  razon: notas || 'Asignación de reporte',
                  metadatos: {
                    ip: req.ip || req.connection?.remoteAddress || 'unknown',
                    user_agent: req.headers['user-agent'] || 'unknown',
                    dependencia: funcionario.dependencia,
                    asignado_por_nombre: asignadorInfo ? asignadorInfo.nombre : null
                  }
                });
                console.log(`✅ Audit trail: Asignación registrada (reporte ${id}, funcionario ${funcionario.nombre})`);
              } catch (auditErr) {
                console.error('❌ Error registrando en audit trail:', auditErr);
                // No bloquear la operación por fallo en audit trail
              }

              finalizarRespuesta(asignacionId);
            }
          );

          function finalizarRespuesta(asignacionId) {
            // Retornar la asignación creada
            db.get('SELECT * FROM asignaciones WHERE id = ?', [asignacionId], (err, row) => {
              if (err) {
                console.error('Error al obtener asignación creada:', err);
                return res.status(500).json({ error: 'Error de base de datos' });
              }
              res.status(201).json(row);
            });
          }
        });
      }
    });
  });
}

/**
 * DELETE /api/reportes/:id/asignaciones/:usuarioId
 * Elimina la asignación de un funcionario de un reporte
 * Si era la última asignación, el estado del reporte regresa a 'abierto'
 */
export function eliminarAsignacion(req, res) {
  const { id, usuarioId } = req.params;
  const db = getDb();

  // PASO 1: Obtener detalles del funcionario ANTES de eliminar (para audit trail)
  const sqlGetFuncionario = `
    SELECT u.id, u.nombre, u.email, u.dependencia
    FROM usuarios u
    JOIN asignaciones a ON u.id = a.usuario_id
    WHERE a.reporte_id = ? AND a.usuario_id = ?
  `;

  db.get(sqlGetFuncionario, [id, usuarioId], async (errGet, funcionario) => {
    if (errGet) {
      console.error('Error al obtener funcionario para audit trail:', errGet);
      return res.status(500).json({ error: 'Error de base de datos' });
    }

    if (!funcionario) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    // PASO 2: Eliminar la asignación
    const sql = `
      DELETE FROM asignaciones
      WHERE reporte_id = ? AND usuario_id = ?
    `;

    db.run(sql, [id, usuarioId], async function(err) {
      if (err) {
        console.error('Error al eliminar asignación:', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Asignación no encontrada' });
      }

      // PASO 3: Registrar en audit trail (ADR-0010)
      try {
        await registrarCambio(db, {
          reporte_id: id,
          usuario_id: req.usuario?.id || usuarioId, // Quien hace la desasignación
          tipo_cambio: 'desasignacion',
          campo_modificado: 'funcionario_asignado',
          valor_anterior: `${funcionario.nombre} (${funcionario.email})`,
          valor_nuevo: null,
          razon: 'Desasignación de funcionario',
          metadatos: {
            ip: req.ip || req.connection?.remoteAddress || 'unknown',
            user_agent: req.headers['user-agent'] || 'unknown',
            dependencia: funcionario.dependencia
          }
        });
        console.log(`✅ Audit trail: Desasignación registrada (reporte ${id}, funcionario ${funcionario.nombre})`);
      } catch (auditErr) {
        console.error('❌ Error registrando desasignación en audit trail:', auditErr);
        // No bloquear operación si falla audit trail
      }

      // PASO 4: Verificar si quedan asignaciones para este reporte
      const sqlCount = `SELECT COUNT(*) as total FROM asignaciones WHERE reporte_id = ?`;
      
      db.get(sqlCount, [id], (errCount, row) => {
        if (errCount) {
          console.error('Error al contar asignaciones:', errCount);
          // Aún así devolver éxito porque la eliminación se completó
          return res.json({ mensaje: 'Asignación eliminada correctamente', changes: this.changes });
        }

        // Si no quedan asignaciones, regresar el estado a 'abierto'
        if (row.total === 0) {
          const sqlUpdate = `
            UPDATE reportes 
            SET estado = 'abierto' 
            WHERE id = ? AND estado = 'asignado'
          `;
          
          db.run(sqlUpdate, [id], (errUpdate) => {
            if (errUpdate) {
              console.error('Error al actualizar estado del reporte:', errUpdate);
            }
            res.json({ 
              mensaje: 'Asignación eliminada correctamente', 
              changes: this.changes,
              estado_actualizado: !errUpdate 
            });
          });
        } else {
          // Aún hay asignaciones, mantener estado 'asignado'
          res.json({ mensaje: 'Asignación eliminada correctamente', changes: this.changes });
        }
      });
    });
  });
}

/**
 * PUT /api/reportes/:id/notas
 * Actualiza las notas de trabajo de un funcionario asignado
 * Solo el funcionario asignado puede editar sus notas
 */
export function actualizarNotas(req, res) {
  const { id } = req.params;
  const { usuario_id, notas } = req.body;
  const db = getDb();

  // Validaciones
  if (!usuario_id) {
    return res.status(400).json({ error: 'El campo usuario_id es requerido' });
  }

  if (!notas || typeof notas !== 'string' || notas.trim().length === 0) {
    return res.status(400).json({ error: 'El campo notas es requerido y no puede estar vacío' });
  }

  // Verificar que el usuario está asignado al reporte
  const sqlVerificar = `
    SELECT id FROM asignaciones
    WHERE reporte_id = ? AND usuario_id = ?
  `;

  db.get(sqlVerificar, [id, usuario_id], (err, asignacion) => {
    if (err) {
      console.error('Error al verificar asignación:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }

    if (!asignacion) {
      return res.status(403).json({ error: 'No estás asignado a este reporte' });
    }

    // Actualizar notas
    const sqlActualizar = `
      UPDATE asignaciones
      SET notas = ?
      WHERE reporte_id = ? AND usuario_id = ?
    `;

    db.run(sqlActualizar, [notas.trim(), id, usuario_id], function(err) {
      if (err) {
        console.error('Error al actualizar notas:', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }

      // Retornar notas actualizadas
      db.get(
        'SELECT * FROM asignaciones WHERE reporte_id = ? AND usuario_id = ?',
        [id, usuario_id],
        (err, row) => {
          if (err) {
            console.error('Error al obtener notas actualizadas:', err);
            return res.status(500).json({ error: 'Error de base de datos' });
          }
          res.json(row);
        }
      );
    });
  });
}

/**
 * GET /api/reportes/:id/notas-draft
 * Obtiene el borrador de notas de un funcionario para un reporte
 */
export function obtenerNotasDraft(req, res) {
  const { id } = req.params;
  const { usuario_id } = req.query;
  const db = getDb();

  if (!usuario_id) {
    return res.status(400).json({ error: 'El parámetro usuario_id es requerido' });
  }

  const sql = `
    SELECT id, reporte_id, usuario_id, notas, es_borrador, creado_en, actualizado_en
    FROM notas_funcionario
    WHERE reporte_id = ? AND usuario_id = ?
  `;

  db.get(sql, [id, usuario_id], (err, row) => {
    if (err) {
      console.error('Error al obtener notas draft:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    res.json(row || null);
  });
}

/**
 * POST /api/reportes/:id/notas-draft
 * Guarda o actualiza el borrador de notas de un funcionario
 */
export function guardarNotasDraft(req, res) {
  const { id } = req.params;
  const { usuario_id, notas } = req.body;
  const db = getDb();

  // Validaciones
  if (!usuario_id) {
    return res.status(400).json({ error: 'El campo usuario_id es requerido' });
  }

  if (!notas || typeof notas !== 'string' || notas.trim().length === 0) {
    return res.status(400).json({ error: 'El campo notas es requerido y no puede estar vacío' });
  }

  // Verificar que el usuario está asignado al reporte
  db.get(
    'SELECT id FROM asignaciones WHERE reporte_id = ? AND usuario_id = ?',
    [id, usuario_id],
    (err, asignacion) => {
      if (err) {
        console.error('Error al verificar asignación:', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }

      if (!asignacion) {
        return res.status(403).json({ error: 'No estás asignado a este reporte' });
      }

      // Insertar o actualizar notas (UPSERT)
      const sql = `
        INSERT INTO notas_funcionario (reporte_id, usuario_id, notas, es_borrador, actualizado_en)
        VALUES (?, ?, ?, 1, datetime('now'))
        ON CONFLICT(reporte_id, usuario_id)
        DO UPDATE SET 
          notas = excluded.notas,
          actualizado_en = datetime('now')
      `;

      db.run(sql, [id, usuario_id, notas.trim()], function(err) {
        if (err) {
          console.error('Error al guardar notas draft:', err);
          return res.status(500).json({ error: 'Error de base de datos' });
        }

        // Retornar notas guardadas
        db.get(
          'SELECT * FROM notas_funcionario WHERE reporte_id = ? AND usuario_id = ?',
          [id, usuario_id],
          (err, row) => {
            if (err) {
              console.error('Error al obtener notas guardadas:', err);
              return res.status(500).json({ error: 'Error de base de datos' });
            }
            res.json({ success: true, notas: row, mensaje: 'Borrador guardado exitosamente' });
          }
        );
      });
    }
  );
}

/**
 * POST /api/reportes/:id/reasignar
 * Reasigna un reporte a funcionario de otro departamento
 * Actualiza tipo de reporte automáticamente si es necesario
 * Registra todos los cambios en audit trail
 */
export function reasignarReporte(req, res) {
  const { id } = req.params;
  const { 
    funcionario_id,      // Nuevo funcionario
    razon,               // Motivo de la reasignación
    nuevo_tipo,          // Tipo sugerido (opcional)
    mantener_tipo        // Flag para NO cambiar el tipo
  } = req.body;
  const usuario_actual = req.usuario;
  const db = getDb();

  // Importar utilidades
  import('./reasignacion-utils.js').then(({ 
    DEPENDENCIA_POR_TIPO, 
    TIPOS_POR_DEPENDENCIA,
    registrarCambio,
    sugerirTipoParaDependencia
  }) => {
    // Validaciones
    if (!funcionario_id || !razon || razon.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Se requiere funcionario_id y razón (mínimo 10 caracteres)' 
      });
    }

    // Obtener reporte actual
    db.get('SELECT * FROM reportes WHERE id = ?', [id], (err, reporte) => {
      if (err) {
        console.error('Error obteniendo reporte:', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }
      if (!reporte) {
        return res.status(404).json({ error: 'Reporte no encontrado' });
      }

      // Obtener funcionario destino
      db.get(
        'SELECT * FROM usuarios WHERE id = ? AND rol = ? AND activo = 1',
        [funcionario_id, 'funcionario'],
        (err, funcionario) => {
          if (err) {
            console.error('Error obteniendo funcionario:', err);
            return res.status(500).json({ error: 'Error de base de datos' });
          }
          if (!funcionario) {
            return res.status(404).json({ error: 'Funcionario no encontrado o inactivo' });
          }

          // Detectar cambio de departamento
          const dependenciaActual = DEPENDENCIA_POR_TIPO[reporte.tipo];
          const dependenciaNueva = funcionario.dependencia;
          const esCambioDependencia = dependenciaActual !== dependenciaNueva;

          let tipoFinal = reporte.tipo;
          let cambioTipo = false;

          // Si cambia de departamento y no se fuerza mantener tipo
          if (esCambioDependencia && !mantener_tipo) {
            if (nuevo_tipo && TIPOS_POR_DEPENDENCIA[dependenciaNueva]?.includes(nuevo_tipo)) {
              tipoFinal = nuevo_tipo;
            } else {
              tipoFinal = sugerirTipoParaDependencia(reporte.tipo, dependenciaNueva);
            }
            cambioTipo = (tipoFinal !== reporte.tipo);
          }

              // Obtener asignaciones actuales CON NOMBRES
              db.all(
                `SELECT u.id, u.nombre, u.email, u.dependencia 
                 FROM asignaciones a 
                 JOIN usuarios u ON a.usuario_id = u.id 
                 WHERE a.reporte_id = ?`, 
                [id], 
                (err, asignacionesActuales) => {
                  if (err) {
                    console.error('Error obteniendo asignaciones:', err);
                    return res.status(500).json({ error: 'Error de base de datos' });
                  }

                  // Iniciar transacción
                  db.serialize(() => {
                    db.run('BEGIN TRANSACTION', (err) => {
                      if (err) {
                        console.error('Error iniciando transacción:', err);
                        return res.status(500).json({ error: 'Error de base de datos' });
                      }

                      const funcionariosAnteriores = asignacionesActuales.map(a => a.id);
                      let erroresTransaccion = [];

                      // Paso 1: Eliminar asignaciones anteriores y registrar
                      if (funcionariosAnteriores.length > 0) {
                        db.run('DELETE FROM asignaciones WHERE reporte_id = ?', [id], async (err) => {
                          if (err) {
                            erroresTransaccion.push(err);
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Error eliminando asignaciones' });
                          }

                          // Registrar cada desasignación con nombre legible
                          for (const antiguoFunc of asignacionesActuales) {
                            try {
                              await registrarCambio(db, {
                                reporte_id: id,
                                usuario_id: usuario_actual.id,
                                tipo_cambio: 'desasignacion',
                                campo_modificado: 'funcionario_asignado',
                                valor_anterior: `${antiguoFunc.nombre} (${antiguoFunc.email})`,
                                valor_nuevo: null,
                                razon: `Desasignación por reasignación interdepartamental: ${razon}`,
                                metadatos: {
                                  ip: req.ip,
                                  user_agent: req.get('user-agent'),
                                  funcionario_id_anterior: antiguoFunc.id,
                                  dependencia_anterior: antiguoFunc.dependencia,
                                  motivo: 'reasignacion_interdepartamental'
                                }
                              });
                            } catch (err) {
                              console.error('Error registrando desasignación:', err);
                            }
                          }

                          continuarReasignacion();
                        });
                      } else {
                        continuarReasignacion();
                      }                  async function continuarReasignacion() {
                    // Paso 2: Crear nueva asignación
                    db.run(
                      'INSERT INTO asignaciones (reporte_id, usuario_id, asignado_por, notas) VALUES (?, ?, ?, ?)',
                      [id, funcionario_id, usuario_actual.id, `Reasignado: ${razon}`],
                      async function(err) {
                        if (err) {
                          console.error('Error creando asignación:', err);
                          db.run('ROLLBACK');
                          return res.status(500).json({ error: 'Error creando asignación' });
                        }

                        // Registrar nueva asignación con nombre legible
                        try {
                          await registrarCambio(db, {
                            reporte_id: id,
                            usuario_id: usuario_actual.id,
                            tipo_cambio: 'asignacion',
                            campo_modificado: 'funcionario_asignado',
                            valor_anterior: asignacionesActuales.length > 0 
                              ? asignacionesActuales.map(f => f.nombre).join(', ')
                              : 'Sin asignar',
                            valor_nuevo: `${funcionario.nombre} (${funcionario.email})`,
                            razon: razon,
                            metadatos: {
                              ip: req.ip,
                              user_agent: req.get('user-agent'),
                              funcionario_id_nuevo: funcionario_id,
                              funcionario_nombre: funcionario.nombre,
                              funcionario_email: funcionario.email,
                              dependencia_nueva: funcionario.dependencia,
                              dependencia_anterior: dependenciaActual,
                              es_reasignacion_interdepartamental: esCambioDependencia
                            }
                          });
                        } catch (err) {
                          console.error('Error registrando asignación:', err);
                        }

                        // Paso 3: Actualizar tipo si cambió departamento
                        if (cambioTipo) {
                          db.run('UPDATE reportes SET tipo = ? WHERE id = ?', [tipoFinal, id], async (err) => {
                            if (err) {
                              console.error('Error actualizando tipo:', err);
                              db.run('ROLLBACK');
                              return res.status(500).json({ error: 'Error actualizando tipo' });
                            }

                            // Registrar cambio de tipo
                            try {
                              await registrarCambio(db, {
                                reporte_id: id,
                                usuario_id: usuario_actual.id,
                                tipo_cambio: 'cambio_tipo',
                                campo_modificado: 'tipo',
                                valor_anterior: reporte.tipo,
                                valor_nuevo: tipoFinal,
                                razon: `Cambio automático por reasignación a ${dependenciaNueva}`,
                                metadatos: {
                                  dependencia_anterior: dependenciaActual,
                                  dependencia_nueva: dependenciaNueva,
                                  razon_original: razon,
                                  automatico: true
                                }
                              });
                            } catch (err) {
                              console.error('Error registrando cambio de tipo:', err);
                            }

                            finalizarTransaccion();
                          });
                        } else {
                          finalizarTransaccion();
                        }

                        function finalizarTransaccion() {
                          // Paso 4: Actualizar estado si estaba abierto
                          db.run(
                            'UPDATE reportes SET estado = ? WHERE id = ? AND estado = ?',
                            ['asignado', id, 'abierto'],
                            async (err) => {
                              if (err) {
                                console.error('Error actualizando estado:', err);
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: 'Error actualizando estado' });
                              }

                              // Registrar cambio de estado si ocurrió
                              if (reporte.estado === 'abierto') {
                                try {
                                  await registrarCambio(db, {
                                    reporte_id: id,
                                    usuario_id: usuario_actual.id,
                                    tipo_cambio: 'cambio_estado',
                                    campo_modificado: 'estado',
                                    valor_anterior: 'abierto',
                                    valor_nuevo: 'asignado',
                                    razon: 'Cambio automático por asignación',
                                    metadatos: { automatico: true }
                                  });
                                } catch (err) {
                                  console.error('Error registrando cambio de estado:', err);
                                }
                              }

                              // Commit transacción
                              db.run('COMMIT', (err) => {
                                if (err) {
                                  console.error('Error en commit:', err);
                                  db.run('ROLLBACK');
                                  return res.status(500).json({ error: 'Error confirmando cambios' });
                                }

                                // Respuesta exitosa
                                res.json({
                                  mensaje: 'Reporte reasignado exitosamente',
                                  cambios: {
                                    tipo_actualizado: cambioTipo,
                                    tipo_anterior: reporte.tipo,
                                    tipo_nuevo: tipoFinal,
                                    dependencia_anterior: dependenciaActual,
                                    dependencia_nueva: dependenciaNueva,
                                    funcionarios_anteriores: funcionariosAnteriores,
                                    funcionario_nuevo: funcionario_id,
                                    funcionario_nombre: funcionario.nombre,
                                    estado_actualizado: reporte.estado === 'abierto'
                                  }
                                });
                              });
                            }
                          );
                        }
                      }
                    );
                  }
                });
              });
            }
          );
        }
      );
    });
  }).catch(err => {
    console.error('Error importando utilidades:', err);
    res.status(500).json({ error: 'Error del servidor' });
  });
}

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
      u.rol as usuario_rol,
      u.dependencia as usuario_dependencia
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
