#!/usr/bin/env node
/**
 * 🔑 Generador de Claves VAPID para Push Notifications
 * 
 * Uso: node scripts/generate-vapid-keys.js
 * 
 * Genera un par de claves VAPID y las muestra en formato
 * listo para agregar a .env o variables de entorno.
 */

import webpush from 'web-push';

console.log('🔑 Generando claves VAPID para Web Push Notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('═══════════════════════════════════════════════════════════');
console.log('          CLAVES VAPID GENERADAS');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Agrega estas variables a tu archivo .env o entorno:');
console.log('');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:admin@tudominio.com`);
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('   - Guarda la clave PRIVADA de forma segura');
console.log('   - La clave PÚBLICA se comparte con el frontend');
console.log('   - Nunca commites las claves al repositorio');
console.log('');
console.log('📝 Para Docker/producción:');
console.log('   docker run -e VAPID_PUBLIC_KEY=... -e VAPID_PRIVATE_KEY=...');
console.log('');
