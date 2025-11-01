#!/usr/bin/env node
/**
 * Genera ~70 registros dummy distribuidos geográficamente en Jantetelco, Morelos
 * 
 * Coordenadas aproximadas del municipio:
 * - Centro: 18.7150° N, -98.7770° W
 * - Rango: ±0.015° (~1.5 km de radio)
 * 
 * Distribución por tipo (reflejando realidad municipal):
 * - baches: 25 (35% - problema principal)
 * - alumbrado: 15 (21%)
 * - agua: 12 (17%)
 * - limpieza: 10 (14%)
 * - seguridad: 5 (7%)
 * - parques: 3 (4%)
 */

import { getDb } from './db.js';

const CENTRO_LAT = 18.715;
const CENTRO_LNG = -98.777;
const RADIO = 0.015; // ~1.5 km

const TIPOS_REPORTES = {
  baches: {
    count: 25,
    descripciones: [
      'Bache profundo en calle principal',
      'Pavimento deteriorado necesita reparación',
      'Hoyo grande en avenida causa daños',
      'Grietas en asfalto por lluvias',
      'Calle con múltiples baches',
      'Pavimento hundido en esquina',
      'Deformación en carpeta asfáltica',
      'Bache obstruye paso de vehículos',
      'Necesita bacheo urgente',
      'Superficie irregular peligrosa',
      'Pavimento levantado por raíces',
      'Socavón en calle secundaria',
      'Deterioro severo del asfalto',
      'Baches por falta de mantenimiento',
      'Depresión en vía principal',
    ],
  },
  alumbrado: {
    count: 15,
    descripciones: [
      'Lámpara apagada en calle oscura',
      'Poste de luz sin funcionar',
      'Luminaria fundida en avenida',
      'Falta iluminación nocturna',
      'Luz intermitente necesita revisión',
      'Zona oscura por lámpara descompuesta',
      'Poste inclinado con cables expuestos',
      'Foco fundido en plaza',
      'Luminaria dañada por vandalismo',
      'Necesita reposición de lámpara',
    ],
  },
  agua: {
    count: 12,
    descripciones: [
      'Fuga de agua en tubería principal',
      'Desperdicio de agua por fuga',
      'Goteo constante en calle',
      'Fuga subterránea erosiona pavimento',
      'Pérdida de agua potable',
      'Derrame de agua en banqueta',
      'Tubería rota necesita reparación',
      'Charco permanente por fuga',
      'Desperdicio de agua municipal',
      'Filtración en red de agua',
    ],
  },
  limpieza: {
    count: 10,
    descripciones: [
      'Basura acumulada en esquina',
      'Contenedor desbordado necesita vaciado',
      'Basura en vía pública',
      'Escombros obstruyen banqueta',
      'Necesita recolección de basura',
      'Desechos en área verde',
      'Basura en canal de drenaje',
      'Lotes baldíos con basura',
      'Residuos en calle principal',
      'Falta limpieza en plaza',
    ],
  },
  seguridad: {
    count: 5,
    descripciones: [
      'Zona oscura necesita vigilancia',
      'Falta presencia policial',
      'Necesita rondín nocturno',
      'Área requiere más vigilancia',
      'Punto de reunión conflictivo',
    ],
  },
  parques: {
    count: 3,
    descripciones: [
      'Jardín necesita mantenimiento',
      'Árboles requieren poda',
      'Juegos infantiles en mal estado',
    ],
  },
};

// Calles reales de Jantetelco (para descripciones más realistas)
const CALLES = [
  'Av. Morelos',
  'Calle Hidalgo',
  'Calle Juárez',
  'Calle Guerrero',
  'Calle Allende',
  'Calle 5 de Mayo',
  'Calle Independencia',
  'Calle Reforma',
  'Calle Zaragoza',
  'Calle Matamoros',
  'Calle Ocampo',
  'Calle Plaza Principal',
  'Calle del Mercado',
  'Calle Morelos Norte',
  'Calle Morelos Sur',
];

// Generar coordenada aleatoria dentro del radio
function randomCoord(center, radius) {
  const angle = Math.random() * 2 * Math.PI;
  const r = Math.sqrt(Math.random()) * radius; // Distribución uniforme en círculo
  return center + r * Math.cos(angle);
}

// Generar descripción con calle aleatoria
function generarDescripcion(tipoDescripciones) {
  const desc = tipoDescripciones[Math.floor(Math.random() * tipoDescripciones.length)];
  const calle = CALLES[Math.floor(Math.random() * CALLES.length)];
  
  // 70% con calle específica, 30% genérico
  if (Math.random() < 0.7) {
    return `${desc} en ${calle}`;
  }
  return desc;
}

// Generar peso variable (más realista)
function generarPeso() {
  const rand = Math.random();
  if (rand < 0.6) return 1; // 60% peso normal
  if (rand < 0.85) return 2; // 25% prioridad media
  return 3; // 15% prioridad alta
}

console.log('🌍 Generando ~70 registros dummy para Jantetelco...\n');

const db = getDb();

// Contar registros existentes
db.get('SELECT COUNT(*) as count FROM reportes', [], (err, row) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    process.exit(1);
  }

  const existentes = row.count;
  console.log(`📊 Registros existentes: ${existentes}`);

  const reportes = [];

  // Generar reportes por tipo
  Object.entries(TIPOS_REPORTES).forEach(([tipo, config]) => {
    for (let i = 0; i < config.count; i++) {
      const lat = randomCoord(CENTRO_LAT, RADIO);
      const lng = randomCoord(CENTRO_LNG, RADIO);
      const descripcion = generarDescripcion(config.descripciones);
      const peso = generarPeso();

      reportes.push({
        tipo,
        descripcion,
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        peso,
      });
    }
  });

  console.log(`\n📝 Insertando ${reportes.length} nuevos reportes...`);

  const stmt = db.prepare(
    'INSERT INTO reportes (tipo, descripcion, lat, lng, peso, dependencia) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const DEPENDENCIA_POR_TIPO = {
    baches: 'obras_publicas',
    alumbrado: 'servicios_publicos',
    agua: 'agua_potable',
    limpieza: 'servicios_publicos',
    seguridad: 'seguridad_publica',
    parques: 'servicios_publicos',
  };

  let insertados = 0;
  let errores = 0;

  reportes.forEach((r) => {
    const dependencia = DEPENDENCIA_POR_TIPO[r.tipo] || 'administracion';
    stmt.run(r.tipo, r.descripcion, r.lat, r.lng, r.peso, dependencia, function (stmtErr) {
      if (stmtErr) {
        console.error(`❌ Error insertando: ${stmtErr.message}`);
        errores++;
      } else {
        insertados++;
      }

      if (insertados + errores === reportes.length) {
        stmt.finalize();

        // Verificar totales
        db.get('SELECT COUNT(*) as count FROM reportes', [], (countErr, countRow) => {
          if (!countErr) {
            console.log(`\n✅ Insertados: ${insertados} reportes`);
            if (errores > 0) {
              console.log(`⚠️  Errores: ${errores}`);
            }
            console.log(`📊 Total en DB: ${countRow.count} registros`);

            // Mostrar distribución
            db.all('SELECT tipo, COUNT(*) as count FROM reportes GROUP BY tipo ORDER BY count DESC', [], (distErr, dist) => {
              if (!distErr && dist) {
                console.log('\n📊 Distribución por tipo:');
                dist.forEach((d) => {
                  const percentage = ((d.count / countRow.count) * 100).toFixed(1);
                  console.log(`  ${d.tipo.padEnd(12)} : ${String(d.count).padStart(3)} (${percentage}%)`);
                });
              }
              db.close();
            });
          } else {
            db.close();
          }
        });
      }
    });
  });
});
