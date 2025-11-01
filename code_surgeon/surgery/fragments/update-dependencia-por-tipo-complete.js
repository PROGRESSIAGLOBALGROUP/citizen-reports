/**
 * Mapeo de tipos de reporte a dependencias municipales
 * Actualizado con todos los tipos actuales (38 variantes)
 */
export const DEPENDENCIA_POR_TIPO = {
  // Obras Públicas
  'bache': 'obras_publicas',
  'baches': 'obras_publicas',  // Plural
  'pavimento_danado': 'obras_publicas',
  'banqueta_rota': 'obras_publicas',
  'banquetas_rotas': 'obras_publicas',  // Plural
  'alcantarilla': 'obras_publicas',
  'alcantarillas': 'obras_publicas',  // Plural
  
  // Servicios Públicos
  'alumbrado': 'servicios_publicos',
  'falta_agua': 'servicios_publicos',
  'fuga_agua': 'servicios_publicos',
  'fugas_agua': 'servicios_publicos',  // Plural
  'basura': 'servicios_publicos',
  'limpieza': 'servicios_publicos',
  
  // Seguridad Pública (tipos específicos)
  'inseguridad': 'seguridad_publica',
  'accidente': 'seguridad_publica',
  'accidentes': 'seguridad_publica',  // Plural
  'delito': 'seguridad_publica',
  'delitos': 'seguridad_publica',  // Plural
  
  // Salud
  'plaga': 'salud',
  'plagas': 'salud',  // Plural
  'mascota_herida': 'salud',
  'mascotas_heridas': 'salud',  // Plural
  'contaminacion': 'salud',
  
  // Medio Ambiente
  'arbol_caido': 'medio_ambiente',
  'arboles_caidos': 'medio_ambiente',  // Plural
  'deforestacion': 'medio_ambiente',
  'quema': 'medio_ambiente',
  'quemas': 'medio_ambiente',  // Plural
  
  // Tipos legacy (compatibilidad con datos históricos)
  'agua': 'agua_potable',  // Alias genérico → usar falta_agua o fuga_agua
  'parques': 'parques_jardines',  // Alias genérico → usar arbol_caido
  'seguridad': 'seguridad_publica'  // DEPRECATED → usar inseguridad, accidente o delito
};
