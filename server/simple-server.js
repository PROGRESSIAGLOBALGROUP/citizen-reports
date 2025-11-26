import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Datos estáticos para prueba
const testData = [
  {id: 1, tipo: 'infraestructura', descripcion: 'Baches en calle principal', lat: 18.8167, lng: -98.9667, peso: 3},
  {id: 2, tipo: 'servicios', descripcion: 'Falta de alumbrado público', lat: 18.8180, lng: -98.9650, peso: 2},
  {id: 3, tipo: 'seguridad', descripcion: 'Zona poco transitada en la noche', lat: 18.8150, lng: -98.9680, peso: 4},
  {id: 4, tipo: 'infraestructura', descripcion: 'Banqueta dañada', lat: 18.8190, lng: -98.9640, peso: 2},
  {id: 5, tipo: 'servicios', descripcion: 'Recolección de basura irregular', lat: 18.8140, lng: -98.9690, peso: 3}
];

const testTipos = ['infraestructura', 'servicios', 'seguridad', 'transporte'];

app.get('/test', (req, res) => {
  console.log('✅ Test endpoint llamado');
  res.json({ message: '🎉 Servidor funcionando correctamente!', timestamp: new Date().toISOString() });
});

app.get('/api/reportes', (req, res) => {
  console.log('📊 API reportes llamada');
  res.json(testData);
});

app.get('/api/reportes/tipos', (req, res) => {
  console.log('📋 API tipos llamada');
  res.json(testTipos);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor simple ejecutándose en http://localhost:${PORT}`);
  console.log(`🔥 Datos de prueba listos para citizen-reports`);
  
  // Mantener el proceso vivo
  setInterval(() => {
    console.log(`⏰ Servidor activo: ${new Date().toLocaleTimeString()}`);
  }, 30000);
});