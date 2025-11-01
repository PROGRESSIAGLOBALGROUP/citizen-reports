/**
 * Migración 009: Crear tablas de tipos y categorías dinámicas
 * ADR-0009: Gestión Dinámica de Tipos y Categorías de Reportes
 * 
 * PROBLEMA RESUELTO:
 * - Endpoint /api/reportes/tipos devuelve solo tipos usados (SELECT DISTINCT de reportes)
 * - Panel izquierdo vacío cuando no hay reportes
 * - Dropdown muestra solo 1 tipo cuando hay 1 reporte
 * 
 * SOLUCIÓN:
 * - Crear tablas categorias y tipos_reporte
 * - Poblar con datos actuales de getTiposPrincipales()
 * - Nuevo endpoint /api/tipos que devuelve TODOS los tipos activos
 */

import { getDb } from '../db.js';

const CATEGORIAS_INICIALES = [
  { id: 1, nombre: 'Obras Públicas', icono: '🛣️', descripcion: 'Infraestructura vial y urbana', orden: 1 },
  { id: 2, nombre: 'Servicios Públicos', icono: '🔧', descripcion: 'Mantenimiento general', orden: 2 },
  { id: 3, nombre: 'Agua Potable', icono: '💧', descripcion: 'Red hidráulica y suministro', orden: 3 },
  { id: 4, nombre: 'Seguridad Pública', icono: '🚨', descripcion: 'Seguridad ciudadana', orden: 4 },
  { id: 5, nombre: 'Salud', icono: '🏥', descripcion: 'Salud pública y control sanitario', orden: 5 },
  { id: 6, nombre: 'Medio Ambiente', icono: '🌳', descripcion: 'Conservación ambiental', orden: 6 },
  { id: 7, nombre: 'Otros', icono: '📦', descripcion: 'Reportes misceláneos', orden: 7 }
];

const TIPOS_INICIALES = [
  // Obras Públicas (categoria_id: 1)
  { tipo: 'bache', nombre: 'Bache', icono: '🛣️', color: '#8b5cf6', categoria_id: 1, dependencia: 'obras_publicas', orden: 1 },
  { tipo: 'pavimento_danado', nombre: 'Pavimento Dañado', icono: '🚧', color: '#7c3aed', categoria_id: 1, dependencia: 'obras_publicas', orden: 2 },
  { tipo: 'banqueta_rota', nombre: 'Banqueta Rota', icono: '🚶', color: '#a855f7', categoria_id: 1, dependencia: 'obras_publicas', orden: 3 },
  { tipo: 'alcantarilla', nombre: 'Alcantarilla', icono: '🕳️', color: '#9333ea', categoria_id: 1, dependencia: 'obras_publicas', orden: 4 },
  
  // Servicios Públicos (categoria_id: 2)
  { tipo: 'alumbrado', nombre: 'Alumbrado Público', icono: '💡', color: '#f59e0b', categoria_id: 2, dependencia: 'servicios_publicos', orden: 1 },
  { tipo: 'basura', nombre: 'Basura', icono: '🗑️', color: '#10b981', categoria_id: 2, dependencia: 'servicios_publicos', orden: 2 },
  { tipo: 'limpieza', nombre: 'Limpieza', icono: '🧹', color: '#059669', categoria_id: 2, dependencia: 'servicios_publicos', orden: 3 },
  
  // Agua Potable (categoria_id: 3)
  { tipo: 'falta_agua', nombre: 'Falta de Agua', icono: '💧', color: '#3b82f6', categoria_id: 3, dependencia: 'agua_potable', orden: 1 },
  { tipo: 'fuga_agua', nombre: 'Fuga de Agua', icono: '💦', color: '#2563eb', categoria_id: 3, dependencia: 'agua_potable', orden: 2 },
  
  // Seguridad Pública (categoria_id: 4)
  { tipo: 'inseguridad', nombre: 'Inseguridad', icono: '🚨', color: '#ef4444', categoria_id: 4, dependencia: 'seguridad_publica', orden: 1 },
  { tipo: 'accidente', nombre: 'Accidente', icono: '🚗', color: '#dc2626', categoria_id: 4, dependencia: 'seguridad_publica', orden: 2 },
  { tipo: 'delito', nombre: 'Delito', icono: '🚔', color: '#b91c1c', categoria_id: 4, dependencia: 'seguridad_publica', orden: 3 },
  
  // Salud (categoria_id: 5)
  { tipo: 'plaga', nombre: 'Plaga', icono: '🦟', color: '#8b5cf6', categoria_id: 5, dependencia: 'salud', orden: 1 },
  { tipo: 'mascota_herida', nombre: 'Mascota Herida', icono: '🐕', color: '#a855f7', categoria_id: 5, dependencia: 'salud', orden: 2 },
  { tipo: 'contaminacion', nombre: 'Contaminación', icono: '☣️', color: '#7c3aed', categoria_id: 5, dependencia: 'salud', orden: 3 },
  
  // Medio Ambiente (categoria_id: 6)
  { tipo: 'arbol_caido', nombre: 'Árbol Caído', icono: '🌳', color: '#84cc16', categoria_id: 6, dependencia: 'medio_ambiente', orden: 1 },
  { tipo: 'deforestacion', nombre: 'Deforestación', icono: '🪓', color: '#65a30d', categoria_id: 6, dependencia: 'medio_ambiente', orden: 2 },
  { tipo: 'quema', nombre: 'Quema', icono: '🔥', color: '#ca8a04', categoria_id: 6, dependencia: 'medio_ambiente', orden: 3 },
  
  // Otros (categoria_id: 7)
  { tipo: 'parques', nombre: 'Parques y Jardines', icono: '🌳', color: '#84cc16', categoria_id: 7, dependencia: 'parques_jardines', orden: 1 }
];

async function migrar() {
  const db = getDb();
  
  console.log('\n📊 Migración 009: Tipos y Categorías Dinámicas\n');
  console.log('='.repeat(60));
  
  try {
    // Verificar si ya existen las tablas
    const tablasCategorias = await new Promise((resolve, reject) => {
      db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='categorias'",
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (tablasCategorias) {
      console.log('⚠️  Las tablas ya existen, verificando datos...');
      
      const countCategorias = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM categorias', [], (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
      
      const countTipos = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM tipos_reporte', [], (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
      
      console.log(`   Categorías existentes: ${countCategorias}`);
      console.log(`   Tipos existentes: ${countTipos}`);
      
      if (countCategorias > 0 && countTipos > 0) {
        console.log('\n✅ Migración ya aplicada previamente\n');
        return;
      }
    }
    
    // Crear tabla categorias
    console.log('\n📝 Creando tabla categorias...');
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS categorias (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT UNIQUE NOT NULL,
          icono TEXT NOT NULL,
          descripcion TEXT,
          orden INTEGER NOT NULL DEFAULT 0,
          activo INTEGER NOT NULL DEFAULT 1,
          creado_en TEXT NOT NULL DEFAULT (datetime('now')),
          actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Tabla categorias creada');
    
    // Crear tabla tipos_reporte
    console.log('📝 Creando tabla tipos_reporte...');
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS tipos_reporte (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tipo TEXT UNIQUE NOT NULL,
          nombre TEXT NOT NULL,
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
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Tabla tipos_reporte creada');
    
    // Crear índices
    console.log('📝 Creando índices...');
    await new Promise((resolve, reject) => {
      db.run('CREATE INDEX IF NOT EXISTS idx_tipos_categoria ON tipos_reporte(categoria_id)', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run('CREATE INDEX IF NOT EXISTS idx_tipos_activo ON tipos_reporte(activo)', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run('CREATE INDEX IF NOT EXISTS idx_categorias_activo ON categorias(activo)', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Índices creados');
    
    // Insertar categorías
    console.log('\n📝 Insertando categorías iniciales...');
    for (const cat of CATEGORIAS_INICIALES) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO categorias (id, nombre, icono, descripcion, orden) VALUES (?, ?, ?, ?, ?)',
          [cat.id, cat.nombre, cat.icono, cat.descripcion, cat.orden],
          (err) => {
            if (err) reject(err);
            else {
              console.log(`   ✅ ${cat.icono} ${cat.nombre}`);
              resolve();
            }
          }
        );
      });
    }
    
    // Insertar tipos
    console.log('\n📝 Insertando tipos iniciales...');
    for (const tipo of TIPOS_INICIALES) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [tipo.tipo, tipo.nombre, tipo.icono, tipo.color, tipo.categoria_id, tipo.dependencia, tipo.orden],
          (err) => {
            if (err) reject(err);
            else {
              console.log(`   ✅ ${tipo.icono} ${tipo.nombre} (${tipo.tipo})`);
              resolve();
            }
          }
        );
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Migración 009 completada exitosamente');
    console.log(`   Categorías insertadas: ${CATEGORIAS_INICIALES.length}`);
    console.log(`   Tipos insertados: ${TIPOS_INICIALES.length}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error en migración:', error);
    throw error;
  }
}

// Ejecutar migración
migrar()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
