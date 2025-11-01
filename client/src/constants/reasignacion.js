/**
 * Constantes para reasignación interdepartamental
 * Compartidas entre frontend y backend
 */

export const DEPENDENCIA_POR_TIPO = {
  'bache': 'obras_publicas',
  'baches': 'obras_publicas', // Variante plural
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

export const TIPOS_POR_DEPENDENCIA = {
  'obras_publicas': ['bache', 'pavimento_danado', 'banqueta_rota', 'alcantarilla'],
  'servicios_publicos': ['alumbrado', 'falta_agua', 'fuga_agua', 'basura', 'limpieza'],
  'seguridad_publica': ['inseguridad', 'accidente', 'delito'],
  'salud': ['plaga', 'mascota_herida', 'contaminacion'],
  'medio_ambiente': ['arbol_caido', 'deforestacion', 'quema']
};

export const NOMBRES_DEPENDENCIAS = {
  'obras_publicas': 'Obras Públicas',
  'servicios_publicos': 'Servicios Públicos',
  'seguridad_publica': 'Seguridad Pública',
  'salud': 'Salud',
  'medio_ambiente': 'Medio Ambiente',
  'administracion': 'Administración'
};

export const NOMBRES_TIPOS = {
  'bache': 'Bache',
  'baches': 'Baches', // Variante plural
  'pavimento_danado': 'Pavimento Dañado',
  'banqueta_rota': 'Banqueta Rota',
  'banquetas_rotas': 'Banquetas Rotas', // Variante plural
  'alcantarilla': 'Alcantarilla',
  'alcantarillas': 'Alcantarillas', // Variante plural
  'alumbrado': 'Alumbrado Público',
  'falta_agua': 'Falta de Agua',
  'fuga_agua': 'Fuga de Agua',
  'fugas_agua': 'Fugas de Agua', // Variante plural
  'basura': 'Basura',
  'limpieza': 'Limpieza',
  'inseguridad': 'Inseguridad',
  'accidente': 'Accidente',
  'accidentes': 'Accidentes', // Variante plural
  'delito': 'Delito',
  'delitos': 'Delitos', // Variante plural
  'plaga': 'Plaga',
  'plagas': 'Plagas', // Variante plural
  'mascota_herida': 'Mascota Herida',
  'mascotas_heridas': 'Mascotas Heridas', // Variante plural
  'contaminacion': 'Contaminación',
  'arbol_caido': 'Árbol Caído',
  'arboles_caidos': 'Árboles Caídos', // Variante plural
  'deforestacion': 'Deforestación',
  'quema': 'Quema',
  'quemas': 'Quemas' // Variante plural
};
