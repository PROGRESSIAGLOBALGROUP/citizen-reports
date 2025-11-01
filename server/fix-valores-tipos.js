/**
 * Fix: Actualizar campo 'valor' en tipos_reporte
 * 
 * Los tipos tienen valor="undefined" porque la migración 009
 * no estableció correctamente este campo.
 */

import { getDb } from './db.js';

const db = getDb();

console.log('🔧 Corrigiendo valores en tipos_reporte...\n');

// Actualizar cada tipo con su valor correcto basado en el nombre
const updates = [
  // Obras Públicas (cat 1)
  { id: 1, valor: 'bache' },
  { id: 2, valor: 'pavimento_danado' },
  { id: 3, valor: 'banqueta_rota' },
  { id: 4, valor: 'alcantarilla' },
  
  // Servicios Públicos (cat 2)
  { id: 5, valor: 'alumbrado_publico' },
  { id: 6, valor: 'basura' },
  { id: 7, valor: 'limpieza' },
  
  // Agua Potable (cat 3)
  { id: 8, valor: 'falta_agua' },
  { id: 9, valor: 'fuga_agua' },
  
  // Seguridad Pública (cat 4)
  { id: 10, valor: 'inseguridad' },
  { id: 11, valor: 'accidente' },
  { id: 12, valor: 'delito' },
  
  // Salud (cat 5)
  { id: 13, valor: 'plaga' },
  { id: 14, valor: 'mascota_herida' },
  { id: 15, valor: 'contaminacion' },
  
  // Medio Ambiente (cat 6)
  { id: 16, valor: 'arbol_caido' },
  { id: 17, valor: 'deforestacion' },
  { id: 18, valor: 'quema' },
  { id: 19, valor: 'parques_jardines' }
];

let completed = 0;

updates.forEach(update => {
  db.run(
    'UPDATE tipos_reporte SET tipo = ? WHERE id = ?',
    [update.valor, update.id],
    (err) => {
      if (err) {
        console.error(`❌ Error actualizando tipo ${update.id}:`, err.message);
      } else {
        console.log(`✅ Tipo ${update.id} actualizado: tipo="${update.valor}"`);
      }
      
      completed++;
      if (completed === updates.length) {
        // Verificar
        db.all('SELECT id, nombre, tipo FROM tipos_reporte ORDER BY id', [], (err, rows) => {
          if (!err) {
            console.log('\n📊 Estado final:');
            rows.forEach(r => {
              console.log(`   ${r.id}. ${r.nombre} → "${r.tipo}"`);
            });
          }
          
          console.log('\n✅ Corrección completada');
          db.close();
        });
      }
    }
  );
});
