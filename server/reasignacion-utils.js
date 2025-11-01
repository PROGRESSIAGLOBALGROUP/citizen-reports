/**
 * Constantes y utilidades para reasignación interdepartamental
 */

// Mapeo: Tipo de reporte → Departamento responsable
export const DEPENDENCIA_POR_TIPO = {
  'bache': 'obras_publicas',
  'baches': 'obras_publicas', // Variante plural (compatibilidad con datos existentes)
  'pavimento_danado': 'obras_publicas',
  'banqueta_rota': 'obras_publicas',
  'banquetas_rotas': 'obras_publicas', // Variante plural
  'alcantarilla': 'obras_publicas',
  'alcantarillas': 'obras_publicas', // Variante plural
  'alumbrado': 'servicios_publicos',
  'falta_agua': 'servicios_publicos',
  'fuga_agua': 'servicios_publicos',
  'fugas_agua': 'servicios_publicos', // Variante plural
  'basura': 'servicios_publicos',
  'limpieza': 'servicios_publicos',
  'inseguridad': 'seguridad_publica',
  'accidente': 'seguridad_publica',
  'accidentes': 'seguridad_publica', // Variante plural
  'delito': 'seguridad_publica',
  'delitos': 'seguridad_publica', // Variante plural
  'plaga': 'salud',
  'plagas': 'salud', // Variante plural
  'mascota_herida': 'salud',
  'mascotas_heridas': 'salud', // Variante plural
  'contaminacion': 'salud',
  'arbol_caido': 'medio_ambiente',
  'arboles_caidos': 'medio_ambiente', // Variante plural
  'deforestacion': 'medio_ambiente',
  'quema': 'medio_ambiente',
  'quemas': 'medio_ambiente' // Variante plural
};

// Mapeo inverso: Departamento → Tipos de reporte que maneja
export const TIPOS_POR_DEPENDENCIA = {
  'obras_publicas': ['bache', 'pavimento_danado', 'banqueta_rota', 'alcantarilla'],
  'servicios_publicos': ['alumbrado', 'falta_agua', 'fuga_agua', 'basura', 'limpieza'],
  'seguridad_publica': ['inseguridad', 'accidente', 'delito'],
  'salud': ['plaga', 'mascota_herida', 'contaminacion'],
  'medio_ambiente': ['arbol_caido', 'deforestacion', 'quema']
};

/**
 * Registra un cambio en el audit trail
 */
export function registrarCambio(db, datos) {
  return new Promise((resolve, reject) => {
    const { 
      reporte_id, 
      usuario_id, 
      tipo_cambio, 
      campo_modificado,
      valor_anterior, 
      valor_nuevo, 
      razon, 
      metadatos 
    } = datos;

    const sql = `
      INSERT INTO historial_cambios 
      (usuario_id, entidad, entidad_id, tipo_cambio, campo_modificado, valor_anterior, valor_nuevo, razon, metadatos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const metadatosStr = metadatos ? JSON.stringify(metadatos) : null;

    db.run(sql, [
      usuario_id,
      'reporte',
      reporte_id,
      tipo_cambio,
      campo_modificado,
      valor_anterior,
      valor_nuevo,
      razon,
      metadatosStr
    ], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

/**
 * Obtiene el departamento responsable de un tipo de reporte
 */
export function obtenerDependenciaPorTipo(tipo) {
  return DEPENDENCIA_POR_TIPO[tipo] || null;
}

/**
 * Obtiene los tipos de reporte que maneja un departamento
 */
export function obtenerTiposPorDependencia(dependencia) {
  return TIPOS_POR_DEPENDENCIA[dependencia] || [];
}

/**
 * Sugiere el mejor tipo de reporte para un departamento dado el tipo actual
 */
export function sugerirTipoParaDependencia(tipoActual, dependenciaNueva) {
  const tiposDisponibles = TIPOS_POR_DEPENDENCIA[dependenciaNueva] || [];
  
  // Si el tipo actual es válido para la nueva dependencia, mantenerlo
  if (tiposDisponibles.includes(tipoActual)) {
    return tipoActual;
  }
  
  // Si no, devolver el primer tipo disponible
  return tiposDisponibles[0] || tipoActual;
}
