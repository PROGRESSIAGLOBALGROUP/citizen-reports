# ADR-0009: Gestión Dinámica de Tipos y Categorías de Reportes

**Fecha:** 4 de octubre de 2025  
**Estado:** ✅ APROBADO  
**Contexto:** Post-consolidación de tipos de agua (ADR-0008)

---

## Contexto y Problemas Identificados

### Problema 1: Endpoint `/api/reportes/tipos` Devuelve Solo Tipos Usados

**Comportamiento actual (INCORRECTO):**

```javascript
// server/app.js línea 107
app.get('/api/reportes/tipos', (req, res) => {
  const db = getDb();
  db.all('SELECT DISTINCT tipo FROM reportes ORDER BY tipo', [], (err, rows) => {
    //       ^^^^^^^^ ← PROBLEMA: Solo devuelve tipos que YA existen en reportes
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows.map((r) => r.tipo));
  });
});
```

**Consecuencias:**
- Panel izquierdo vacío cuando NO hay reportes ❌
- Dropdown de formulario muestra solo 1 tipo cuando hay 1 reporte ❌
- Sistema parece "roto" al usuario nuevo

**Causa raíz:** El endpoint consulta `SELECT DISTINCT tipo FROM reportes`, devuelve solo tipos que YA TIENEN reportes creados.

---

### Problema 2: Panel Izquierdo Sin Collapse/Expand de Categorías

**Comportamiento actual:**

```jsx
// client/src/SimpleApp.jsx línea 239
const categorias = [
  { nombre: '🛣️ Obras Públicas', tipos: [...] },
  // ... 7 categorías SIEMPRE expandidas
];

return categorias.map((categoria) => {
  // Renderiza categoría Y todos sus tipos inmediatamente
  // NO hay control de collapse/expand
});
```

**Consecuencias:**
- Panel izquierdo ocupa mucho espacio vertical ❌
- Usuario debe hacer scroll para ver todas las categorías ❌
- Mala UX en pantallas pequeñas

---

### Problema 3: Tipos y Categorías Hardcodeados

**Estado actual:**

```javascript
// client/src/constants/tiposInfo.js
export const TIPOS_INFO = {
  'bache': { nombre: 'Bache', icono: '🛣️', color: '#8b5cf6' },
  // ... 38 tipos HARDCODEADOS
};

export function getTiposPrincipales() {
  return [
    'bache', 'pavimento_danado', // ... 21 tipos HARDCODEADOS
  ];
}

// client/src/SimpleApp.jsx línea 241
const categorias = [
  { nombre: '🛣️ Obras Públicas', tipos: ['bache', ...] },
  // ... 7 categorías HARDCODEADAS
];
```

**Consecuencias:**
- NO hay panel de administración para modificar tipos ❌
- NO se pueden agregar/eliminar tipos sin cambiar código ❌
- NO se pueden reorganizar categorías ❌
- Requiere redespliegue para cualquier cambio

---

## Decisión

### Opción Elegida: Sistema de Tipos y Categorías Persistentes en Base de Datos

**Arquitectura:**

```
┌──────────────────────────────────────────────────────────┐
│                   BASE DE DATOS                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  CREATE TABLE categorias (                               │
│    id          INTEGER PRIMARY KEY,                      │
│    nombre      TEXT UNIQUE NOT NULL,                     │
│    icono       TEXT,                                     │
│    orden       INTEGER,                                  │
│    activo      INTEGER DEFAULT 1                         │
│  );                                                      │
│                                                          │
│  CREATE TABLE tipos_reporte (                            │
│    id            INTEGER PRIMARY KEY,                    │
│    tipo          TEXT UNIQUE NOT NULL,                   │
│    nombre        TEXT NOT NULL,                          │
│    icono         TEXT,                                   │
│    color         TEXT,                                   │
│    categoria_id  INTEGER,                                │
│    dependencia   TEXT,                                   │
│    orden         INTEGER,                                │
│    activo        INTEGER DEFAULT 1,                      │
│    FOREIGN KEY (categoria_id) REFERENCES categorias(id)  │
│  );                                                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│                     BACKEND API                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  GET /api/tipos                                          │
│    → Devuelve TODOS los tipos activos (no desde reportes)│
│                                                          │
│  GET /api/categorias                                     │
│    → Devuelve TODAS las categorías con sus tipos        │
│                                                          │
│  POST /api/admin/tipos                                   │
│    → Crear nuevo tipo (solo admin)                      │
│                                                          │
│  PUT /api/admin/tipos/:id                                │
│    → Actualizar tipo (nombre, icono, color, etc.)       │
│                                                          │
│  DELETE /api/admin/tipos/:id                             │
│    → Desactivar tipo (soft delete)                      │
│                                                          │
│  POST /api/admin/categorias                              │
│    → Crear nueva categoría                              │
│                                                          │
│  PUT /api/admin/categorias/:id                           │
│    → Actualizar categoría                               │
│                                                          │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│                   FRONTEND UI                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Panel Izquierdo (SimpleApp.jsx):                        │
│    - Categorías con collapse/expand                     │
│    - useState para categoriasExpandidas                 │
│    - Click en header de categoría togglea expansión     │
│                                                          │
│  Formulario (ReportForm.jsx):                            │
│    - Dropdown carga desde GET /api/tipos                │
│    - SIEMPRE muestra todos los tipos activos            │
│                                                          │
│  Panel Admin (nuevo AdminTipos.jsx):                     │
│    - Lista de tipos y categorías                        │
│    - Crear/Editar/Desactivar tipos                      │
│    - Crear/Editar categorías                            │
│    - Reordenar drag & drop                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Implementación

### Fase 1: Migración de Base de Datos

```sql
-- server/migrations/009-crear-tablas-tipos-categorias.sql

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL,
  icono TEXT NOT NULL,
  descripcion TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabla de tipos de reporte
CREATE TABLE IF NOT EXISTS tipos_reporte (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT UNIQUE NOT NULL,  -- Identificador técnico (slug)
  nombre TEXT NOT NULL,        -- Nombre para mostrar
  icono TEXT NOT NULL,
  color TEXT NOT NULL,
  categoria_id INTEGER NOT NULL,
  dependencia TEXT NOT NULL,
  descripcion TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_tipos_categoria ON tipos_reporte(categoria_id);
CREATE INDEX IF NOT EXISTS idx_tipos_activo ON tipos_reporte(activo);
CREATE INDEX IF NOT EXISTS idx_categorias_activo ON categorias(activo);

-- Insertar categorías iniciales (desde código actual)
INSERT INTO categorias (nombre, icono, descripcion, orden) VALUES
('Obras Públicas', '🛣️', 'Infraestructura vial y urbana', 1),
('Servicios Públicos', '🔧', 'Mantenimiento general', 2),
('Agua Potable', '💧', 'Red hidráulica y suministro', 3),
('Seguridad Pública', '🚨', 'Seguridad ciudadana', 4),
('Salud', '🏥', 'Salud pública y control sanitario', 5),
('Medio Ambiente', '🌳', 'Conservación ambiental', 6),
('Otros', '📦', 'Reportes misceláneos', 7);

-- Insertar tipos iniciales (desde getTiposPrincipales)
-- Obras Públicas
INSERT INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES
('bache', 'Bache', '🛣️', '#8b5cf6', 1, 'obras_publicas', 1),
('pavimento_danado', 'Pavimento Dañado', '🚧', '#7c3aed', 1, 'obras_publicas', 2),
('banqueta_rota', 'Banqueta Rota', '🚶', '#a855f7', 1, 'obras_publicas', 3),
('alcantarilla', 'Alcantarilla', '🕳️', '#9333ea', 1, 'obras_publicas', 4);

-- Servicios Públicos
INSERT INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES
('alumbrado', 'Alumbrado Público', '💡', '#f59e0b', 2, 'servicios_publicos', 1),
('basura', 'Basura', '🗑️', '#10b981', 2, 'servicios_publicos', 2),
('limpieza', 'Limpieza', '🧹', '#059669', 2, 'servicios_publicos', 3);

-- Agua Potable
INSERT INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES
('falta_agua', 'Falta de Agua', '💧', '#3b82f6', 3, 'agua_potable', 1),
('fuga_agua', 'Fuga de Agua', '💦', '#2563eb', 3, 'agua_potable', 2);

-- Seguridad Pública
INSERT INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES
('inseguridad', 'Inseguridad', '🚨', '#ef4444', 4, 'seguridad_publica', 1),
('accidente', 'Accidente', '🚗', '#dc2626', 4, 'seguridad_publica', 2),
('delito', 'Delito', '🚔', '#b91c1c', 4, 'seguridad_publica', 3);

-- Salud
INSERT INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES
('plaga', 'Plaga', '🦟', '#8b5cf6', 5, 'salud', 1),
('mascota_herida', 'Mascota Herida', '🐕', '#a855f7', 5, 'salud', 2),
('contaminacion', 'Contaminación', '☣️', '#7c3aed', 5, 'salud', 3);

-- Medio Ambiente
INSERT INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES
('arbol_caido', 'Árbol Caído', '🌳', '#84cc16', 6, 'medio_ambiente', 1),
('deforestacion', 'Deforestación', '🪓', '#65a30d', 6, 'medio_ambiente', 2),
('quema', 'Quema', '🔥', '#ca8a04', 6, 'medio_ambiente', 3);

-- Otros (Legacy)
INSERT INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES
('parques', 'Parques y Jardines', '🌳', '#84cc16', 7, 'parques_jardines', 1);
```

### Fase 2: Backend - Nuevos Endpoints

```javascript
// server/tipos-routes.js (NUEVO)

import { getDb } from './db.js';

/**
 * GET /api/tipos
 * Devuelve TODOS los tipos activos (NO desde reportes)
 */
export function obtenerTiposActivos(req, res) {
  const db = getDb();
  
  db.all(
    `SELECT t.tipo, t.nombre, t.icono, t.color, 
            t.categoria_id, t.dependencia, t.orden,
            c.nombre as categoria_nombre
     FROM tipos_reporte t
     INNER JOIN categorias c ON t.categoria_id = c.id
     WHERE t.activo = 1 AND c.activo = 1
     ORDER BY c.orden, t.orden`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Error obteniendo tipos:', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }
      res.json(rows);
    }
  );
}

/**
 * GET /api/categorias
 * Devuelve categorías con sus tipos
 */
export function obtenerCategoriasConTipos(req, res) {
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
        console.error('Error obteniendo categorías:', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }
      
      // Luego obtener tipos por categoría
      db.all(
        `SELECT tipo, nombre, icono, color, categoria_id, dependencia, orden
         FROM tipos_reporte
         WHERE activo = 1
         ORDER BY orden`,
        [],
        (err, tipos) => {
          if (err) {
            console.error('Error obteniendo tipos:', err);
            return res.status(500).json({ error: 'Error de base de datos' });
          }
          
          // Agrupar tipos por categoría
          const resultado = categorias.map(cat => ({
            ...cat,
            tipos: tipos.filter(t => t.categoria_id === cat.id)
          }));
          
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
  const { tipo, nombre, icono, color, categoria_id, dependencia } = req.body;
  
  // Validaciones
  if (!tipo || !nombre || !icono || !color || !categoria_id || !dependencia) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  
  const db = getDb();
  
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
        `INSERT INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [tipo, nombre, icono, color, categoria_id, dependencia, orden],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              return res.status(409).json({ error: 'El tipo ya existe' });
            }
            return res.status(500).json({ error: 'Error creando tipo' });
          }
          
          res.status(201).json({ id: this.lastID, tipo, nombre });
        }
      );
    }
  );
}

// ... más funciones para PUT, DELETE, reordenar
```

### Fase 3: Frontend - Collapse/Expand en Panel

```jsx
// client/src/SimpleApp.jsx - Modificación

function SimpleApp({ usuario = null, onVerReporte = null }) {
  // ... estados existentes ...
  
  // NUEVO: Estado para controlar categorías expandidas
  const [categoriasExpandidas, setCategoriasExpandidas] = React.useState({});
  
  // NUEVO: Cargar categorías desde API
  const [categorias, setCategorias] = React.useState([]);
  
  React.useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        
        // Cargar categorías con tipos desde API
        const [categoriasData, reportesData] = await Promise.all([
          fetch('/api/categorias').then(r => r.json()),
          listarReportes()
        ]);
        
        setCategorias(categoriasData);
        setReportes(reportesData);
        
        // Inicializar todas las categorías como expandidas
        const expandidas = {};
        categoriasData.forEach(cat => {
          expandidas[cat.id] = true;
        });
        setCategoriasExpandidas(expandidas);
        
        // Extraer todos los tipos para filtros
        const todosTipos = categoriasData.flatMap(cat => cat.tipos.map(t => t.tipo));
        setTipos(todosTipos);
        setFiltrosActivos(todosTipos);
        
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, []);
  
  // Toggle expand/collapse de categoría
  const toggleCategoria = React.useCallback((categoriaId) => {
    setCategoriasExpandidas(prev => ({
      ...prev,
      [categoriaId]: !prev[categoriaId]
    }));
  }, []);
  
  return (
    <div className="simple-app">
      <aside>
        {/* ... header ... */}
        
        {/* Categorías con collapse/expand */}
        {categorias.map((categoria) => (
          <div key={categoria.id} style={{ marginBottom: '16px' }}>
            {/* Header de categoría - clickeable */}
            <div 
              onClick={() => toggleCategoria(categoria.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 4px',
                cursor: 'pointer',
                borderRadius: '4px',
                backgroundColor: categoriasExpandidas[categoria.id] ? '#f8fafc' : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {categoria.icono} {categoria.nombre}
              </div>
              
              {/* Icono de expand/collapse */}
              <span style={{
                fontSize: '12px',
                color: '#94a3b8',
                transition: 'transform 0.2s ease',
                transform: categoriasExpandidas[categoria.id] ? 'rotate(0deg)' : 'rotate(-90deg)'
              }}>
                ▼
              </span>
            </div>
            
            {/* Lista de tipos - solo si está expandida */}
            {categoriasExpandidas[categoria.id] && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginTop: '8px'
              }}>
                {categoria.tipos.map((tipoObj) => (
                  <div key={tipoObj.tipo} style={{/* ... estilo de tipo ... */}}>
                    {/* Renderizar tipo */}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </aside>
    </div>
  );
}
```

### Fase 4: Frontend - Panel de Administración

```jsx
// client/src/AdminTipos.jsx (NUEVO)

import React, { useState, useEffect } from 'react';

function AdminTipos() {
  const [categorias, setCategorias] = useState([]);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({});
  
  // Cargar categorías y tipos
  useEffect(() => {
    fetch('/api/categorias')
      .then(r => r.json())
      .then(data => setCategorias(data));
  }, []);
  
  // Crear nuevo tipo
  const crearTipo = async () => {
    const response = await fetch('/api/admin/tipos', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      // Recargar datos
      // ...
    }
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Administración de Tipos y Categorías</h1>
      
      {/* Tabla de categorías */}
      <section>
        <h2>Categorías</h2>
        <table>
          <thead>
            <tr>
              <th>Icono</th>
              <th>Nombre</th>
              <th>Tipos</th>
              <th>Orden</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map(cat => (
              <tr key={cat.id}>
                <td>{cat.icono}</td>
                <td>{cat.nombre}</td>
                <td>{cat.tipos.length}</td>
                <td>{cat.orden}</td>
                <td>
                  <button onClick={() => editarCategoria(cat)}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      {/* Lista de tipos por categoría */}
      <section>
        <h2>Tipos de Reporte</h2>
        {categorias.map(cat => (
          <div key={cat.id}>
            <h3>{cat.icono} {cat.nombre}</h3>
            <table>
              <thead>
                <tr>
                  <th>Icono</th>
                  <th>Nombre</th>
                  <th>Tipo (slug)</th>
                  <th>Color</th>
                  <th>Departamento</th>
                  <th>Orden</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cat.tipos.map(tipo => (
                  <tr key={tipo.tipo}>
                    <td>{tipo.icono}</td>
                    <td>{tipo.nombre}</td>
                    <td><code>{tipo.tipo}</code></td>
                    <td>
                      <span style={{ backgroundColor: tipo.color, padding: '4px 8px', borderRadius: '4px', color: 'white' }}>
                        {tipo.color}
                      </span>
                    </td>
                    <td>{tipo.dependencia}</td>
                    <td>{tipo.orden}</td>
                    <td>
                      <button onClick={() => editarTipo(tipo)}>Editar</button>
                      <button onClick={() => desactivarTipo(tipo.tipo)}>Desactivar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => agregarTipo(cat.id)}>+ Agregar Tipo</button>
          </div>
        ))}
      </section>
      
      {/* Modal de edición */}
      {editando && (
        <div className="modal">
          <h3>{editando.id ? 'Editar' : 'Crear'} Tipo</h3>
          <form onSubmit={guardarTipo}>
            <label>
              Tipo (slug):
              <input type="text" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} required />
            </label>
            <label>
              Nombre:
              <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required />
            </label>
            <label>
              Icono:
              <input type="text" value={formData.icono} onChange={e => setFormData({...formData, icono: e.target.value})} required />
            </label>
            <label>
              Color:
              <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} required />
            </label>
            <label>
              Departamento:
              <select value={formData.dependencia} onChange={e => setFormData({...formData, dependencia: e.target.value})} required>
                <option value="obras_publicas">Obras Públicas</option>
                <option value="servicios_publicos">Servicios Públicos</option>
                <option value="agua_potable">Agua Potable</option>
                <option value="seguridad_publica">Seguridad Pública</option>
                <option value="salud">Salud</option>
                <option value="medio_ambiente">Medio Ambiente</option>
              </select>
            </label>
            <button type="submit">Guardar</button>
            <button type="button" onClick={() => setEditando(null)}>Cancelar</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminTipos;
```

---

## Métricas de Éxito

- ✅ Panel izquierdo SIEMPRE muestra categorías y tipos (incluso con 0 reportes)
- ✅ Dropdown de formulario SIEMPRE muestra 21 tipos activos
- ✅ Categorías con collapse/expand funcional
- ✅ Panel de administración permite CRUD de tipos y categorías
- ✅ Cambios en tipos/categorías NO requieren redespliegue
- ✅ Tests E2E: Crear reporte con tipo recién creado desde admin

---

## Migración de Datos Existentes

```javascript
// server/migrations/009-migrar-datos-existentes.js

import { getDb } from '../db.js';

async function migrar() {
  const db = getDb();
  
  // 1. Crear tablas si no existen
  // (ejecutar 009-crear-tablas-tipos-categorias.sql)
  
  // 2. Verificar si ya hay datos en tipos_reporte
  const count = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM tipos_reporte', [], (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
  
  if (count > 0) {
    console.log('✅ Tipos ya migrados, saltando...');
    return;
  }
  
  // 3. Insertar datos iniciales
  // (ejecutar INSERTs del script SQL)
  
  console.log('✅ Migración completada');
}

migrar().catch(console.error);
```

---

## Rollback

Si se detectan problemas:

1. **Endpoint legacy**: Mantener `/api/reportes/tipos` como deprecated
2. **Fallback en frontend**: Si `/api/tipos` falla, usar `getTiposPrincipales()`
3. **Revertir schema**: Drop tables `tipos_reporte` y `categorias`

---

## Referencias

- **ADR-0007:** Consolidación de tipos de seguridad
- **ADR-0008:** Consolidación de tipos relacionados con agua
- **Schema:** `server/schema.sql`
- **Docs:** Code Surgeon Protocol en `code_surgeon/`

---

**Última actualización:** 4 de octubre de 2025  
**Próxima revisión:** Después de implementación completa
