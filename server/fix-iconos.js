/**
 * Script de corrección: Asegurar que todos los tipos de reporte tengan iconos
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 CORRECCIÓN: Asignando iconos a tipos de reporte sin icono\n');
console.log('=' .repeat(70));

// Mapeo de iconos por tipo
const iconosPorTipo = {
  'baches': '🕳️', 'bache': '🕳️', 'pavimento_danado': '🛣️',
  'semaforo': '🚦', 'senalizacion': '🚸', 'puente_danado': '🌉',
  'agua': '💧', 'fuga_agua': '💦', 'agua_potable': '🚰',
  'drenaje': '🚿', 'alcantarillado': '🚽',
  'alumbrado': '💡', 'alumbrado_publico': '💡', 'luz': '💡',
  'basura': '🗑️', 'recoleccion_basura': '🗑️', 'limpieza': '🧹',
  'arbol_caido': '🌳', 'poda': '✂️', 'jardineria': '🌿',
  'incendio': '🔥', 'incendio_forestal': '🔥', 'quema': '🔥',
  'inundacion': '🌊', 'seguridad': '🚨', 'emergencia': '🚨',
  'animal': '🐕', 'animales': '🐾', 'otro': '📍'
};

const coloresPorCategoria = {
  'infraestructura': '#f97316', 'servicios': '#3b82f6',
  'limpieza': '#10b981', 'medio_ambiente': '#22c55e',
  'seguridad': '#ef4444', 'emergencias': '#dc2626',
  'otros': '#6b7280'
};

db.all(`SELECT t.tipo, t.nombre, t.icono, t.color FROM tipos_reporte t WHERE t.icono IS NULL OR t.icono = ''`, (err, tiposSinIcono) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }
  
  if (tiposSinIcono.length === 0) {
    console.log('✅ Todos los tipos ya tienen iconos');
    db.close();
    return;
  }
  
  console.log(`⚠️  ${tiposSinIcono.length} tipos sin icono\n`);
  
  const stmt = db.prepare(`UPDATE tipos_reporte SET icono = ?, color = COALESCE(color, ?) WHERE tipo = ?`);
  let completed = 0;
  
  tiposSinIcono.forEach(tipo => {
    const icono = iconosPorTipo[tipo.tipo] || iconosPorTipo[tipo.tipo.toLowerCase()] || '📍';
    const color = tipo.color || coloresPorCategoria['otros'];
    
    stmt.run(icono, color, tipo.tipo, () => {
      console.log(`✅ ${tipo.tipo.padEnd(30)} → ${icono}`);
      if (++completed === tiposSinIcono.length) {
        stmt.finalize();
        console.log('\n🎉 Corrección completada!');
        db.close();
      }
    });
  });
});
