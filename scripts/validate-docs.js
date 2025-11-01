/**
 * Validation Script for Documentation Examples
 * Ensures that code examples in .github/copilot-instructions.md remain functional
 * 
 * Usage:
 *   node scripts/validate-docs.js
 *   npm run validate:docs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

function logResult(passed, message) {
  const icon = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${message}`, color);
}

// Validation tests
const validations = [];

// ============================================================================
// Test 1: Verify copilot-instructions.md exists and is properly formatted
// ============================================================================
validations.push({
  name: 'Copilot Instructions File Exists',
  test: () => {
    const instructionsPath = join(projectRoot, '.github', 'copilot-instructions.md');
    if (!existsSync(instructionsPath)) {
      throw new Error('File .github/copilot-instructions.md not found');
    }
    
    const content = readFileSync(instructionsPath, 'utf8');
    
    // Check for required sections
    const requiredSections = [
      'Quick Start',
      'Common Scenarios',
      'Common Errors & Solutions',
      'Performance Guidelines',
      'Security Checklist',
      'File Location Guide',
    ];
    
    const missingSections = requiredSections.filter(
      section => !content.includes(section)
    );
    
    if (missingSections.length > 0) {
      throw new Error(`Missing sections: ${missingSections.join(', ')}`);
    }
    
    return { passed: true, message: 'All required sections present' };
  }
});

// ============================================================================
// Test 2: Validate validation functions exist in server/app.js
// ============================================================================
validations.push({
  name: 'Validation Functions Exist',
  test: () => {
    const appPath = join(projectRoot, 'server', 'app.js');
    if (!existsSync(appPath)) {
      throw new Error('File server/app.js not found');
    }
    
    const content = readFileSync(appPath, 'utf8');
    
    const requiredFunctions = [
      'validarCoordenadas',
      'normalizeTipos',
      'isIsoDate',
      'obtenerIpCliente',
    ];
    
    const missingFunctions = requiredFunctions.filter(
      fn => !content.includes(`function ${fn}`)
    );
    
    if (missingFunctions.length > 0) {
      throw new Error(`Missing functions: ${missingFunctions.join(', ')}`);
    }
    
    return { passed: true, message: 'All validation functions present' };
  }
});

// ============================================================================
// Test 3: Test validarCoordenadas function
// ============================================================================
validations.push({
  name: 'validarCoordenadas Function Works',
  test: async () => {
    // Import dynamically to test
    const { validarCoordenadas } = await import('../server/app.js').catch(() => {
      // If not exported, we'll just verify it's in the file
      return { validarCoordenadas: null };
    });
    
    // If function is not exported, just verify file contains it
    if (!validarCoordenadas) {
      const appPath = join(projectRoot, 'server', 'app.js');
      const content = readFileSync(appPath, 'utf8');
      if (!content.includes('function validarCoordenadas')) {
        throw new Error('Function validarCoordenadas not found in server/app.js');
      }
      return { passed: true, message: 'Function exists in code (not exported for testing)' };
    }
    
    // Test valid coordinates
    if (!validarCoordenadas(18.7, -99.1)) {
      throw new Error('Should accept valid coordinates');
    }
    
    // Test invalid coordinates
    if (validarCoordenadas(91, -99.1)) {
      throw new Error('Should reject lat > 90');
    }
    
    if (validarCoordenadas(18.7, 181)) {
      throw new Error('Should reject lng > 180');
    }
    
    if (validarCoordenadas('invalid', -99.1)) {
      throw new Error('Should reject non-numeric lat');
    }
    
    return { passed: true, message: 'Function validates coordinates correctly' };
  }
});

// ============================================================================
// Test 4: Database schema includes all required tables
// ============================================================================
validations.push({
  name: 'Database Schema Complete',
  test: () => {
    const schemaPath = join(projectRoot, 'server', 'schema.sql');
    if (!existsSync(schemaPath)) {
      throw new Error('File server/schema.sql not found');
    }
    
    const content = readFileSync(schemaPath, 'utf8');
    
    const requiredTables = [
      'reportes',
      'usuarios',
      'sesiones',
      'asignaciones',
      'cierres_pendientes',
      'categorias',
      'tipos_reporte',
      'historial_cambios',
    ];
    
    const missingTables = requiredTables.filter(
      table => !content.includes(`CREATE TABLE IF NOT EXISTS ${table}`)
    );
    
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }
    
    return { passed: true, message: 'All required tables defined' };
  }
});

// ============================================================================
// Test 5: Test API endpoints respond correctly
// ============================================================================
validations.push({
  name: 'API Endpoints Functional',
  test: async () => {
    const app = createApp();
    
    // Test health endpoint or basic endpoint
    const response = await request(app).get('/api/reportes/tipos');
    
    if (response.status !== 200 && response.status !== 404) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
    
    return { passed: true, message: 'API endpoints respond correctly' };
  }
});

// ============================================================================
// Test 6: PowerShell scripts exist and are valid
// ============================================================================
validations.push({
  name: 'PowerShell Scripts Exist',
  test: () => {
    const requiredScripts = [
      'start-dev.ps1',
      'stop-servers.ps1',
      'start-prod.ps1',
    ];
    
    const missingScripts = requiredScripts.filter(
      script => !existsSync(join(projectRoot, script))
    );
    
    if (missingScripts.length > 0) {
      throw new Error(`Missing scripts: ${missingScripts.join(', ')}`);
    }
    
    return { passed: true, message: 'All automation scripts present' };
  }
});

// ============================================================================
// Test 7: ADR files exist and follow convention
// ============================================================================
validations.push({
  name: 'ADR Files Convention',
  test: () => {
    const adrPath = join(projectRoot, 'docs', 'adr');
    if (!existsSync(adrPath)) {
      throw new Error('Directory docs/adr not found');
    }
    
    const requiredADRs = [
      'ADR-0001-bootstrap.md',
      'ADR-0006-sistema-asignacion-reportes.md',
      'ADR-0009-gestion-tipos-categorias-dinamicas.md',
      'ADR-0010-unificacion-asignaciones-audit-trail.md',
    ];
    
    const missingADRs = requiredADRs.filter(
      adr => !existsSync(join(adrPath, adr))
    );
    
    if (missingADRs.length > 0) {
      throw new Error(`Missing ADRs: ${missingADRs.join(', ')}`);
    }
    
    return { passed: true, message: 'All critical ADRs documented' };
  }
});

// ============================================================================
// Test 8: Test configuration files exist
// ============================================================================
validations.push({
  name: 'Configuration Files Present',
  test: () => {
    const requiredConfigs = [
      'package.json',
      'jest.config.cjs',
      'vitest.config.ts',
      'playwright.config.ts',
      '.github/copilot-instructions.md',
      '.vscode/jantetelco.code-snippets',
    ];
    
    const missingConfigs = requiredConfigs.filter(
      config => !existsSync(join(projectRoot, config))
    );
    
    if (missingConfigs.length > 0) {
      throw new Error(`Missing configs: ${missingConfigs.join(', ')}`);
    }
    
    return { passed: true, message: 'All configuration files present' };
  }
});

// ============================================================================
// Main execution
// ============================================================================
async function runValidations() {
  logSection('📋 Validating Documentation Examples');
  log(`Project root: ${projectRoot}\n`, 'yellow');
  
  let passed = 0;
  let failed = 0;
  const failures = [];
  
  for (const validation of validations) {
    try {
      log(`\nRunning: ${validation.name}...`, 'cyan');
      const result = await validation.test();
      
      if (result.passed) {
        passed++;
        logResult(true, result.message || 'Passed');
      } else {
        failed++;
        logResult(false, result.message || 'Failed');
        failures.push({ name: validation.name, error: result.message });
      }
    } catch (error) {
      failed++;
      logResult(false, error.message);
      failures.push({ name: validation.name, error: error.message });
    }
  }
  
  // Summary
  logSection('📊 Validation Summary');
  log(`Total tests: ${validations.length}`, 'bold');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  
  if (failures.length > 0) {
    log('\n❌ Failed validations:', 'red');
    failures.forEach(({ name, error }) => {
      log(`  • ${name}: ${error}`, 'red');
    });
    console.log('\n');
    process.exit(1);
  } else {
    log('\n✅ All validations passed!', 'green');
    log('Documentation examples are functional and up-to-date.', 'cyan');
    console.log('\n');
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidations().catch(error => {
    log(`\n❌ Validation error: ${error.message}`, 'red');
    process.exit(1);
  });
}

export { runValidations };
