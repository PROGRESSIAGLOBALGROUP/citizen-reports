import fs from 'fs';
import { initDb, getDb } from './db.js';

// Mapeo de tipo a descripciones coherentes
const TIPOS_DESCRIPCIONES = {
  baches: {
    descripciones: [
      'Bache profundo en avenida principal',
      'Hundimiento de pavimento en calle céntrica', 
      'Agrietamiento severo en vía pública',
      'Hoyo grande en banqueta',
      'Pavimento dañado por lluvia',
      'Bache peligroso en crucero',
      'Deterioro de asfalto en zona residencial',
      'Hundimiento por fuga de agua',
      'Grietas extensas en calzada'
    ],
    cortas: [
      'Bache profundo',
      'Pavimento hundido',
      'Asfalto agrietado', 
      'Hoyo en banqueta',
      'Daño por lluvia',
      'Bache peligroso',
      'Asfalto deteriorado',
      'Hundimiento vial',
      'Grietas en calle'
    ],
    pesos: [3, 4, 5] // Media a alta prioridad
  },
  alumbrado: {
    descripciones: [
      'Lámpara fundida en plaza principal',
      'Poste de luz inclinado por viento',
      'Alumbrado público sin funcionar',
      'Transformador dañado en colonia',
      'Cables de luz colgando peligrosamente',
      'Falta iluminación en parque',
      'Luminaria intermitente en avenida',
      'Apagón parcial en sector'
    ],
    cortas: [
      'Lámpara fundida',
      'Poste inclinado',
      'Sin alumbrado',
      'Transformador dañado',
      'Cables colgando',
      'Sin iluminación',
      'Luz intermitente',
      'Apagón parcial'
    ],
    pesos: [2, 3, 4, 5] // Baja a alta prioridad
  },
  seguridad: {
    descripciones: [
      'Falta señalización en cruce peligroso',
      'Semáforo descompuesto en centro',
      'Asaltos frecuentes en zona',
      'Falta vigilancia en parque',
      'Señal de alto vandalizada',
      'Crucero sin señalización',
      'Pandillerismo en área pública',
      'Robo de cables en poste'
    ],
    cortas: [
      'Sin señalización',
      'Semáforo roto',
      'Zona insegura',
      'Sin vigilancia',
      'Señal dañada',
      'Crucero peligroso',
      'Pandillerismo',
      'Robo de cables'
    ],
    pesos: [3, 4, 5] // Media a alta prioridad
  },
  agua: {
    descripciones: [
      'Fuga de agua potable en calle principal',
      'Sin servicio de agua hace días',
      'Coladera sin tapa representa peligro',
      'Tubería rota desde hace semanas',
      'Presión baja en zona residencial',
      'Pozo comunitario descompuesto',
      'Inundación por tubería rota',
      'Drenaje colapsado en vía pública'
    ],
    cortas: [
      'Fuga de agua',
      'Sin servicio',
      'Coladera destapada',
      'Tubería rota',
      'Presión baja',
      'Pozo dañado',
      'Inundación',
      'Drenaje colapsado'
    ],
    pesos: [3, 4, 5] // Media a alta prioridad
  },
  limpieza: {
    descripciones: [
      'Basura acumulada en esquina céntrica',
      'Lote baldío usado como tiradero',
      'Recolección irregular de basura',
      'Mercado con problemas de higiene',
      'Barranca usada como tiradero',
      'Maleza obstruye visibilidad',
      'Panteón requiere limpieza general',
      'Residuos tóxicos abandonados'
    ],
    cortas: [
      'Basura acumulada',
      'Tiradero clandestino',
      'Sin recolección',
      'Falta higiene',
      'Barranca sucia',
      'Maleza excesiva',
      'Panteón sucio',
      'Residuos tóxicos'
    ],
    pesos: [1, 2, 3, 4] // Baja a media prioridad
  },
  parques: {
    descripciones: [
      'Jardín municipal necesita mantenimiento',
      'Área verde invadida por maleza',
      'Juegos infantiles en mal estado',
      'Kiosco requiere pintura y reparación',
      'Campo deportivo abandonado',
      'Bancas rotas en plaza pública',
      'Árboles necesitan poda urgente',
      'Pasto seco en área recreativa'
    ],
    cortas: [
      'Jardín sin mantenimiento',
      'Maleza invasiva',
      'Juegos dañados',
      'Kiosco deteriorado',
      'Campo abandonado',
      'Bancas rotas',
      'Árboles sin podar',
      'Pasto seco'
    ],
    pesos: [1, 2, 3] // Baja a media prioridad
  }
};

// Función para generar descripción coherente basada en tipo
function generarDescripcionCoherente(tipo, pesoActual) {
  const tipoData = TIPOS_DESCRIPCIONES[tipo];
  if (!tipoData) {
    console.warn(`Tipo desconocido: ${tipo}`);
    return {
      descripcion: `Reporte de ${tipo}`,
      descripcion_corta: `${tipo}`,
      peso: pesoActual
    };
  }

  // Seleccionar descripción aleatoria del tipo
  const indice = Math.floor(Math.random() * tipoData.descripciones.length);
  const descripcion = tipoData.descripciones[indice];
  const descripcion_corta = tipoData.cortas[indice];

  // Ajustar peso si no es coherente con el tipo
  let peso = pesoActual;
  const pesosValidos = tipoData.pesos;
  if (!pesosValidos.includes(pesoActual)) {
    // Tomar peso aleatorio válido para este tipo
    peso = pesosValidos[Math.floor(Math.random() * pesosValidos.length)];
    console.log(`Ajustando peso para tipo ${tipo}: ${pesoActual} → ${peso}`);
  }

  return { descripcion, descripcion_corta, peso };
}

async function actualizarDescripciones() {
  try {
    console.log('🚀 Iniciando actualización de descripciones...');
    
    // Inicializar base de datos
    await initDb();
    
    // Abrir conexión
    const db = getDb();
    
    // 1. Agregar columna descripcion_corta si no existe
    console.log('📝 Agregando columna descripcion_corta...');
    try {
      await new Promise((resolve, reject) => {
        db.run(`ALTER TABLE reportes ADD COLUMN descripcion_corta TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      console.log('✅ Columna descripcion_corta agregada');
    } catch (err) {
      console.log('ℹ️ Columna descripcion_corta ya existe');
    }

    // 2. Obtener todos los reportes
    console.log('📊 Obteniendo todos los reportes...');
    const reportes = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM reportes ORDER BY id`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`📋 Encontrados ${reportes.length} reportes para actualizar`);

    // 3. Actualizar cada reporte
    let actualizados = 0;
    let errores = 0;

    for (const reporte of reportes) {
      try {
        const { descripcion, descripcion_corta, peso } = generarDescripcionCoherente(
          reporte.tipo, 
          reporte.peso
        );

        // Actualizar el registro
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE reportes 
             SET descripcion = ?, descripcion_corta = ?, peso = ? 
             WHERE id = ?`,
            [descripcion, descripcion_corta, peso, reporte.id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        console.log(`✅ Reporte ${reporte.id} actualizado: ${reporte.tipo} - "${descripcion_corta}"`);
        actualizados++;

      } catch (error) {
        console.error(`❌ Error actualizando reporte ${reporte.id}:`, error.message);
        errores++;
      }
    }

    // 4. Verificar resultados
    console.log('\n📊 Resumen de actualización:');
    console.log(`   ✅ Reportes actualizados: ${actualizados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   📋 Total procesados: ${reportes.length}`);

    // 5. Mostrar muestra de datos actualizados
    console.log('\n🔍 Muestra de reportes actualizados:');
    const muestra = await new Promise((resolve, reject) => {
      db.all(`SELECT id, tipo, descripcion, descripcion_corta, peso FROM reportes LIMIT 5`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    muestra.forEach(r => {
      console.log(`   ID ${r.id}: ${r.tipo} (peso:${r.peso}) - "${r.descripcion_corta}"`);
    });

    db.close();
    console.log('\n🎉 Actualización completada exitosamente!');

  } catch (error) {
    console.error('💥 Error durante la actualización:', error);
    process.exit(1);
  }
}

// Ejecutar directamente
actualizarDescripciones().then(() => {
  console.log('✨ Proceso finalizado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});

export { actualizarDescripciones };