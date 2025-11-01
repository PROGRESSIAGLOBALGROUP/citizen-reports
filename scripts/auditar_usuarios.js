/**
 * Script para auditar usuarios y sus departamentos
 * Ejecutar: node scripts/auditar_usuarios.js
 */

import { getDb } from '../server/db.js';

async function auditarUsuarios() {
  const db = getDb();

  console.log('\n📋 AUDITORÍA DE USUARIOS Y DEPARTAMENTOS\n');

  // Listar TODOS los usuarios
  const todosUsuarios = await new Promise((resolve, reject) => {
    db.all(`
      SELECT id, nombre, email, dependencia, rol, activo
      FROM usuarios
      ORDER BY dependencia, rol, nombre
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  console.log('═══════════════════════════════════════════════════════════════════\n');
  console.log('TODOS LOS USUARIOS EN EL SISTEMA:\n');
  
  const porDependencia = {};
  
  todosUsuarios.forEach(u => {
    if (!porDependencia[u.dependencia]) {
      porDependencia[u.dependencia] = [];
    }
    porDependencia[u.dependencia].push(u);
  });

  Object.keys(porDependencia).sort().forEach(dep => {
    console.log(`\n🏛️  DEPENDENCIA: ${dep.toUpperCase()}`);
    console.log('─'.repeat(70));
    
    porDependencia[dep].forEach(u => {
      const estadoIcon = u.activo ? '✅' : '❌';
      const rolIcon = {
        'admin': '👑',
        'supervisor': '👨‍💼',
        'funcionario': '👷'
      }[u.rol] || '❓';
      
      console.log(`  ${estadoIcon} ${rolIcon} [${u.rol.toUpperCase()}] ${u.nombre}`);
      console.log(`     Email: ${u.email}`);
      console.log(`     ID: ${u.id} | Activo: ${u.activo ? 'Sí' : 'No'}`);
    });
  });

  console.log('\n═══════════════════════════════════════════════════════════════════\n');

  // Contar por rol
  const porRol = {
    admin: todosUsuarios.filter(u => u.rol === 'admin').length,
    supervisor: todosUsuarios.filter(u => u.rol === 'supervisor').length,
    funcionario: todosUsuarios.filter(u => u.rol === 'funcionario').length
  };

  console.log('📊 RESUMEN POR ROL:\n');
  console.log(`   👑 Administradores:  ${porRol.admin}`);
  console.log(`   👨‍💼 Supervisores:     ${porRol.supervisor}`);
  console.log(`   👷 Funcionarios:     ${porRol.funcionario}`);
  console.log(`   ─────────────────────────`);
  console.log(`   TOTAL:              ${todosUsuarios.length}`);

  console.log('\n═══════════════════════════════════════════════════════════════════\n');

  // Simular lo que ve un supervisor de obras_publicas
  console.log('🔍 SIMULACIÓN: ¿Qué ve el Supervisor de Obras Públicas?\n');
  console.log('   Query: rol=funcionario, activo=1, dependencia=obras_publicas\n');
  
  const funcionariosObras = await new Promise((resolve, reject) => {
    db.all(`
      SELECT id, nombre, email, dependencia, rol
      FROM usuarios
      WHERE rol = 'funcionario' 
        AND activo = 1 
        AND dependencia = 'obras_publicas'
      ORDER BY nombre
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  if (funcionariosObras.length === 0) {
    console.log('   ⚠️  NO SE ENCONTRARON funcionarios activos en "obras_publicas"');
  } else {
    funcionariosObras.forEach((f, idx) => {
      console.log(`   ${idx + 1}. ${f.nombre} (${f.email})`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════════\n');

  // Simular lo que ve un admin
  console.log('🔍 SIMULACIÓN: ¿Qué ve el Administrador?\n');
  console.log('   Query: rol=funcionario, activo=1, (sin filtro de dependencia)\n');
  
  const todosFuncionarios = await new Promise((resolve, reject) => {
    db.all(`
      SELECT id, nombre, email, dependencia, rol
      FROM usuarios
      WHERE rol = 'funcionario' 
        AND activo = 1
      ORDER BY dependencia, nombre
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  if (todosFuncionarios.length === 0) {
    console.log('   ⚠️  NO SE ENCONTRARON funcionarios activos');
  } else {
    const porDep = {};
    todosFuncionarios.forEach(f => {
      if (!porDep[f.dependencia]) porDep[f.dependencia] = [];
      porDep[f.dependencia].push(f);
    });

    Object.keys(porDep).sort().forEach(dep => {
      console.log(`\n   📁 ${dep}:`);
      porDep[dep].forEach(f => {
        console.log(`      • ${f.nombre} (${f.email})`);
      });
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════════\n');

  // Verificar usuarios específicos que aparecen en el screenshot
  console.log('🔎 VERIFICACIÓN: Usuarios visibles en el screenshot del Admin\n');
  
  const usuariosScreenshot = [
    'Juan Pérez',
    'Carlos Ramírez',
    'María López',
    'Wilder'
  ];

  for (const nombre of usuariosScreenshot) {
    const usuario = todosUsuarios.find(u => u.nombre.includes(nombre) || nombre.includes(u.nombre));
    
    if (usuario) {
      console.log(`   ✅ ${nombre}:`);
      console.log(`      Nombre completo: ${usuario.nombre}`);
      console.log(`      Email: ${usuario.email}`);
      console.log(`      Departamento: ${usuario.dependencia}`);
      console.log(`      Rol: ${usuario.rol}`);
      console.log(`      Activo: ${usuario.activo ? 'Sí' : 'No'}`);
    } else {
      console.log(`   ❌ ${nombre}: NO ENCONTRADO en la base de datos`);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════════\n');

  db.close();
}

auditarUsuarios().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
