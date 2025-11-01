/**
 * Script de prueba mínimo para endpoint de categorías
 */

import express from './server/node_modules/express/index.js';
import { getDb } from './server/db.js';

const app = express();

app.get('/api/categorias', (req, res) => {
  console.log('📞 Request recibido en /api/categorias');
  
  let db;
  try {
    db = getDb();
    console.log('✅ DB connection created');
  } catch (error) {
    console.error('❌ Error creating DB connection:', error);
    return res.status(500).json({ error: 'Database connection failed' });
  }
  
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
      
      console.log(`✅ Categorías obtenidas: ${categorias.length}`);
      
      // Luego obtener tipos por categoría
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
          
          console.log(`✅ Tipos obtenidos: ${tipos.length}`);
          
          // Agrupar tipos por categoría
          const resultado = categorias.map(cat => ({
            ...cat,
            tipos: tipos.filter(t => t.categoria_id === cat.id)
          }));
          
          console.log(`✅ Resultado final: ${resultado.length} categorías`);
          console.log('📤 Enviando respuesta...');
          res.json(resultado);
        }
      );
    }
  );
});

const PORT = 4000;

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

try {
  const server = app.listen(PORT, () => {
    console.log(`✅ Servidor de prueba en http://localhost:${PORT}`);
    console.log(`📊 Test endpoint: http://localhost:${PORT}/api/categorias`);
  });
  
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Error starting server:', error);
  process.exit(1);
}
