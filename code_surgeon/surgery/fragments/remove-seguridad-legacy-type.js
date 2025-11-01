/**
 * Obtiene solo los tipos principales para mostrar en formularios
 * (sin duplicados plurales, sin tipos deprecated)
 * @returns {string[]} Array de tipos principales
 */
export function getTiposPrincipales() {
  // Lista de tipos principales (sin plurales duplicados ni deprecated)
  return [
    // Obras Públicas
    'bache',
    'pavimento_danado',
    'banqueta_rota',
    'alcantarilla',
    
    // Servicios Públicos
    'alumbrado',
    'falta_agua',
    'fuga_agua',
    'basura',
    'limpieza',
    
    // Seguridad Pública (tipos específicos)
    'inseguridad',  // Percepción de inseguridad, falta de vigilancia
    'accidente',    // Accidentes viales o de tránsito
    'delito',       // Robos, vandalismo, actividades delictivas
    
    // Salud
    'plaga',
    'mascota_herida',
    'contaminacion',
    
    // Medio Ambiente
    'arbol_caido',
    'deforestacion',
    'quema',
    
    // Tipos legacy para compatibilidad con datos históricos
    'agua',    // Alias para agua/drenaje (usar falta_agua o fuga_agua en nuevos reportes)
    'parques'  // Alias para parques/jardines (usar arbol_caido en nuevos reportes)
    // NOTA: 'seguridad' removido - usar tipos específicos (inseguridad, accidente, delito)
  ];
}
