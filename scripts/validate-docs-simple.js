/**
 * Simplified Documentation Validation Script
 * Validates structure and content without running server code
 * 
 * Usage:
 *   node scripts/validate-docs-simple.js
 *   npm run validate:docs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync, readdirSync } from 'fs';

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
// Test 1: Copilot instructions file structure
// ============================================================================
validations.push({
  name: 'Copilot Instructions File',
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
      'Example: Adding a New Endpoint',
    ];
    
    const missingSections = requiredSections.filter(
      section => !content.includes(section)
    );
    
    if (missingSections.length > 0) {
      throw new Error(`Missing sections: ${missingSections.join(', ')}`);
    }
    
    const lineCount = content.split('\n').length;
    return { passed: true, message: `All sections present (${lineCount} lines)` };
  }
});

// ============================================================================
// Test 2: Validation functions exist in server/app.js
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
    
    return { passed: true, message: 'All validation functions present in code' };
  }
});

// ============================================================================
// Test 3: Database schema completeness
// ============================================================================
validations.push({
  name: 'Database Schema',
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
      table => !content.includes(`CREATE TABLE ${table}`) && 
                !content.includes(`CREATE TABLE IF NOT EXISTS ${table}`)
    );
    
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }
    
    return { passed: true, message: `All ${requiredTables.length} required tables defined` };
  }
});

// ============================================================================
// Test 4: PowerShell scripts exist
// ============================================================================
validations.push({
  name: 'PowerShell Scripts',
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
// Test 5: ADR documentation
// ============================================================================
validations.push({
  name: 'ADR Documentation',
  test: () => {
    const adrPath = join(projectRoot, 'docs', 'adr');
    if (!existsSync(adrPath)) {
      throw new Error('Directory docs/adr not found');
    }
    
    const adrFiles = readdirSync(adrPath).filter(f => f.endsWith('.md'));
    
    const criticalADRs = [
      'ADR-0001-bootstrap.md',
      'ADR-0006-sistema-asignacion-reportes.md',
      'ADR-0009-gestion-tipos-categorias-dinamicas.md',
      'ADR-0010-unificacion-asignaciones-audit-trail.md',
    ];
    
    const missingADRs = criticalADRs.filter(
      adr => !existsSync(join(adrPath, adr))
    );
    
    if (missingADRs.length > 0) {
      throw new Error(`Missing ADRs: ${missingADRs.join(', ')}`);
    }
    
    return { passed: true, message: `${adrFiles.length} ADRs found, all critical present` };
  }
});

// ============================================================================
// Test 6: VS Code configuration
// ============================================================================
validations.push({
  name: 'VS Code Configuration',
  test: () => {
    const vscodePath = join(projectRoot, '.vscode');
    if (!existsSync(vscodePath)) {
      throw new Error('Directory .vscode not found');
    }
    
    const requiredFiles = [
      'settings.json',
      'jantetelco.code-snippets',
    ];
    
    const missingFiles = requiredFiles.filter(
      file => !existsSync(join(vscodePath, file))
    );
    
    if (missingFiles.length > 0) {
      throw new Error(`Missing files: ${missingFiles.join(', ')}`);
    }
    
    // Verify snippets contain required prefixes (without parsing JSONC)
    const snippetsPath = join(vscodePath, 'jantetelco.code-snippets');
    const snippetsContent = readFileSync(snippetsPath, 'utf8');
    
    const requiredSnippets = [
      'jtz-endpoint-auth',
      'jtz-db-query',
      'jtz-test-backend',
      'jtz-component',
      'jtz-adr',
    ];
    
    const missingSnippets = requiredSnippets.filter(
      snippet => !snippetsContent.includes(`"prefix": "${snippet}"`)
    );
    
    if (missingSnippets.length > 0) {
      throw new Error(`Missing snippets: ${missingSnippets.join(', ')}`);
    }
    
    // Count snippets by counting "prefix" occurrences
    const snippetCount = (snippetsContent.match(/"prefix":/g) || []).length;
    return { passed: true, message: `${snippetCount} code snippets available` };
  }
});

// ============================================================================
// Test 7: Test files structure
// ============================================================================
validations.push({
  name: 'Test Structure',
  test: () => {
    const testPaths = [
      join(projectRoot, 'tests', 'backend'),
      join(projectRoot, 'tests', 'frontend'),
      join(projectRoot, 'tests', 'e2e'),
    ];
    
    const missingPaths = testPaths.filter(path => !existsSync(path));
    
    if (missingPaths.length > 0) {
      const relative = missingPaths.map(p => p.replace(projectRoot, '.'));
      throw new Error(`Missing directories: ${relative.join(', ')}`);
    }
    
    const backendTests = readdirSync(testPaths[0]).filter(f => f.endsWith('.test.js'));
    const frontendTests = readdirSync(testPaths[1]).filter(f => f.endsWith('.test.jsx'));
    const e2eTests = readdirSync(testPaths[2]).filter(f => f.endsWith('.spec.ts'));
    
    const total = backendTests.length + frontendTests.length + e2eTests.length;
    return { 
      passed: true, 
      message: `3-tier structure present (${backendTests.length} backend, ${frontendTests.length} frontend, ${e2eTests.length} e2e)` 
    };
  }
});

// ============================================================================
// Test 8: Documentation files
// ============================================================================
validations.push({
  name: 'Documentation Files',
  test: () => {
    const requiredDocs = [
      'README.md',
      'NEXT_STEPS.md',
      'RESUMEN_EJECUTIVO.md',
      'COPILOT_INSTRUCTIONS_UPDATE.md',
    ];
    
    const missingDocs = requiredDocs.filter(
      doc => !existsSync(join(projectRoot, doc))
    );
    
    if (missingDocs.length > 0) {
      throw new Error(`Missing documentation: ${missingDocs.join(', ')}`);
    }
    
    return { passed: true, message: 'All documentation files present' };
  }
});

// ============================================================================
// Run all validations
// ============================================================================
async function runValidations() {
  logSection('📋 Jantetelco Documentation Validation');
  console.log('');
  
  let passed = 0;
  let failed = 0;
  const errors = [];
  
  for (const validation of validations) {
    try {
      const result = await validation.test();
      logResult(true, `${validation.name}: ${result.message}`);
      passed++;
    } catch (error) {
      logResult(false, `${validation.name}: ${error.message}`);
      errors.push({ name: validation.name, error: error.message });
      failed++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  log('SUMMARY', 'bold');
  console.log('='.repeat(70));
  
  const total = passed + failed;
  log(`Total tests: ${total}`, 'cyan');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Success rate: ${((passed / total) * 100).toFixed(1)}%`, 'cyan');
  
  if (failed > 0) {
    console.log('\n' + '='.repeat(70));
    log('ERRORS', 'red');
    console.log('='.repeat(70));
    errors.forEach(({ name, error }, index) => {
      log(`${index + 1}. ${name}`, 'yellow');
      log(`   ${error}`, 'red');
    });
    
    process.exit(1);
  } else {
    console.log('');
    log('✨ All validations passed! Documentation is in sync with codebase.', 'green');
    log('💡 Run this validation before commits to catch documentation drift.', 'yellow');
    process.exit(0);
  }
}

// Run validations
runValidations().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
