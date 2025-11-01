#!/usr/bin/env node
/**
 * Aplica migración 001: Agregar columna descripcion_corta
 * 
 * Esta migración:
 * 1. Agrega columna descripcion_corta a tabla reportes
 * 2. Genera descripciones cortas automáticas (primeros 100 caracteres)
 * 3. Crea índice para búsquedas rápidas
 */

import { getDb } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Aplicando migración 001: Agregar descripcion_corta\n');

const migrationPath = path.join(__dirname, 'migrations', '001_add_descripcion_corta.sql');

// Leer archivo de migración
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

// Separar por statements SQL (terminados en ;)
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => {
    // Filtrar líneas vacías y solo comentarios
    if (!s) return false;
    const sinComentarios = s.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim();
    return sinComentarios.length > 0;
  })
  .map(s => {
    // Limpiar comentarios pero mantener el SQL
    return s.split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim();
  });

console.log(`📝 Encontrados ${statements.length} statements SQL\n`);

const db = getDb();

let ejecutados = 0;
let errores = 0;

// Ejecutar cada statement secuencialmente
function ejecutarStatement(index) {
  if (index >= statements.length) {
    // Verificar resultado
    db.get('SELECT COUNT(*) as total FROM reportes WHERE descripcion_corta IS NOT NULL', [], (err, row) => {
      if (!err && row) {
        console.log(`\n✅ Migración completada:`);
        console.log(`   • ${ejecutados} statements ejecutados`);
        console.log(`   • ${row.total} registros con descripcion_corta`);
        
        // Mostrar algunos ejemplos
        db.all('SELECT id, descripcion_corta, descripcion FROM reportes LIMIT 5', [], (errEx, rows) => {
          if (!errEx && rows) {
            console.log(`\n📋 Ejemplos de descripciones cortas generadas:`);
            rows.forEach(r => {
              console.log(`   ID ${r.id}:`);
              console.log(`     Corta: "${r.descripcion_corta}"`);
              console.log(`     Larga: "${r.descripcion}"`);
              console.log();
            });
          }
          db.close();
        });
      } else {
        db.close();
      }
    });
    return;
  }

  const stmt = statements[index];
  console.log(`⚙️  Ejecutando statement ${index + 1}/${statements.length}...`);

  db.run(stmt, [], (err) => {
    if (err) {
      // Ignorar error "duplicate column" (migración ya aplicada)
      if (err.message.includes('duplicate column')) {
        console.log(`   ⚠️  Columna ya existe (migración previamente aplicada)`);
        ejecutados++;
      } else {
        console.error(`   ❌ Error:`, err.message);
        errores++;
      }
    } else {
      console.log(`   ✅ Exitoso`);
      ejecutados++;
    }

    // Ejecutar siguiente
    ejecutarStatement(index + 1);
  });
}

// Iniciar ejecución
ejecutarStatement(0);
