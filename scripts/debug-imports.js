#!/usr/bin/env node
// Debug script para identificar qué import causa el crash

console.log('🔍 Iniciando debug de imports...\n');

try {
  console.log('1. Importando express...');
  import('express').then(() => {
    console.log('   ✅ express OK');
  });
} catch (e) {
  console.error('   ❌ error en express:', e.message);
}

try {
  console.log('2. Importando db.js...');
  import('./server/db.js').then(() => {
    console.log('   ✅ db.js OK');
  });
} catch (e) {
  console.error('   ❌ error en db.js:', e.message);
}

try {
  console.log('3. Importando dependenciasRoutes...');
  import('./server/dependencias-routes.js').then((mod) => {
    console.log('   ✅ dependencias-routes.js OK');
    console.log('   Exports:', Object.keys(mod));
  });
} catch (e) {
  console.error('   ❌ error en dependencias-routes.js:', e.message);
  console.error('   Stack:', e.stack);
}

try {
  console.log('4. Importando usuariosRoutes...');
  import('./server/usuarios-routes.js').then((mod) => {
    console.log('   ✅ usuarios-routes.js OK');
  });
} catch (e) {
  console.error('   ❌ error en usuarios-routes.js:', e.message);
}

try {
  console.log('5. Importando tiposRoutes...');
  import('./server/tipos-routes.js').then((mod) => {
    console.log('   ✅ tipos-routes.js OK');
  });
} catch (e) {
  console.error('   ❌ error en tipos-routes.js:', e.message);
}

// Espera un poco para que las promises se resuelvan
setTimeout(() => {
  console.log('\n✅ Debug completado');
  process.exit(0);
}, 2000);
