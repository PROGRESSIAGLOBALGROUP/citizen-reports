// Servidor básico de prueba en puerto diferente
import express from 'express';

const app = express();
const PORT = 3333;

app.use(express.json());

app.get('/health', (req, res) => {
  console.log('✅ Health check recibido');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏥 Servidor de diagnóstico en http://localhost:${PORT}`);
  console.log('📡 Esperando conexiones...');
});

// Mantener el proceso vivo
setInterval(() => {
  console.log(`💓 Servidor vivo - ${new Date().toLocaleTimeString()}`);
}, 5000);