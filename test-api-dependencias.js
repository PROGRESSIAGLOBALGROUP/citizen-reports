/**
 * Test API directo: Verificar que el flujo de eliminación de dependencias con usuarios funciona
 */

const API_URL = 'http://localhost:4000';

// Credenciales de admin
const admin = {
  email: 'admin@jantetelco.gob.mx',
  password: 'admin123'
};

async function main() {
  console.log('🚀 Test: Eliminación de Dependencias con Usuarios\n');

  try {
    // 1. Login para obtener token
    console.log('1️⃣  Obteniendo token...');
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(admin)
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status}`);
    }
    
    const { token } = await loginRes.json();
    console.log('✅ Token obtenido:', token.substring(0, 20) + '...\n');

    // 2. Obtener lista de dependencias
    console.log('2️⃣  Obteniendo dependencias...');
    const depsRes = await fetch(`${API_URL}/api/admin/dependencias`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const deps = await depsRes.json();
    console.log(`✅ Se encontraron ${deps.length} dependencias\n`);

    if (deps.length === 0) {
      console.log('⚠️  No hay dependencias para probar');
      return;
    }

    // 3. Encontrar una dependencia con usuarios
    console.log('3️⃣  Buscando dependencia con usuarios...');
    let depConUsuarios = null;
    let depSinUsuarios = null;

    for (const dep of deps) {
      const usuariosRes = await fetch(`${API_URL}/api/admin/dependencias/${dep.id}/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await usuariosRes.json();
      console.log(`   📍 ${dep.nombre}: ${data.count} usuario(s)`);

      if (data.count > 0 && !depConUsuarios) {
        depConUsuarios = { ...dep, usuarios: data.usuarios };
      }
      if (data.count === 0 && !depSinUsuarios) {
        depSinUsuarios = dep;
      }
    }

    console.log();

    // 4. Probar reasignación si existe dependencia con usuarios
    if (depConUsuarios) {
      console.log(`4️⃣  Probando reasignación para: ${depConUsuarios.nombre}`);
      console.log(`   Usuarios a reasignar: ${depConUsuarios.usuarios.map(u => u.nombre).join(', ')}\n`);

      // Buscar otra dependencia destino
      const destino = deps.find(d => d.id !== depConUsuarios.id && d.activo);
      if (!destino) {
        console.log('⚠️  No hay dependencia destino disponible');
      } else {
        console.log(`   Destino: ${destino.nombre}\n`);

        // Simular reasignación
        console.log(`5️⃣  Llamando a reasignar-y-eliminar...`);
        const reasignarRes = await fetch(
          `${API_URL}/api/admin/dependencias/${depConUsuarios.id}/reasignar-y-eliminar`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ dependenciaDestino: destino.slug })
          }
        );

        const reasignarData = await reasignarRes.json();
        console.log(`   Status: ${reasignarRes.status}`);
        console.log(`   Respuesta: ${JSON.stringify(reasignarData, null, 2)}\n`);

        if (reasignarRes.ok) {
          console.log('✅ Reasignación completada exitosamente');
        } else {
          console.log('❌ Error en reasignación:', reasignarData.error);
        }
      }
    } else {
      console.log('⚠️  No se encontró dependencia con usuarios para probar reasignación');
    }

    // 5. Probar eliminación directa
    if (depSinUsuarios) {
      console.log(`\n6️⃣  Probando eliminación directa para: ${depSinUsuarios.nombre}`);
      
      const deleteRes = await fetch(`${API_URL}/api/admin/dependencias/${depSinUsuarios.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const deleteData = await deleteRes.json();
      console.log(`   Status: ${deleteRes.status}`);
      console.log(`   Respuesta: ${JSON.stringify(deleteData, null, 2)}\n`);

      if (deleteRes.ok) {
        console.log('✅ Eliminación completada exitosamente');
      } else {
        console.log('❌ Error en eliminación:', deleteData.error);
      }
    } else {
      console.log('\n⚠️  No hay dependencia sin usuarios para probar eliminación directa');
    }

    console.log('\n✅ Test completado');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
