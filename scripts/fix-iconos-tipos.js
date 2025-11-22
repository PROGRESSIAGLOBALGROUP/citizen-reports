/**
 * Script de corrección: Asegurar que todos los tipos de reporte tengan iconos
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 CORRECCIÓN: Asignando iconos a tipos de reporte sin icono\n');
console.log('=' .repeat(70));

// Mapeo de iconos por tipo (basado en convenciones comunes)
const iconosPorTipo = {
  // Infraestructura y Vialidad
  'baches': '🕳️',
  'bache': '🕳️',
  'pavimento_danado': '🛣️',
  'semaforo': '🚦',
  'senalizacion': '🚸',
  'puente_danado': '🌉',
  
  // Servicios Públicos
  'agua': '💧',
  'fuga_agua': '💦',
  'agua_potable': '🚰',
  'drenaje': '🚿',
  'alcantarillado': '🚽',
  'alumbrado': '💡',
  'alumbrado_publico': '💡',
  'luz': '💡',
  
  // Limpieza y Residuos
  'basura': '🗑️',
  'recoleccion_basura': '🗑️',
  'limpieza': '🧹',
  'contenedor_danado': '🗑️',
  
  // Medio Ambiente
  'arbol_caido': '🌳',
  'poda': '✂️',
  'jardineria': '🌿',
  'parque': '🏞️',
  'area_verde': '🌱',
  'plaga': '🦟',
  'contaminacion': '☠️',
  
  // Seguridad
  'seguridad': '🚨',
  'vandalismo': '⚠️',
  'grafiti': '🎨',
  'delito': '🚔',
  
  // Emergencias
  'incendio': '🔥',
  'incendio_forestal': '🔥',
  'inundacion': '🌊',
  'derrumbe': '🪨',
  'emergencia': '🚨',
  
  // Animales
  'animal_en_via_publica': '🐕',
  'perro_callejero': '🐕',
  'animales': '🐾',
  
  // Construcción y Edificaciones
  'obra': '🏗️',
  'edificio_danado': '🏚️',
  'construccion_irregular': '🚧',
  
  // Otros
  'queja': '📢',
  'sugerencia': '💡',
  'otro': '📍',
  'general': '📍'
};

// Colores por categoría
const coloresPorCategoria = {
  'infraestructura': '#f97316', // Naranja
  'servicios': '#3b82f6',       // Azul
  'limpieza': '#10b981',        // Verde
  'medio_ambiente': '#22c55e',  // Verde claro
  'seguridad': '#ef4444',       // Rojo
  'emergencias': '#dc2626',     // Rojo oscuro
  'animales': '#a855f7',        // Morado
  'construccion': '#f59e0b',    // Ámbar
  'otros': '#6b7280'            // Gris
};

console.log('\n📋 Paso 1: Consultando tipos sin icono...\n');

db.all(`
  SELECT t.tipo, t.nombre, t.icono, t.color, c.nombre as categoria
  FROM tipos_reporte t
  LEFT JOIN categorias c ON t.categoria_id = c.id
  WHERE t.icono IS NULL OR t.icono = ''
`, (err, tiposSinIcono) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }
  
  if (tiposSinIcono.length === 0) {
    console.log('✅ Todos los tipos ya tienen iconos asignados');
    db.close();
    return;
  }
  
  console.log(`⚠️  Encontrados ${tiposSinIcono.length} tipos sin icono:\n`);
  
  const updates = [];
  
  tiposSinIcono.forEach(tipo => {
    // Buscar icono apropiado
    let icono = iconosPorTipo[tipo.tipo] || 
                iconosPorTipo[tipo.tipo.toLowerCase()] ||
                iconosPorTipo[tipo.tipo.replace(/_/g, ' ')] ||
                '📍'; // Icono por defecto
    
    // Asignar color si no tiene
    let color = tipo.color;
    if (!color) {
      const categoriaKey = tipo.categoria?.toLowerCase().replace(/ /g, '_') || 'otros';
      color = coloresPorCategoria[categoriaKey] || coloresPorCategoria['otros'];
    }
    
    console.log(`🔧 ${tipo.tipo.padEnd(30)} → ${icono} (${tipo.nombre})`);
    
    updates.push({
      tipo: tipo.tipo,
      icono: icono,
      color: color
    });
  });
  
  console.log(`\n📋 Paso 2: Actualizando ${updates.length} tipos...\n`);
  
  const stmt = db.prepare(`
    UPDATE tipos_reporte 
    SET icono = ?, color = COALESCE(color, ?)
    WHERE tipo = ?
  `);
  
  let completed = 0;
  
  updates.forEach(update => {
    stmt.run(update.icono, update.color, update.tipo, (err) => {
      if (err) {
        console.error(`❌ Error actualizando ${update.tipo}:`, err);
      } else {
        console.log(`✅ ${update.tipo.padEnd(30)} actualizado → ${update.icono}`);
      }
      
      completed++;
      
      if (completed === updates.length) {
        stmt.finalize();
        
        // Verificar resultado
        console.log('\n' + '='.repeat(70));
        console.log('\n📋 Paso 3: Verificando resultado...\n');
        
        db.all(`
          SELECT tipo, nombre, icono, color 
          FROM tipos_reporte 
          ORDER BY tipo
        `, (err, todosLosTipos) => {
          if (err) {
            console.error('❌ Error:', err);
            db.close();
            return;
          }
          
          const sinIcono = todosLosTipos.filter(t => !t.icono || t.icono === '');
          const conIcono = todosLosTipos.length - sinIcono.length;
          
          console.log(`✅ Tipos con icono: ${conIcono}/${todosLosTipos.length} (${Math.round(conIcono/todosLosTipos.length*100)}%)`);
          
          if (sinIcono.length > 0) {
            console.log(`\n⚠️  Tipos que aún no tienen icono:`);
            sinIcono.forEach(t => {
              console.log(`   ❌ ${t.tipo} - ${t.nombre}`);
            });
          } else {
            console.log('\n🎉 ¡ÉXITO! Todos los tipos tienen iconos asignados');
          }
          
          console.log('\n📊 Muestra de tipos actualizados:\n');
          todosLosTipos.slice(0, 10).forEach(t => {
            console.log(`   ${t.icono} ${t.tipo.padEnd(25)} - ${t.nombre} (${t.color})`);
          });
          
          console.log('\n✅ CORRECCIÓN COMPLETADA');
          console.log('\n📝 Siguiente paso:');
          console.log('   Ejecuta: node scripts/test-iconos-mapa.js');
          console.log('   Para verificar que los iconos se muestren correctamente\n');
          
          db.close();
        });
      }
    });
  });
});
