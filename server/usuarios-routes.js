/**
 * Rutas de gestión de usuarios
 * Solo accesibles para usuarios con rol 'admin'
 */

import { getDb } from './db.js';
import bcrypt from 'bcrypt';
import { validarPassword as validarPasswordPolicy, sanitizeInput } from './security.js';

const SALT_ROUNDS = 10;
const ROLES_VALIDOS = ['admin', 'supervisor', 'funcionario'];

/**
 * Valida si una dependencia existe en la base de datos
 */
async function validarDependencia(slug) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.get(
      'SELECT slug FROM dependencias WHERE slug = ? AND activo = 1',
      [slug],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      }
    );
  });
}

/**
 * Valida email con formato correcto
 */
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida password usando política de seguridad
 */
function validarPassword(password) {
  const resultado = validarPasswordPolicy(password);
  return resultado.valido;
}

/**
 * Obtiene errores detallados de validación de password
 */
function obtenerErroresPassword(password) {
  const resultado = validarPasswordPolicy(password);
  return resultado.errores;
}

/**
 * GET /api/usuarios
 * Lista todos los usuarios (sin password_hash)
 * Soporta filtros: ?dependencia=obras_publicas&rol=funcionario&activo=1
 */
export function listarUsuarios(req, res) {
  const db = getDb();
  const { dependencia, rol, activo } = req.query;
  
  const conditions = [];
  const params = [];
  
  if (dependencia) {
    conditions.push('dependencia = ?');
    params.push(dependencia);
  }
  
  if (rol) {
    conditions.push('rol = ?');
    params.push(rol);
  }
  
  if (activo !== undefined) {
    conditions.push('activo = ?');
    params.push(activo === '1' || activo === 'true' ? 1 : 0);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const sql = `
    SELECT 
      id, email, nombre, dependencia, rol, activo, 
      creado_en, actualizado_en
    FROM usuarios
    ${whereClause}
    ORDER BY nombre ASC
  `;
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error al listar usuarios:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    res.json(rows || []);
  });
}

/**
 * GET /api/usuarios/:id
 * Obtiene un usuario específico
 */
export function obtenerUsuario(req, res) {
  const { id } = req.params;
  const db = getDb();
  
  const sql = `
    SELECT 
      id, email, nombre, dependencia, rol, activo, 
      creado_en, actualizado_en
    FROM usuarios
    WHERE id = ?
  `;
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Error al obtener usuario:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(row);
  });
}

/**
 * POST /api/usuarios
 * Crea un nuevo usuario
 */
export async function crearUsuario(req, res) {
  const { email, nombre, password, dependencia, rol = 'funcionario' } = req.body;
  
  // Validaciones
  if (!email || !validarEmail(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  
  if (!nombre || nombre.trim().length < 3) {
    return res.status(400).json({ error: 'Nombre debe tener al menos 3 caracteres' });
  }
  
  if (!password || !validarPassword(password)) {
    return res.status(400).json({ 
      error: 'Password debe tener al menos 8 caracteres, incluir letras y números' 
    });
  }
  
  // Validar dependencia contra la base de datos
  const dependenciaValida = await validarDependencia(dependencia);
  if (!dependenciaValida) {
    return res.status(400).json({ error: 'Dependencia inválida o inactiva' });
  }
  
  if (!ROLES_VALIDOS.includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  
  try {
    // Hash del password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const db = getDb();
    const sql = `
      INSERT INTO usuarios (email, nombre, password_hash, dependencia, rol, activo)
      VALUES (?, ?, ?, ?, ?, 1)
    `;
    
    db.run(sql, [email, nombre.trim(), passwordHash, dependencia, rol], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'El email ya está registrado' });
        }
        console.error('Error al crear usuario:', err);
        return res.status(500).json({ error: 'Error al crear usuario' });
      }
      
      res.status(201).json({ 
        ok: true, 
        id: this.lastID,
        mensaje: 'Usuario creado exitosamente'
      });
    });
  } catch (error) {
    console.error('Error al hashear password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * PUT /api/usuarios/:id
 * Actualiza un usuario existente
 */
export async function actualizarUsuario(req, res) {
  const { id } = req.params;
  const { email, nombre, password, dependencia, rol, activo } = req.body;
  
  const db = getDb();
  
  // Verificar que el usuario existe
  db.get('SELECT id FROM usuarios WHERE id = ?', [id], async (err, row) => {
    if (err) {
      console.error('Error al verificar usuario:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const updates = [];
    const params = [];
    
    // Construir UPDATE dinámicamente
    if (email !== undefined) {
      if (!validarEmail(email)) {
        return res.status(400).json({ error: 'Email inválido' });
      }
      updates.push('email = ?');
      params.push(email);
    }
    
    if (nombre !== undefined) {
      if (nombre.trim().length < 3) {
        return res.status(400).json({ error: 'Nombre debe tener al menos 3 caracteres' });
      }
      updates.push('nombre = ?');
      params.push(nombre.trim());
    }
    
    if (password !== undefined && password !== '') {
      if (!validarPassword(password)) {
        return res.status(400).json({ 
          error: 'Password debe tener al menos 8 caracteres, incluir letras y números' 
        });
      }
      try {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        updates.push('password_hash = ?');
        params.push(passwordHash);
      } catch (error) {
        console.error('Error al hashear password:', error);
        return res.status(500).json({ error: 'Error al procesar password' });
      }
    }
    
    if (dependencia !== undefined) {
      // Validar dependencia contra la base de datos
      const dependenciaValida = await validarDependencia(dependencia);
      if (!dependenciaValida) {
        return res.status(400).json({ error: 'Dependencia inválida o inactiva' });
      }
      updates.push('dependencia = ?');
      params.push(dependencia);
    }
    
    if (rol !== undefined) {
      if (!ROLES_VALIDOS.includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }
      updates.push('rol = ?');
      params.push(rol);
    }
    
    if (activo !== undefined) {
      updates.push('activo = ?');
      params.push(activo ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    updates.push('actualizado_en = datetime("now")');
    params.push(id);
    
    const sql = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(sql, params, function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'El email ya está registrado' });
        }
        console.error('Error al actualizar usuario:', err);
        return res.status(500).json({ error: 'Error al actualizar usuario' });
      }
      
      res.json({ 
        ok: true, 
        cambios: this.changes,
        mensaje: 'Usuario actualizado exitosamente'
      });
    });
  });
}

/**
 * DELETE /api/usuarios/:id
 * Elimina (desactiva) un usuario
 * Nota: No elimina físicamente para mantener integridad referencial
 */
export function eliminarUsuario(req, res) {
  const { id } = req.params;
  
  // No permitir eliminar el usuario admin principal
  if (id === '1') {
    return res.status(403).json({ 
      error: 'No se puede eliminar el usuario administrador principal' 
    });
  }
  
  const db = getDb();
  
  // Marcar como inactivo en lugar de eliminar
  const sql = 'UPDATE usuarios SET activo = 0, actualizado_en = datetime("now") WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error al desactivar usuario:', err);
      return res.status(500).json({ error: 'Error al eliminar usuario' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ 
      ok: true, 
      mensaje: 'Usuario desactivado exitosamente'
    });
  });
}

/**
 * GET /api/dependencias
 * DEPRECATED: Este endpoint ahora se maneja en dependencias-routes.js
 * Redirigir al nuevo endpoint /api/dependencias (listarDependenciasPublico)
 */
export function listarDependencias(req, res) {
  // Este endpoint ya no debería usarse, pero se mantiene por compatibilidad
  // El nuevo endpoint está en dependencias-routes.js: listarDependenciasPublico
  res.status(410).json({ 
    error: 'Este endpoint está deprecado. Use /api/dependencias del módulo dependencias-routes' 
  });
}

/**
 * GET /api/roles
 * Lista los roles disponibles
 */
export function listarRoles(req, res) {
  const roles = ROLES_VALIDOS.map(rol => ({
    id: rol,
    nombre: rol.charAt(0).toUpperCase() + rol.slice(1)
  }));
  
  res.json(roles);
}
