#!/usr/bin/env node
/**
 * VALIDADOR DE CONEXIONES - Verifica recableado correcto
 * Sin tocar nada, solo diagnóstico
 * 
 * Valida:
 * 1. Sistema de módulos consistente (ESM vs CommonJS)
 * 2. Todos los imports están resueltos
 * 3. Todas las rutas están montadas
 * 4. Todas las exportaciones están disponibles
 * 5. No hay conexiones rotas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.join(__dirname, '../server');

// Resultados
const results = {
  errors: [],
  warnings: [],
  ok: [],
  summary: {}
};

/**
 * 1. VALIDAR SISTEMA DE MÓDULOS
 */
console.log('🔍 1. VALIDANDO SISTEMA DE MÓDULOS...');
const modulesDir = path.join(serverDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(modulesDir, 'utf-8'));

if (packageJson.type !== 'module') {
  results.errors.push('❌ package.json no tiene "type": "module"');
} else {
  results.ok.push('✅ package.json es ESM');
}

// Escanear archivos JS
const jsFiles = fs.readdirSync(serverDir)
  .filter(f => f.endsWith('.js') && !f.startsWith('.'))
  .map(f => path.join(serverDir, f));

const commonJsFiles = [];
const esmFiles = [];

for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const hasRequire = /^\s*const\s+.*=\s*require\s*\(|module\.exports/m.test(content);
  const hasImport = /^\s*import\s+/m.test(content);
  
  if (hasRequire && !hasImport) {
    commonJsFiles.push(path.basename(file));
  } else if (hasImport || hasRequire) {
    esmFiles.push(path.basename(file));
  }
}

if (commonJsFiles.length > 0) {
  results.errors.push(`❌ Archivos CommonJS (deben ser ESM): ${commonJsFiles.join(', ')}`);
} else {
  results.ok.push('✅ Todos los archivos son ESM');
}

results.summary.commonJsFiles = commonJsFiles;
results.summary.esmFiles = esmFiles.length;

/**
 * 2. VALIDAR IMPORTS EN app.js
 */
console.log('🔍 2. VALIDANDO IMPORTS EN app.js...');
const appJsPath = path.join(serverDir, 'app.js');
const appContent = fs.readFileSync(appJsPath, 'utf-8');

const importMatches = appContent.match(/import\s+(?:{[^}]*}|.*?)\s+from\s+['"]([^'"]+)['"]/g) || [];
const expectedFiles = new Set();

for (const match of importMatches) {
  const filePath = match.match(/from\s+['"]([^'"]+)['"]/)[1];
  if (!filePath.startsWith('express') && !filePath.startsWith('cors') && filePath.includes('./')) {
    const cleanPath = filePath.replace('./', '');
    expectedFiles.add(cleanPath);
  }
}

const missingFiles = [];
for (const file of expectedFiles) {
  const fullPath = path.join(serverDir, file);
  if (!fs.existsSync(fullPath)) {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  results.errors.push(`❌ Archivos importados pero NO existen: ${missingFiles.join(', ')}`);
} else {
  results.ok.push(`✅ Todos los imports en app.js existen (${expectedFiles.size} archivos)`);
}

results.summary.imports = Array.from(expectedFiles);

/**
 * 3. VALIDAR EXPORTS
 */
console.log('🔍 3. VALIDANDO EXPORTS...');
const routeFiles = [
  'auth_routes.js',
  'reportes_auth_routes.js',
  'usuarios-routes.js',
  'asignaciones-routes.js',
  'tipos-routes.js',
  'admin-routes.js',
  'dependencias-routes.js',
  'whitelabel-routes.js',
  'webhook-routes.js'
];

const exportIssues = [];
for (const file of routeFiles) {
  const filePath = path.join(serverDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const hasExports = /export\s+(function|const|class|default|async|{\s*\w+)/m.test(content);
    
    if (!hasExports) {
      exportIssues.push(`❌ ${file} no tiene exports`);
    } else {
      results.ok.push(`✅ ${file} tiene exports`);
    }
  }
}

if (exportIssues.length > 0) {
  results.errors.push(...exportIssues);
}

/**
 * 4. VALIDAR MONTAJE DE RUTAS EN app.js
 */
console.log('🔍 4. VALIDANDO RUTAS MONTADAS...');
const routesUsed = [
  'configurarRutasAuth',
  'configurarRutasReportes',
  'usuariosRoutes',
  'asignacionesRoutes',
  'tiposRoutes',
  'adminRoutes',
  'dependenciasRoutes',
  'whitelabelRoutes',
  'webhookRoutes'
];

const usageIssues = [];
for (const route of routesUsed) {
  // Buscar que se llame en app.js (excepto import)
  const callPattern = new RegExp(`${route}\\.(\\w+)|app\\.use\\('.*?',\\s*${route}\\)|${route}\\(app\\)`, 'm');
  if (!callPattern.test(appContent)) {
    usageIssues.push(`⚠️  ${route} importado pero NO usado`);
  } else {
    results.ok.push(`✅ ${route} está siendo usado`);
  }
}

if (usageIssues.length > 0) {
  results.warnings.push(...usageIssues);
}

/**
 * 5. VALIDAR DATABASE CONNECTION
 */
console.log('🔍 5. VALIDANDO CONEXIÓN A DATABASE...');
const dbJsPath = path.join(serverDir, 'db.js');
const dbContent = fs.readFileSync(dbJsPath, 'utf-8');

if (!/export\s+function\s+getDb/m.test(dbContent)) {
  results.errors.push('❌ db.js no exporta función getDb()');
} else {
  results.ok.push('✅ db.js exporta getDb()');
}

if (!/export\s+function\s+initDb/m.test(dbContent)) {
  results.errors.push('❌ db.js no exporta función initDb()');
} else {
  results.ok.push('✅ db.js exporta initDb()');
}

// Verificar que getDb está siendo usado en todas las routes
const routeFilesToCheck = routeFiles.filter(f => f !== 'webhook-routes.js');
const getDbUsageIssues = [];

for (const file of routeFilesToCheck) {
  const filePath = path.join(serverDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Si tiene export function (route handler), debe tener getDb
    if (/export\s+function\s+\w+.*\(req,\s*res\)/m.test(content)) {
      if (!/getDb\(\)/m.test(content) && !/from\s+['"]\.\/db\.js['"]/.test(content)) {
        getDbUsageIssues.push(`⚠️  ${file} tiene routes pero NO importa getDb()`);
      }
    }
  }
}

if (getDbUsageIssues.length > 0) {
  results.warnings.push(...getDbUsageIssues);
} else {
  results.ok.push('✅ Todos los route files importan getDb()');
}

/**
 * 6. VALIDAR MIDDLEWARE
 */
console.log('🔍 6. VALIDANDO MIDDLEWARE...');
const middlewareExpected = [
  'requiereAuth',
  'requiereRol',
  'DEPENDENCIA_POR_TIPO'
];

const authMiddlewarePath = path.join(serverDir, 'auth_middleware.js');
const authMiddlewareContent = fs.readFileSync(authMiddlewarePath, 'utf-8');

for (const middleware of middlewareExpected) {
  const exportPattern = new RegExp(`export\\s+(?:function|const)\\s+${middleware}|export\\s+const\\s+${middleware}`);
  if (!exportPattern.test(authMiddlewareContent)) {
    results.errors.push(`❌ auth_middleware.js no exporta ${middleware}`);
  } else {
    results.ok.push(`✅ auth_middleware.js exporta ${middleware}`);
  }
}

/**
 * 7. VALIDAR VERSIÓN DE NODE Y NPM
 */
console.log('🔍 7. VALIDANDO ENTORNO...');
const nodeVersion = process.version;
results.ok.push(`✅ Node.js versión: ${nodeVersion}`);

/**
 * REPORTE FINAL
 */
console.log('\n' + '='.repeat(70));
console.log('📊 REPORTE DE VALIDACIÓN DE CONEXIONES');
console.log('='.repeat(70) + '\n');

console.log(`✅ CORRECTOS: ${results.ok.length}`);
results.ok.forEach(msg => console.log(`   ${msg}`));

if (results.warnings.length > 0) {
  console.log(`\n⚠️  ADVERTENCIAS: ${results.warnings.length}`);
  results.warnings.forEach(msg => console.log(`   ${msg}`));
}

if (results.errors.length > 0) {
  console.log(`\n❌ ERRORES: ${results.errors.length}`);
  results.errors.forEach(msg => console.log(`   ${msg}`));
}

console.log('\n' + '='.repeat(70));
console.log('📈 RESUMEN');
console.log('='.repeat(70));
console.log(`Archivos CommonJS (deben ser ESM): ${results.summary.commonJsFiles?.length || 0}`);
if (results.summary.commonJsFiles?.length > 0) {
  console.log(`  → ${results.summary.commonJsFiles.join(', ')}`);
}
console.log(`Archivos ESM escaneados: ${results.summary.esmFiles || 0}`);
console.log(`Imports mapeados: ${results.summary.imports?.length || 0}`);

if (results.errors.length === 0) {
  console.log('\n🟢 ESTADO: ✅ TODAS LAS CONEXIONES CORRECTAS');
  process.exit(0);
} else {
  console.log('\n🔴 ESTADO: ❌ ENCONTRADOS ERRORES DE CONEXIÓN');
  process.exit(1);
}
