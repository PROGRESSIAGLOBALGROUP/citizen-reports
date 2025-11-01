/**
 * Información de tipos de reportes con íconos y colores
 * Centralizado para consistencia en toda la aplicación
 */

export const TIPOS_INFO = {
  // Obras Públicas
  'bache': { nombre: 'Bache', icono: '🛣️', color: '#8b5cf6' },
  'baches': { nombre: 'Baches', icono: '🛣️', color: '#8b5cf6' },
  'pavimento_danado': { nombre: 'Pavimento Dañado', icono: '🚧', color: '#7c3aed' },
  'banqueta_rota': { nombre: 'Banqueta Rota', icono: '🚶', color: '#a855f7' },
  'banquetas_rotas': { nombre: 'Banquetas Rotas', icono: '🚶', color: '#a855f7' },
  'alcantarilla': { nombre: 'Alcantarilla', icono: '🕳️', color: '#9333ea' },
  'alcantarillas': { nombre: 'Alcantarillas', icono: '🕳️', color: '#9333ea' },
  
  // Servicios Públicos
  'alumbrado': { nombre: 'Alumbrado Público', icono: '💡', color: '#f59e0b' },
  'falta_agua': { nombre: 'Falta de Agua', icono: '💧', color: '#3b82f6' },
  'fuga_agua': { nombre: 'Fuga de Agua', icono: '💦', color: '#2563eb' },
  'fugas_agua': { nombre: 'Fugas de Agua', icono: '💦', color: '#2563eb' },
  'basura': { nombre: 'Basura', icono: '🗑️', color: '#10b981' },
  'limpieza': { nombre: 'Limpieza', icono: '🧹', color: '#059669' },
  
  // Seguridad Pública
  'inseguridad': { nombre: 'Inseguridad', icono: '🚨', color: '#ef4444' },
  'accidente': { nombre: 'Accidente', icono: '🚗', color: '#dc2626' },
  'accidentes': { nombre: 'Accidentes', icono: '🚗', color: '#dc2626' },
  'delito': { nombre: 'Delito', icono: '🚔', color: '#b91c1c' },
  'delitos': { nombre: 'Delitos', icono: '🚔', color: '#b91c1c' },
  
  // Salud
  'plaga': { nombre: 'Plaga', icono: '🦟', color: '#8b5cf6' },
  'plagas': { nombre: 'Plagas', icono: '🦟', color: '#8b5cf6' },
  'mascota_herida': { nombre: 'Mascota Herida', icono: '🐕', color: '#a855f7' },
  'mascotas_heridas': { nombre: 'Mascotas Heridas', icono: '🐕', color: '#a855f7' },
  'contaminacion': { nombre: 'Contaminación', icono: '☣️', color: '#7c3aed' },
  
  // Medio Ambiente
  'arbol_caido': { nombre: 'Árbol Caído', icono: '🌳', color: '#84cc16' },
  'arboles_caidos': { nombre: 'Árboles Caídos', icono: '🌳', color: '#84cc16' },
  'deforestacion': { nombre: 'Deforestación', icono: '🪓', color: '#65a30d' },
  'quema': { nombre: 'Quema', icono: '🔥', color: '#ca8a04' },
  'quemas': { nombre: 'Quemas', icono: '🔥', color: '#ca8a04' },
  
  // Tipos legacy (compatibilidad con datos antiguos)
  'agua': { nombre: 'Agua y Drenaje', icono: '💧', color: '#3b82f6' },
  'parques': { nombre: 'Parques y Jardines', icono: '🌳', color: '#84cc16' },
  'seguridad': { nombre: 'Seguridad Ciudadana', icono: '🚔', color: '#ef4444' }
};

/**
 * Obtiene la información de un tipo de reporte
 * @param {string} tipo - El tipo de reporte
 * @returns {object} Objeto con nombre, icono y color
 */
export function getTipoInfo(tipo) {
  return TIPOS_INFO[tipo] || { 
    nombre: tipo, 
    icono: '📍', 
    color: '#6b7280' 
  };
}

/**
 * Obtiene todos los tipos disponibles (incluye plurales)
 * @returns {string[]} Array de tipos
 */
export function getTiposDisponibles() {
  return Object.keys(TIPOS_INFO);
}

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
    
    // Servicios Públicos (mantenimiento general)
    'alumbrado',
    'basura',
    'limpieza',
    
    // Agua Potable (red hidráulica especializada)
    'falta_agua',  // Problemas de suministro
    'fuga_agua',   // Problemas de tubería
    
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
    
    // Tipo legacy para compatibilidad con datos históricos
    'parques'  // Alias para parques/jardines (usar arbol_caido en nuevos reportes)
    // NOTAS:
    // - 'seguridad' removido → usar inseguridad, accidente o delito
    // - 'agua' removido → usar falta_agua o fuga_agua (específicos)
  ];
}
