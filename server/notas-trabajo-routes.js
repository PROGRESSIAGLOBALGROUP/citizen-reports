/**
 * Rutas para gestión de notas de trabajo con trazabilidad completa
 * Sistema append-only (inmutable) para bitácora auditable
 * Cumple con ADR-0010: Audit trail completo
 * 
 * Mejores prácticas implementadas:
 * - NO sobreescribe notas anteriores (append-only)
 * - Registro automático en historial_cambios
 * - Timestamps inmutables
 * - Metadatos opcionales (ubicación, fotos, etc.)
 * - Tipos de nota para categorización
 * - 🔐 Cifrado E2E de contenido sensible (AES-256-GCM)
 */

import { getDb } from './db.js';
import { registrarCambio } from './reasignacion-utils.js';
import { decryptSensitiveFields, sanitizeInput, encrypt, decrypt } from './security.js';

/**
 * GET /api/reportes/:id/notas-trabajo
 * Obtiene todas las notas de trabajo de un reporte (bitácora completa)
 * 
 * Query params opcionales:
 * - usuario_id: filtrar por funcionario específico
 * - tipo: filtrar por tipo de nota (observacion, avance, incidente, resolucion)
 * 
 * Retorna notas ordenadas cronológicamente (más reciente primero)
 */
export function listarNotasTrabajo(req, res) {
  const { id } = req.params;
  const { usuario_id, tipo } = req.query;
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

    // Construir query con filtros opcionales
    let sql = `
      SELECT 
        nt.id,
        nt.reporte_id,
        nt.usuario_id,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        u.dependencia as usuario_dependencia,
        nt.contenido,
        nt.tipo,
        nt.metadatos,
        nt.creado_en
      FROM notas_trabajo nt
      JOIN usuarios u ON nt.usuario_id = u.id
      WHERE nt.reporte_id = ?
    `;
    
    const params = [id];
    
    if (usuario_id) {
      sql += ' AND nt.usuario_id = ?';
      params.push(usuario_id);
    }
    
    if (tipo) {
      sql += ' AND nt.tipo = ?';
      params.push(tipo);
    }
    
    sql += ' ORDER BY nt.creado_en DESC';

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error al listar notas de trabajo:', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }
      
      // Parsear metadatos JSON si existe y descifrar contenido
      const notas = (rows || []).map(nota => {
        // 🔐 Descifrar contenido de la nota (E2E)
        let contenidoDescifrado = nota.contenido;
        try {
          contenidoDescifrado = decrypt(nota.contenido);
        } catch {
          // Si falla el descifrado, el contenido no estaba cifrado (datos legacy)
        }
        return {
          ...nota,
          contenido: contenidoDescifrado,
          metadatos: nota.metadatos ? JSON.parse(nota.metadatos) : null
        };
      });
      
      res.json(notas);
    });
  });
}

/**
 * POST /api/reportes/:id/notas-trabajo
 * Crea una nueva entrada en la bitácora de trabajo
 * 
 * Body params:
 * - contenido: texto de la nota (requerido)
 * - tipo: 'observacion' | 'avance' | 'incidente' | 'resolucion' (opcional, default: 'observacion')
 * - metadatos: objeto JSON con info adicional (opcional)
 * 
 * Requiere autenticación y que el usuario esté asignado al reporte
 * Registra automáticamente en historial_cambios (ADR-0010)
 */
export function crearNotaTrabajo(req, res) {
  const { id } = req.params;
  const { contenido, tipo = 'observacion', metadatos = null } = req.body;
  const usuario_id = req.usuario?.id; // Del middleware requiereAuth
  const db = getDb();

  // Validaciones
  if (!contenido || typeof contenido !== 'string' || contenido.trim().length === 0) {
    return res.status(400).json({ error: 'El campo contenido es requerido y no puede estar vacío' });
  }

  const tiposValidos = ['observacion', 'avance', 'incidente', 'resolucion'];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ 
      error: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}` 
    });
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
          return res.status(403).json({ 
            error: 'No estás asignado a este reporte. Solo funcionarios asignados pueden agregar notas.' 
          });
        }

        // ⚠️ VALIDACIÓN CRÍTICA: No permitir notas si reporte está en pendiente_cierre o cerrado
        db.get('SELECT estado FROM reportes WHERE id = ?', [id], (err, reporteEstado) => {
          if (err) {
            console.error('Error verificando estado:', err);
            return res.status(500).json({ error: 'Error de base de datos' });
          }

          if (reporteEstado.estado === 'pendiente_cierre') {
            return res.status(409).json({
              error: 'No se pueden agregar notas mientras el reporte está en revisión de cierre. Espera a que el supervisor termine la revisión.'
            });
          }

          if (reporteEstado.estado === 'cerrado') {
            return res.status(409).json({
              error: 'No se pueden agregar notas a un reporte cerrado.'
            });
          }

          // Proceder si estado es válido
          continueWithNoteCreation();
        });

        function continueWithNoteCreation() {
        // 🔐 Sanitizar y cifrar contenido (E2E AES-256-GCM)
        const contenidoSanitizado = sanitizeInput(contenido.trim());
        const contenidoCifrado = encrypt(contenidoSanitizado);
        
        // Preparar metadatos JSON
        const metadatosStr = metadatos ? JSON.stringify(metadatos) : null;

        // Insertar nota de trabajo (append-only, nunca se actualiza)
        const sqlInsertar = `
          INSERT INTO notas_trabajo (reporte_id, usuario_id, contenido, tipo, metadatos)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.run(sqlInsertar, [id, usuario_id, contenidoCifrado, tipo, metadatosStr], function(err) {
          if (err) {
            console.error('Error al crear nota de trabajo:', err);
            return res.status(500).json({ error: 'Error de base de datos' });
          }

          const notaId = this.lastID;

          // Registrar en audit trail (ADR-0010)
          registrarCambio(db, {
            reporte_id: id,
            usuario_id: usuario_id,
            tipo_cambio: 'nota_trabajo_agregada',
            campo_modificado: 'notas_trabajo',
            valor_anterior: null,
            valor_nuevo: `[${tipo.toUpperCase()}] ${contenido.substring(0, 100)}...`,
            razon: `Nota de trabajo tipo "${tipo}" agregada a la bitácora`,
            metadatos: {
              nota_trabajo_id: notaId,
              tipo_nota: tipo,
              longitud_contenido: contenido.length,
              ip: req.ip || req.connection?.remoteAddress || 'unknown',
              user_agent: req.get('user-agent') || 'unknown'
            }
          }).catch(err => {
            console.error('⚠️ Error al registrar en historial (no crítico):', err);
          });

          // Retornar nota creada con información completa
          db.get(
            `SELECT 
              nt.id,
              nt.reporte_id,
              nt.usuario_id,
              u.nombre as usuario_nombre,
              u.email as usuario_email,
              nt.contenido,
              nt.tipo,
              nt.metadatos,
              nt.creado_en
            FROM notas_trabajo nt
            JOIN usuarios u ON nt.usuario_id = u.id
            WHERE nt.id = ?`,
            [notaId],
            (err, nota) => {
              if (err) {
                console.error('Error al obtener nota creada:', err);
                return res.status(500).json({ error: 'Error de base de datos' });
              }
              
              res.status(201).json({
                ...nota,
                metadatos: nota.metadatos ? JSON.parse(nota.metadatos) : null
              });
            }
          );
        });
        }
      }
    );
  });
}

/**
 * GET /api/reportes/:id/notas-trabajo/resumen
 * Obtiene resumen estadístico de notas de trabajo por tipo
 * Útil para dashboards y métricas de productividad
 */
export function resumenNotasTrabajo(req, res) {
  const { id } = req.params;
  const db = getDb();

  const sql = `
    SELECT 
      tipo,
      COUNT(*) as cantidad,
      COUNT(DISTINCT usuario_id) as funcionarios_participantes,
      MIN(creado_en) as primera_nota,
      MAX(creado_en) as ultima_nota
    FROM notas_trabajo
    WHERE reporte_id = ?
    GROUP BY tipo
  `;

  db.all(sql, [id], (err, rows) => {
    if (err) {
      console.error('Error al obtener resumen:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    
    const resumen = {
      total_notas: rows.reduce((acc, r) => acc + r.cantidad, 0),
      por_tipo: rows,
      funcionarios_activos: Math.max(...rows.map(r => r.funcionarios_participantes), 0)
    };
    
    res.json(resumen);
  });
}

/**
 * DELETE /api/reportes/:id/notas-trabajo/:notaId
 * ELIMINACIÓN LÓGICA (soft delete) de una nota
 * 
 * IMPORTANTE: En sistemas auditables, las notas NO deben eliminarse físicamente.
 * Esta función está deshabilitada por diseño. Para "eliminar" una nota,
 * agregar una nueva nota tipo "correccion" explicando por qué se invalida la anterior.
 */
export function eliminarNotaTrabajo(req, res) {
  return res.status(405).json({ 
    error: 'Operación no permitida', 
    mensaje: 'Las notas de trabajo son inmutables y no pueden eliminarse. Para corregir información, agrega una nueva nota tipo "correccion" explicando el cambio.',
    razon: 'Cumplimiento de trazabilidad auditable (ADR-0010)'
  });
}
