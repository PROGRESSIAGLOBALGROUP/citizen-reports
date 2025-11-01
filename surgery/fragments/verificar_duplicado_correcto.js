/**
 * Verifica si un reporte es potencialmente duplicado según reglas de negocio estrictas
 * REGLA: Solo se considera duplicado si es el MISMO dispositivo, MISMO tipo Y MISMA ubicación (±10m)
 * 
 * @param {object} db - Instancia de base de datos SQLite
 * @param {object} datos - Datos del nuevo reporte {lat, lng, tipo, fingerprint, ip_cliente}
 * @returns {Promise<object>} {esNuevo: boolean, advertencias: string[], reportesSimilares: number}
 */
function verificarPosibleDuplicado(db, datos) {
  return new Promise((resolve) => {
    const { lat, lng, tipo, fingerprint } = datos;
    
    // Si no hay fingerprint, no podemos verificar duplicados por dispositivo
    if (!fingerprint) {
      resolve({ esNuevo: true, advertencias: [] });
      return;
    }
    
    // Buscar reportes del MISMO dispositivo (fingerprint) en las últimas 24 horas
    // Solo considera duplicado si es: MISMO tipo + ubicación muy cercana (±10 metros ≈ 0.0001 grados)
    const sql = `
      SELECT id, tipo, lat, lng, creado_en,
             ABS(lat - ?) + ABS(lng - ?) as distancia
      FROM reportes 
      WHERE datetime(creado_en) > datetime('now', '-24 hours')
        AND fingerprint = ?
        AND fingerprint IS NOT NULL
        AND tipo = ?
        AND ABS(lat - ?) < 0.0001
        AND ABS(lng - ?) < 0.0001
      ORDER BY datetime(creado_en) DESC
      LIMIT 1
    `;
    
    db.all(sql, [lat, lng, fingerprint, tipo, lat, lng], (err, rows) => {
      if (err) {
        console.error('Error verificando duplicados:', err);
        resolve({ esNuevo: true, advertencias: [] });
        return;
      }
      
      const advertencias = [];
      let esNuevo = true;
      
      if (rows && rows.length > 0) {
        const reporte = rows[0];
        const tiempoMinutos = Math.round((Date.now() - new Date(reporte.creado_en).getTime()) / (1000 * 60));
        const distanciaMetros = Math.round(reporte.distancia * 111000); // Aproximación: 1 grado ≈ 111km
        
        // Solo marcar como duplicado si es muy reciente (menos de 5 minutos)
        if (tiempoMinutos < 5) {
          esNuevo = false;
          advertencias.push(`Reporte idéntico (mismo tipo y ubicación) hace ${tiempoMinutos} ${tiempoMinutos === 1 ? 'minuto' : 'minutos'}`);
        } else {
          // Solo advertir, pero permitir el reporte
          advertencias.push(`Reportaste un ${tipo} similar en esta ubicación hace ${tiempoMinutos} minutos`);
        }
      }
      
      resolve({ 
        esNuevo, 
        advertencias, 
        reportesSimilares: rows?.length || 0 
      });
    });
  });
}