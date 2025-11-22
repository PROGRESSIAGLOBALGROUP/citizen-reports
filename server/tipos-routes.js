/**
 * Rutas para gestión de tipos y categorías
 * ADR-0009: Gestión Dinámica de Tipos y Categorías de Reportes
 * 
 * ENDPOINTS PÚBLICOS:
 * - GET /api/tipos - Obtener todos los tipos activos
 * - GET /api/categorias - Obtener categorías con sus tipos
 * 
 * ENDPOINTS ADMIN (requieren autenticación):
 * - POST /api/admin/tipos - Crear nuevo tipo
 * - PUT /api/admin/tipos/:id - Actualizar tipo
 * - DELETE /api/admin/tipos/:id - Desactivar tipo (soft delete)
 * - POST /api/admin/categorias - Crear nueva categoría
 * - PUT /api/admin/categorias/:id - Actualizar categoría
 */

import { getDb } from './db.js';

/**
 * GET /api/tipos
 * Devuelve TODOS los tipos activos (NO desde reportes)
 * Soluciona: Panel vacío cuando no hay reportes
 */
export function obtenerTiposActivos(req, res) {
  const db = getDb();
  
  db.all(
    `SELECT t.id, t.tipo, t.nombre, t.icono, t.color, 
            t.categoria_id, t.dependencia, t.orden,
            c.nombre as categoria_nombre, c.icono as categoria_icono
     FROM tipos_reporte t
     INNER JOIN categorias c ON t.categoria_id = c.id
     WHERE t.activo = 1 AND c.activo = 1
     ORDER BY c.orden, t.orden`,
    [],
    (err, rows) => {
      if (err) {
        console.error('❌ Error obteniendo tipos:', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }
      
      console.log(`✅ Tipos activos obtenidos: ${rows.length}`);
      res.json(rows);
    }
  );
}

/**
 * GET /api/categorias
 * Devuelve categorías con sus tipos anidados
 * Formato: [{ id, nombre, icono, tipos: [...] }, ...]
 */
export function obtenerCategoriasConTipos(req, res) {
  console.log('📥 Request recibida en /api/categorias');
  const db = getDb();
  
  // Primero obtener categorías
  db.all(
    `SELECT id, nombre, icono, descripcion, orden
     FROM categorias
     WHERE activo = 1
     ORDER BY orden`,
    [],
    (err, categorias) => {
      if (err) {
        console.error('❌ Error obteniendo categorías:', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }
      
      // Luego obtener tipos por categoría - DENTRO del mismo flujo
      db.all(
        `SELECT id, tipo, nombre, icono, color, categoria_id, dependencia, orden
         FROM tipos_reporte
         WHERE activo = 1
         ORDER BY orden`,
        [],
        (err, tipos) => {
          if (err) {
            console.error('❌ Error obteniendo tipos:', err);
            return res.status(500).json({ error: 'Error de base de datos' });
          }
          
          // Agrupar tipos por categoría
          const resultado = categorias.map(cat => ({
            ...cat,
            tipos: tipos.filter(t => t.categoria_id === cat.id)
          }));
          
          console.log(`✅ Categorías con tipos: ${resultado.length} categorías, ${tipos.length} tipos`);
          res.json(resultado);
        }
      );
    }
  );
}

/**
 * POST /api/admin/tipos
 * Crear nuevo tipo (solo admin)
 */
export function crearTipo(req, res) {
  const { tipo, nombre, icono, color, categoria_id, dependencia, descripcion } = req.body;
  
  // Validaciones
  if (!tipo || !nombre || !icono || !color || !categoria_id || !dependencia) {
    return res.status(400).json({ 
      error: 'Faltan campos requeridos',
      requeridos: ['tipo', 'nombre', 'icono', 'color', 'categoria_id', 'dependencia']
    });
  }
  
  // Validar formato de slug (tipo)
  if (!/^[a-z0-9_]+$/.test(tipo)) {
    return res.status(400).json({ 
      error: 'El campo "tipo" debe ser un slug válido (solo minúsculas, números y guiones bajos)'
    });
  }
  
  const db = getDb();
  
  // Verificar que la categoría existe
  db.get(
    'SELECT id FROM categorias WHERE id = ? AND activo = 1',
    [categoria_id],
    (err, categoria) => {
      if (err) {
        return res.status(500).json({ error: 'Error de base de datos' });
      }
      
      if (!categoria) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      
      // Obtener siguiente orden en la categoría
      db.get(
        'SELECT COALESCE(MAX(orden), 0) + 1 as next_orden FROM tipos_reporte WHERE categoria_id = ?',
        [categoria_id],
        (err, row) => {
          if (err) {
            return res.status(500).json({ error: 'Error de base de datos' });
          }
          
          const orden = row.next_orden;
          
          db.run(
            `INSERT INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, descripcion, orden)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [tipo, nombre, icono, color, categoria_id, dependencia, descripcion || null, orden],
            function(err) {
              if (err) {
                if (err.message.includes('UNIQUE')) {
                  return res.status(409).json({ error: 'El tipo ya existe' });
                }
                console.error('❌ Error creando tipo:', err);
                return res.status(500).json({ error: 'Error creando tipo' });
              }
              
              console.log(`✅ Tipo creado: ${tipo} (ID: ${this.lastID})`);
              res.status(201).json({ 
                id: this.lastID, 
                tipo, 
                nombre,
                mensaje: 'Tipo creado exitosamente'
              });
            }
          );
        }
      );
    }
  );
}

/**
 * PUT /api/admin/tipos/:id
 * Actualizar tipo existente (solo admin)
 */
export function actualizarTipo(req, res) {
  const { id } = req.params;
  const { nombre, icono, color, categoria_id, dependencia, descripcion } = req.body;
  
  if (!nombre && !icono && !color && !categoria_id && !dependencia && descripcion === undefined) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }
  
  const db = getDb();
  
  // Construir query dinámica
  const campos = [];
  const valores = [];
  
  if (nombre) {
    campos.push('nombre = ?');
    valores.push(nombre);
  }
  if (icono) {
    campos.push('icono = ?');
    valores.push(icono);
  }
  if (color) {
    campos.push('color = ?');
    valores.push(color);
  }
  if (categoria_id) {
    campos.push('categoria_id = ?');
    valores.push(categoria_id);
  }
  if (dependencia) {
    campos.push('dependencia = ?');
    valores.push(dependencia);
  }
  if (descripcion !== undefined) {
    campos.push('descripcion = ?');
    valores.push(descripcion);
  }
  
  campos.push('actualizado_en = datetime("now")');
  valores.push(id);
  
  const query = `UPDATE tipos_reporte SET ${campos.join(', ')} WHERE id = ?`;
  
  db.run(query, valores, function(err) {
    if (err) {
      console.error('❌ Error actualizando tipo:', err);
      return res.status(500).json({ error: 'Error actualizando tipo' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tipo no encontrado' });
    }
    
    console.log(`✅ Tipo actualizado: ID ${id}`);
    res.json({ mensaje: 'Tipo actualizado exitosamente', cambios: this.changes });
  });
}

/**
 * DELETE /api/admin/tipos/:id
 * Desactivar tipo (soft delete, solo admin)
 */
export function desactivarTipo(req, res) {
  const { id } = req.params;
  const db = getDb();
  
  db.run(
    'UPDATE tipos_reporte SET activo = 0, actualizado_en = datetime("now") WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        console.error('❌ Error desactivando tipo:', err);
        return res.status(500).json({ error: 'Error desactivando tipo' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Tipo no encontrado' });
      }
      
      console.log(`✅ Tipo desactivado: ID ${id}`);
      res.json({ mensaje: 'Tipo desactivado exitosamente' });
    }
  );
}

/**
 * POST /api/admin/categorias
 * Crear nueva categoría (solo admin)
 */
export function crearCategoria(req, res) {
  const { nombre, icono, descripcion } = req.body;
  
  if (!nombre || !icono) {
    return res.status(400).json({ 
      error: 'Faltan campos requeridos',
      requeridos: ['nombre', 'icono']
    });
  }
  
  const db = getDb();
  
  // Obtener siguiente orden
  db.get(
    'SELECT COALESCE(MAX(orden), 0) + 1 as next_orden FROM categorias',
    [],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Error de base de datos' });
      }
      
      const orden = row.next_orden;
      
      db.run(
        'INSERT INTO categorias (nombre, icono, descripcion, orden) VALUES (?, ?, ?, ?)',
        [nombre, icono, descripcion || null, orden],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              return res.status(409).json({ error: 'La categoría ya existe' });
            }
            console.error('❌ Error creando categoría:', err);
            return res.status(500).json({ error: 'Error creando categoría' });
          }
          
          console.log(`✅ Categoría creada: ${nombre} (ID: ${this.lastID})`);
          res.status(201).json({ 
            id: this.lastID, 
            nombre,
            mensaje: 'Categoría creada exitosamente'
          });
        }
      );
    }
  );
}

/**
 * PUT /api/admin/categorias/:id
 * Actualizar categoría existente (solo admin)
 */
export function actualizarCategoria(req, res) {
  const { id } = req.params;
  const { nombre, icono, descripcion } = req.body;
  
  if (!nombre && !icono && descripcion === undefined) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }
  
  const db = getDb();
  
  const campos = [];
  const valores = [];
  
  if (nombre) {
    campos.push('nombre = ?');
    valores.push(nombre);
  }
  if (icono) {
    campos.push('icono = ?');
    valores.push(icono);
  }
  if (descripcion !== undefined) {
    campos.push('descripcion = ?');
    valores.push(descripcion);
  }
  
  campos.push('actualizado_en = datetime("now")');
  valores.push(id);
  
  const query = `UPDATE categorias SET ${campos.join(', ')} WHERE id = ?`;
  
  db.run(query, valores, function(err) {
    if (err) {
      console.error('❌ Error actualizando categoría:', err);
      return res.status(500).json({ error: 'Error actualizando categoría' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    console.log(`✅ Categoría actualizada: ID ${id}`);
    res.json({ mensaje: 'Categoría actualizada exitosamente', cambios: this.changes });
  });
}
