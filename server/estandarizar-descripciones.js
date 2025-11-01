#!/usr/bin/env node
/**
 * Estandariza descripciones de reportes para separar correctamente
 * descripcion_corta (mapa público) vs descripcion (funcionarios)
 */

import { getDb } from './db.js';

// Palabras comunes a eliminar al acortar
const PALABRAS_RELLENO = [
  'en', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'por', 'con', 'sin', 'para', 'necesita', 'requiere'
];

/**
 * Genera descripción corta inteligente
 * @param {string} descripcionCompleta - Texto completo
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Versión corta optimizada
 */
function generarDescripcionCorta(descripcionCompleta, maxLength = 50) {
  if (!descripcionCompleta) return 'Sin descripción';
  
  const texto = descripcionCompleta.trim();
  
  // Si ya es corta, retornar tal cual
  if (texto.length <= maxLength) {
    return texto;
  }
  
  // Dividir en palabras
  const palabras = texto.split(/\s+/);
  
  // Filtrar palabras significativas (sustantivos, verbos, adjetivos)
  const palabrasSignificativas = palabras.filter((palabra, index) => {
    const palabraLower = palabra.toLowerCase();
    // Mantener siempre la primera palabra
    if (index === 0) return true;
    // Filtrar palabras de relleno
    return !PALABRAS_RELLENO.includes(palabraLower);
  });
  
  // Construir descripción corta tomando palabras significativas
  let corta = '';
  for (const palabra of palabrasSignificativas) {
    if ((corta + ' ' + palabra).trim().length > maxLength) {
      break;
    }
    corta += (corta ? ' ' : '') + palabra;
  }
  
  // Si quedó vacía, tomar primeras palabras sin filtro
  if (!corta) {
    corta = palabras.slice(0, 4).join(' ');
  }
  
  // Truncar si aún es muy larga
  if (corta.length > maxLength) {
    corta = corta.substring(0, maxLength - 3) + '...';
  }
  
  return corta;
}

/**
 * Enriquece descripción completa si es muy corta
 * @param {string} descripcion - Texto original
 * @param {string} tipo - Tipo de reporte
 * @param {string} ubicacion - Ubicación extraída (si existe)
 * @returns {string} - Descripción enriquecida
 */
function enriquecerDescripcion(descripcion, tipo, ubicacion) {
  let completa = descripcion.trim();
  
  // Si ya es suficientemente detallada (>80 caracteres), dejarla como está
  if (completa.length > 80) {
    return completa;
  }
  
  // Añadir contexto según el tipo
  const contextos = {
    baches: 'requiere reparación urgente para seguridad vial',
    alumbrado: 'necesita reparación para mejorar seguridad nocturna',
    agua: 'requiere atención de servicios municipales',
    limpieza: 'necesita servicio de recolección',
    seguridad: 'requiere atención de autoridades',
    parques: 'necesita mantenimiento de áreas verdes'
  };
  
  const contexto = contextos[tipo] || 'requiere atención municipal';
  
  // Si tiene ubicación, incluirla
  if (ubicacion) {
    completa += ` en ${ubicacion}. Este reporte ${contexto}.`;
  } else {
    completa += `. ${contexto.charAt(0).toUpperCase() + contexto.slice(1)}.`;
  }
  
  return completa;
}

/**
 * Extrae posible ubicación de la descripción
 * @param {string} descripcion - Texto completo
 * @returns {string|null} - Ubicación encontrada o null
 */
function extraerUbicacion(descripcion) {
  // Buscar patrones como "en Calle X", "en Av. X"
  const match = descripcion.match(/\ben\s+(Calle|Av\.|Avenida|Plaza)[^.]+/i);
  return match ? match[0].replace(/^en\s+/i, '') : null;
}

async function estandarizarDescripciones() {
  const db = getDb();
  
  console.log('🔧 Estandarizando descripciones...\n');
  
  // Obtener todos los reportes
  const reportes = await new Promise((resolve, reject) => {
    db.all('SELECT id, tipo, descripcion, descripcion_corta FROM reportes ORDER BY id', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log(`📊 Total de reportes a procesar: ${reportes.length}\n`);
  
  let actualizados = 0;
  let errores = 0;
  
  for (const reporte of reportes) {
    try {
      const { id, tipo, descripcion, descripcion_corta } = reporte;
      
      // Extraer ubicación si existe
      const ubicacion = extraerUbicacion(descripcion || descripcion_corta || '');
      
      // Usar descripcion como base si descripcion_corta está vacía o es genérica
      const textoBase = descripcion || descripcion_corta || 'Reporte sin descripción';
      
      // Generar nuevas descripciones
      const nuevaCorta = generarDescripcionCorta(textoBase, 50);
      const nuevaCompleta = enriquecerDescripcion(textoBase, tipo, ubicacion);
      
      // Actualizar solo si hay cambios significativos
      const hayCambios = 
        nuevaCorta !== descripcion_corta || 
        nuevaCompleta !== descripcion ||
        descripcion === descripcion_corta; // Casos donde son idénticas
      
      if (hayCambios) {
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE reportes 
             SET descripcion_corta = ?, descripcion = ? 
             WHERE id = ?`,
            [nuevaCorta, nuevaCompleta, id],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        
        actualizados++;
        console.log(`✅ ID ${id} (${tipo}):`);
        console.log(`   Corta: "${nuevaCorta}"`);
        console.log(`   Completa: "${nuevaCompleta.substring(0, 80)}${nuevaCompleta.length > 80 ? '...' : ''}"`);
        console.log();
      }
      
    } catch (error) {
      errores++;
      console.error(`❌ Error procesando ID ${reporte.id}:`, error.message);
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`✅ Reportes actualizados: ${actualizados}`);
  console.log(`⏭️  Reportes sin cambios: ${reportes.length - actualizados - errores}`);
  console.log(`❌ Errores: ${errores}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  if (actualizados > 0) {
    console.log('💡 Recomendación: Reinicia el servidor y recarga el navegador para ver los cambios.');
  }
  
  db.close();
}

// Ejecutar
estandarizarDescripciones().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
