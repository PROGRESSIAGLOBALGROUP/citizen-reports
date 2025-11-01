import { initDb, getDb } from './db.js';
import { dirname, isAbsolute, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const fixturePath = process.argv.includes('--from-file')
  ? process.argv[process.argv.indexOf('--from-file') + 1]
  : null;

// Datos de ejemplo realistas para Jantetelco, Morelos (coordenadas correctas)
let samples = [
  {
    tipo: 'baches',
    descripcion: 'Bache grande en Av. Morelos frente al mercado',
    lat: 18.7160,
    lng: -98.7760,
    peso: 4
  },
  {
    tipo: 'baches',
    descripcion: 'Banqueta hundida en calle Hidalgo',
    lat: 18.7140,
    lng: -98.7780,
    peso: 3
  },
  {
    tipo: 'alumbrado',
    descripcion: 'Lámpara fundida en plaza principal',
    lat: 18.7155,
    lng: -98.7765,
    peso: 2
  },
  {
    tipo: 'alumbrado',
    descripcion: 'Poste inclinado por el viento',
    lat: 18.7145,
    lng: -98.7785,
    peso: 4
  },
  {
    tipo: 'limpieza',
    descripcion: 'Basura acumulada en esquina céntrica',
    lat: 18.7150,
    lng: -98.7775,
    peso: 3
  },
  {
    tipo: 'agua',
    descripcion: 'Fuga de agua potable en calle principal',
    lat: 18.7140,
    lng: -98.7770,
    peso: 4
  },
  {
    tipo: 'agua',
    descripcion: 'Sin servicio hace 2 días',
    lat: 18.7135,
    lng: -98.7755,
    peso: 5
  },
  {
    tipo: 'parques',
    descripcion: 'Jardín municipal necesita mantenimiento',
    lat: 18.7155,
    lng: -98.7755,
    peso: 2
  },
  {
    tipo: 'seguridad',
    descripcion: 'Falta señalización en cruce peligroso',
    lat: 18.7170,
    lng: -98.7765,
    peso: 4
  },
  {
    tipo: 'seguridad',
    descripcion: 'Semáforo descompuesto', 
    lat: 18.7130,
    lng: -98.7775,
    peso: 3
  },

  // === ZONA NORTE DE JANTETELCO ===
  {
    tipo: 'baches',
    descripcion: 'Calle sin pavimentar en zona norte',
    lat: 18.7220,
    lng: -98.7780,
    peso: 3
  },
  {
    tipo: 'agua',
    descripcion: 'Pozo comunitario necesita mantenimiento',
    lat: 18.7210,
    lng: -98.7765,
    peso: 4
  },
  {
    tipo: 'alumbrado',
    descripcion: 'Colonia norte sin alumbrado público',
    lat: 18.7235,
    lng: -98.7790,
    peso: 5
  },
  {
    tipo: 'limpieza',
    descripcion: 'Lote baldío con basura acumulada',
    lat: 18.7245,
    lng: -98.7775,
    peso: 2
  },

  // === ZONA SUR DE JANTETELCO ===
  {
    tipo: 'seguridad',
    descripcion: 'Asaltos frecuentes en camino rural sur',
    lat: 18.7050,
    lng: -98.7785,
    peso: 5
  },
  {
    tipo: 'baches',
    descripcion: 'Camino de terracería intransitable',
    lat: 18.7030,
    lng: -98.7760,
    peso: 4
  },
  {
    tipo: 'agua',
    descripcion: 'Comunidad sin agua corriente',
    lat: 18.7020,
    lng: -98.7780,
    peso: 5
  },
  {
    tipo: 'parques',
    descripcion: 'Cancha deportiva abandonada',
    lat: 18.7040,
    lng: -98.7770,
    peso: 3
  },

  // === ZONA ESTE DE JANTETELCO ===
  {
    tipo: 'alumbrado',
    descripcion: 'Transformador dañado zona oriente',
    lat: 18.7160,
    lng: -98.7650,
    peso: 4
  },
  {
    tipo: 'baches',
    descripcion: 'Puente vehicular con grietas',
    lat: 18.7180,
    lng: -98.7670,
    peso: 5
  },
  {
    tipo: 'limpieza',
    descripcion: 'Barranca usada como tiradero',
    lat: 18.7140,
    lng: -98.7660,
    peso: 4
  },
  {
    tipo: 'agua',
    descripcion: 'Tubería rota desde hace semanas',
    lat: 18.7200,
    lng: -98.7680,
    peso: 4
  },

  // === ZONA OESTE DE JANTETELCO ===
  {
    tipo: 'seguridad',
    descripcion: 'Pandillerismo en barrio occidental',
    lat: 18.7120,
    lng: -98.7880,
    peso: 4
  },
  {
    tipo: 'parques',
    descripcion: 'Área verde invadida por maleza',
    lat: 18.7100,
    lng: -98.7850,
    peso: 2
  },
  {
    tipo: 'alumbrado',
    descripcion: 'Cables de luz colgando peligrosamente',
    lat: 18.7150,
    lng: -98.7870,
    peso: 5
  },
  {
    tipo: 'baches',
    descripcion: 'Calle principal llena de hoyos',
    lat: 18.7170,
    lng: -98.7860,
    peso: 3
  },

  // === ZONA CENTRAL EXPANDIDA ===
  {
    tipo: 'limpieza',
    descripcion: 'Mercado municipal con problemas de higiene',
    lat: 18.7155,
    lng: -98.7762,
    peso: 3
  },
  {
    tipo: 'agua',
    descripcion: 'Presión baja en zona céntrica',
    lat: 18.7148,
    lng: -98.7768,
    peso: 2
  },
  {
    tipo: 'seguridad',
    descripcion: 'Robo de cables en el centro',
    lat: 18.7152,
    lng: -98.7758,
    peso: 4
  },
  {
    tipo: 'parques',
    descripcion: 'Kiosco municipal requiere pintura',
    lat: 18.7158,
    lng: -98.7763,
    peso: 1
  },

  // === COLONIAS PERIFÉRICAS ===
  {
    tipo: 'baches',
    descripcion: 'Acceso a colonia Las Flores deteriorado',
    lat: 18.7190,
    lng: -98.7820,
    peso: 3
  },
  {
    tipo: 'agua',
    descripcion: 'Colonia Lomas sin servicio dominical',
    lat: 18.7080,
    lng: -98.7720,
    peso: 3
  },
  {
    tipo: 'alumbrado',
    descripcion: 'Colonia Nueva sin postes de luz',
    lat: 18.7250,
    lng: -98.7800,
    peso: 4
  },
  {
    tipo: 'limpieza',
    descripcion: 'Recolección irregular en Periferia Norte',
    lat: 18.7230,
    lng: -98.7750,
    peso: 2
  },

  // === ZONAS RURALES CERCANAS ===
  {
    tipo: 'seguridad',
    descripcion: 'Camino rural sin señalización',
    lat: 18.7280,
    lng: -98.7820,
    peso: 3
  },
  {
    tipo: 'baches',
    descripcion: 'Camino a campos agrícolas intransitable',
    lat: 18.7070,
    lng: -98.7850,
    peso: 4
  },
  {
    tipo: 'agua',
    descripcion: 'Bomba de agua comunitaria descompuesta',
    lat: 18.7260,
    lng: -98.7760,
    peso: 5
  },
  {
    tipo: 'parques',
    descripcion: 'Campo deportivo rural abandonado',
    lat: 18.7090,
    lng: -98.7680,
    peso: 2
  },

  // === INFRAESTRUCTURA MUNICIPAL ===
  {
    tipo: 'alumbrado',
    descripcion: 'Alumbrado deportivo del estadio fundido',
    lat: 18.7125,
    lng: -98.7745,
    peso: 3
  },
  {
    tipo: 'limpieza',
    descripcion: 'Panteón municipal requiere limpieza',
    lat: 18.7185,
    lng: -98.7785,
    peso: 2
  },
  {
    tipo: 'seguridad',
    descripcion: 'Escuela primaria sin cerco perimetral',
    lat: 18.7175,
    lng: -98.7740,
    peso: 4
  },
  {
    tipo: 'agua',
    descripcion: 'Centro de salud con baja presión',
    lat: 18.7165,
    lng: -98.7772,
    peso: 3
  },

  // === VIALIDADES PRINCIPALES ===
  {
    tipo: 'baches',
    descripcion: 'Carretera de acceso con baches profundos',
    lat: 18.7200,
    lng: -98.7700,
    peso: 4
  },
  {
    tipo: 'seguridad',
    descripcion: 'Crucero peligroso sin señales de alto',
    lat: 18.7110,
    lng: -98.7800,
    peso: 5
  },
  {
    tipo: 'alumbrado',
    descripcion: 'Vía principal oscura por las noches',
    lat: 18.7220,
    lng: -98.7730,
    peso: 4
  },
  {
    tipo: 'limpieza',
    descripcion: 'Maleza obstruye visibilidad en curva',
    lat: 18.7130,
    lng: -98.7700,
    peso: 3
  }
];

const shouldReset = process.argv.includes('--reset');

const __dirname = dirname(fileURLToPath(import.meta.url));
const targetDbPath = (() => {
  const custom = process.env.DB_PATH;
  if (custom) {
    return isAbsolute(custom) ? custom : resolve(custom);
  }
  return join(__dirname, 'data.db');
})();

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

(async () => {
  try {
    await initDb();

    if (fixturePath) {
      try {
        const external = JSON.parse(readFileSync(resolve(fixturePath), 'utf8'));
        if (Array.isArray(external) && external.length > 0) {
          samples = external;
        } else {
          console.warn('El archivo no contiene un arreglo válido, usando datos por defecto');
        }
      } catch (readErr) {
        console.warn('No se pudo leer el archivo de fixtures, usando datos por defecto:', readErr.message);
      }
    }
    const db = getDb();

    try {
      if (shouldReset) {
        await run(db, 'DELETE FROM reportes');
        console.log('Tabla reportes limpiada');
      }

      const insertSql = 'INSERT INTO reportes(tipo, descripcion, lat, lng, peso) VALUES (?,?,?,?,?)';
      for (const sample of samples) {
        await run(db, insertSql, [sample.tipo, sample.descripcion, sample.lat, sample.lng, sample.peso]);
      }

  console.log(`Se insertaron ${samples.length} reportes de ejemplo en ${targetDbPath}`);
    } finally {
      db.close();
    }
  } catch (err) {
    console.error('Error al sembrar datos:', err);
    process.exitCode = 1;
  }
})();
