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
 */

import { getDb } from './db.js';

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
