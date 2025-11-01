#!/usr/bin/env node
/**
 * Script de prueba para validar endpoints de gestión de usuarios
 */

const API_BASE = 'http://localhost:4000';

async function testEndpoints() {
  console.log('\n🧪 Iniciando pruebas de endpoints de usuarios...\n');
  
  try {
    // Test 1: Listar usuarios
    console.log('1️⃣  GET /api/usuarios - Listar todos los usuarios');
    const res1 = await fetch(`${API_BASE}/api/usuarios`);
    const usuarios = await res1.json();
    console.log(`   ✅ Status: ${res1.status}`);
    console.log(`   📊 Total usuarios: ${usuarios.length}`);
    console.log(`   👤 Primer usuario: ${usuarios[0]?.nombre || 'N/A'}\n`);
    
    // Test 2: Listar dependencias
    console.log('2️⃣  GET /api/dependencias - Listar dependencias');
    const res2 = await fetch(`${API_BASE}/api/dependencias`);
    const dependencias = await res2.json();
    console.log(`   ✅ Status: ${res2.status}`);
    console.log(`   📋 Total dependencias: ${dependencias.length}`);
    console.log(`   🏛️  Primera: ${dependencias[0]?.nombre || 'N/A'}\n`);
    
    // Test 3: Listar roles
    console.log('3️⃣  GET /api/roles - Listar roles');
    const res3 = await fetch(`${API_BASE}/api/roles`);
    const roles = await res3.json();
    console.log(`   ✅ Status: ${res3.status}`);
    console.log(`   👥 Total roles: ${roles.length}`);
    console.log(`   📝 Roles: ${roles.map(r => r.id).join(', ')}\n`);
    
    // Test 4: Obtener usuario específico
    if (usuarios.length > 0) {
      const primerUsuario = usuarios[0];
      console.log(`4️⃣  GET /api/usuarios/${primerUsuario.id} - Obtener usuario específico`);
      const res4 = await fetch(`${API_BASE}/api/usuarios/${primerUsuario.id}`);
      const usuario = await res4.json();
      console.log(`   ✅ Status: ${res4.status}`);
      console.log(`   👤 Usuario: ${usuario.nombre}`);
      console.log(`   📧 Email: ${usuario.email}`);
      console.log(`   🏛️  Dependencia: ${usuario.dependencia}`);
      console.log(`   🎭 Rol: ${usuario.rol}\n`);
    }
    
    // Test 5: Crear usuario de prueba
    console.log('5️⃣  POST /api/usuarios - Crear nuevo usuario');
    const nuevoUsuario = {
      email: `test${Date.now()}@jantetelco.gob.mx`,
      nombre: 'Usuario de Prueba',
      password: 'Test1234!',
      dependencia: 'obras_publicas',
      rol: 'funcionario'
    };
    
    const res5 = await fetch(`${API_BASE}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoUsuario)
    });
    const resultado = await res5.json();
    console.log(`   ✅ Status: ${res5.status}`);
    console.log(`   🆔 ID generado: ${resultado.id || 'N/A'}`);
    console.log(`   ✅ Mensaje: ${resultado.mensaje || resultado.error}\n`);
    
    const idNuevo = resultado.id;
    
    if (idNuevo) {
      // Test 6: Actualizar usuario
      console.log(`6️⃣  PUT /api/usuarios/${idNuevo} - Actualizar usuario`);
      const res6 = await fetch(`${API_BASE}/api/usuarios/${idNuevo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: 'Usuario Actualizado' })
      });
      const actualizado = await res6.json();
      console.log(`   ✅ Status: ${res6.status}`);
      console.log(`   🔄 Cambios: ${actualizado.cambios || 0}\n`);
      
      // Test 7: Desactivar usuario
      console.log(`7️⃣  DELETE /api/usuarios/${idNuevo} - Desactivar usuario`);
      const res7 = await fetch(`${API_BASE}/api/usuarios/${idNuevo}`, {
        method: 'DELETE'
      });
      const eliminado = await res7.json();
      console.log(`   ✅ Status: ${res7.status}`);
      console.log(`   🗑️  Mensaje: ${eliminado.mensaje || eliminado.error}\n`);
    }
    
    // Test 8: Validación de email inválido
    console.log('8️⃣  POST /api/usuarios - Validación email inválido');
    const res8 = await fetch(`${API_BASE}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalido',
        nombre: 'Test',
        password: 'Test1234!',
        dependencia: 'obras_publicas',
        rol: 'funcionario'
      })
    });
    const error1 = await res8.json();
    console.log(`   ${res8.status === 400 ? '✅' : '❌'} Status: ${res8.status} (esperado 400)`);
    console.log(`   ⚠️  Error: ${error1.error}\n`);
    
    // Test 9: Validación de password débil
    console.log('9️⃣  POST /api/usuarios - Validación password débil');
    const res9 = await fetch(`${API_BASE}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test2@jantetelco.gob.mx',
        nombre: 'Test',
        password: '123',
        dependencia: 'obras_publicas',
        rol: 'funcionario'
      })
    });
    const error2 = await res9.json();
    console.log(`   ${res9.status === 400 ? '✅' : '❌'} Status: ${res9.status} (esperado 400)`);
    console.log(`   ⚠️  Error: ${error2.error}\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Todas las pruebas completadas');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error ejecutando pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar
testEndpoints();
