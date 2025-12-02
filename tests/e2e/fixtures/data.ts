/**
 * E2E Test Fixtures - Sistema centralizado de datos de prueba
 * 
 * Este módulo proporciona:
 * - Usuarios de prueba con credenciales
 * - Reportes de ejemplo para diferentes escenarios
 * - Helpers para setup/teardown de datos
 * - Constantes reutilizables
 * 
 * Uso:
 *   import { fixtures, helpers } from './fixtures';
 */

// ============================================================================
// USUARIOS DE PRUEBA
// Estos IDs coinciden con la BD e2e.db inicializada
// ============================================================================

export const usuarios = {
  admin: {
    email: 'admin@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'Administrador del Sistema',
    rol: 'admin' as const,
    dependencia: 'administracion',
    id: 1
  },
  
  supervisorObras: {
    email: 'supervisor.obras@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'Supervisor Obras Públicas',
    rol: 'supervisor' as const,
    dependencia: 'obras_publicas',
    id: 2
  },
  
  funcionarioObras1: {
    email: 'func.obras1@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'Juan Pérez - Obras',
    rol: 'funcionario' as const,
    dependencia: 'obras_publicas',
    id: 3
  },
  
  supervisorServicios: {
    email: 'supervisor.servicios@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'Supervisora Servicios Públicos',
    rol: 'supervisor' as const,
    dependencia: 'servicios_publicos',
    id: 4
  },
  
  funcionarioServicios1: {
    email: 'func.servicios1@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'María López - Servicios',
    rol: 'funcionario' as const,
    dependencia: 'servicios_publicos',
    id: 5
  },
  
  funcionarioSeguridad1: {
    email: 'func.seguridad1@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'Carlos Ramírez - Seguridad',
    rol: 'funcionario' as const,
    dependencia: 'seguridad_publica',
    id: 6
  },
  
  supervisorParques: {
    email: 'supervisor.parques@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'Parkeador',
    rol: 'supervisor' as const,
    dependencia: 'parques_jardines',
    id: 7
  },
  
  funcionarioParques1: {
    email: 'func.parques1@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'Func. Parques',
    rol: 'funcionario' as const,
    dependencia: 'parques_jardines',
    id: 8
  }
};

// Alias para acceso rápido
export const ADMIN = usuarios.admin;
export const SUPERVISOR_OBRAS = usuarios.supervisorObras;
export const SUPERVISOR_SERVICIOS = usuarios.supervisorServicios;
export const FUNC_OBRAS_1 = usuarios.funcionarioObras1;
export const FUNC_SERVICIOS_1 = usuarios.funcionarioServicios1;
export const FUNC_SEGURIDAD_1 = usuarios.funcionarioSeguridad1;
export const SUPERVISOR_PARQUES = usuarios.supervisorParques;
export const FUNC_PARQUES_1 = usuarios.funcionarioParques1;

// ============================================================================
// TIPOS DE REPORTE
// ============================================================================

export const tiposReporte = {
  bache: {
    tipo: 'bache',
    nombre: 'Bache',
    icono: '🕳️',
    dependencia: 'obras_publicas',
    categoria: 'infraestructura'
  },
  alumbrado: {
    tipo: 'alumbrado',
    nombre: 'Alumbrado Público',
    icono: '💡',
    dependencia: 'servicios_publicos',
    categoria: 'servicios'
  },
  agua: {
    tipo: 'agua',
    nombre: 'Fuga de Agua',
    icono: '💧',
    dependencia: 'agua_potable',
    categoria: 'servicios'
  },
  basura: {
    tipo: 'basura',
    nombre: 'Basura Acumulada',
    icono: '🗑️',
    dependencia: 'servicios_publicos',
    categoria: 'limpieza'
  },
  banqueta: {
    tipo: 'banqueta',
    nombre: 'Banqueta Dañada',
    icono: '🚶',
    dependencia: 'obras_publicas',
    categoria: 'infraestructura'
  }
};

// ============================================================================
// UBICACIONES DE PRUEBA (Jantetelco, Morelos)
// ============================================================================

export const ubicaciones = {
  centro: {
    lat: 18.7095,
    lng: -98.7792,
    colonia: 'Centro',
    codigo_postal: '62935',
    municipio: 'Jantetelco',
    estado: 'Morelos',
    descripcion: 'Centro de Jantetelco'
  },
  
  zocalo: {
    lat: 18.7100,
    lng: -98.7785,
    colonia: 'Centro',
    codigo_postal: '62935',
    municipio: 'Jantetelco',
    estado: 'Morelos',
    descripcion: 'Zócalo principal'
  },
  
  chalcatzingo: {
    lat: 18.6772,
    lng: -98.7708,
    colonia: 'Chalcatzingo',
    codigo_postal: '62940',
    municipio: 'Jantetelco',
    estado: 'Morelos',
    descripcion: 'Zona arqueológica Chalcatzingo'
  },
  
  amayuca: {
    lat: 18.7333,
    lng: -98.7500,
    colonia: 'Amayuca',
    codigo_postal: '62938',
    municipio: 'Jantetelco',
    estado: 'Morelos',
    descripcion: 'Comunidad de Amayuca'
  }
};

// ============================================================================
// REPORTES PREDEFINIDOS PARA TESTS
// ============================================================================

export const reportesPredefinidos = {
  bacheEnCentro: {
    tipo: 'bache',
    descripcion: 'Bache grande en la calle principal del centro',
    descripcion_corta: 'Bache peligroso',
    lat: ubicaciones.centro.lat,
    lng: ubicaciones.centro.lng,
    colonia: ubicaciones.centro.colonia,
    codigo_postal: ubicaciones.centro.codigo_postal,
    municipio: ubicaciones.centro.municipio,
    estado_geo: ubicaciones.centro.estado,
    peso: 4,
    estado: 'pendiente'
  },
  
  alumbradoZocalo: {
    tipo: 'alumbrado',
    descripcion: 'Lámpara fundida frente al zócalo, zona oscura peligrosa',
    descripcion_corta: 'Lámpara sin funcionar',
    lat: ubicaciones.zocalo.lat,
    lng: ubicaciones.zocalo.lng,
    colonia: ubicaciones.zocalo.colonia,
    codigo_postal: ubicaciones.zocalo.codigo_postal,
    municipio: ubicaciones.zocalo.municipio,
    estado_geo: ubicaciones.zocalo.estado,
    peso: 3,
    estado: 'pendiente'
  },
  
  fugaAgua: {
    tipo: 'agua',
    descripcion: 'Fuga de agua potable en esquina, desperdicio significativo',
    descripcion_corta: 'Fuga de agua',
    lat: ubicaciones.centro.lat,
    lng: ubicaciones.centro.lng,
    colonia: ubicaciones.centro.colonia,
    codigo_postal: ubicaciones.centro.codigo_postal,
    municipio: ubicaciones.centro.municipio,
    estado_geo: ubicaciones.centro.estado,
    peso: 5,
    estado: 'pendiente'
  },
  
  basuraAcumulada: {
    tipo: 'basura',
    descripcion: 'Basura acumulada en terreno baldío, malos olores',
    descripcion_corta: 'Basura en terreno',
    lat: ubicaciones.amayuca.lat,
    lng: ubicaciones.amayuca.lng,
    colonia: ubicaciones.amayuca.colonia,
    codigo_postal: ubicaciones.amayuca.codigo_postal,
    municipio: ubicaciones.amayuca.municipio,
    estado_geo: ubicaciones.amayuca.estado,
    peso: 3,
    estado: 'pendiente'
  }
};

// ============================================================================
// ESTADOS DE REPORTE
// ============================================================================

export const estadosReporte = {
  pendiente: 'pendiente',
  enProceso: 'en_proceso',
  cerrado: 'cerrado'
};

// ============================================================================
// TIPOS DE NOTAS DE TRABAJO
// ============================================================================

export const tiposNota = {
  observacion: 'observacion',
  avance: 'avance',
  incidente: 'incidente',
  resolucion: 'resolucion'
};

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

export const config = {
  apiUrl: process.env.API_URL || 'http://127.0.0.1:4000',
  frontendUrl: process.env.FRONTEND_URL || 'http://127.0.0.1:4000',
  splashWaitTime: 6000, // ms para esperar el splash screen
  defaultTimeout: 30000
};

// ============================================================================
// TIPOS
// ============================================================================

export interface Usuario {
  email: string;
  password: string;
  nombre: string;
  rol: 'admin' | 'supervisor' | 'funcionario';
  dependencia: string;
  id: number;
}

export interface Reporte {
  tipo: string;
  descripcion: string;
  descripcion_corta: string;
  lat: number;
  lng: number;
  colonia?: string;
  codigo_postal?: string;
  municipio?: string;
  estado_ubicacion?: string;
  peso: number;
  estado?: string;
}

export interface AuthResult {
  token: string;
  usuario: Usuario;
  expiraEn: string;
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export const fixtures = {
  usuarios,
  tiposReporte,
  ubicaciones,
  reportesPredefinidos,
  estadosReporte,
  tiposNota,
  config
};

export default fixtures;
