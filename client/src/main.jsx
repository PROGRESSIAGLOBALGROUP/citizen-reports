import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// ═══════════════════════════════════════════════════════════════
// SUPRIMIR ERRORES DE VITE HMR WEBSOCKET (solo en desarrollo)
// ═══════════════════════════════════════════════════════════════
if (import.meta.env.DEV) {
  // Guardar console.error original
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Override console.error para filtrar errores de Vite WebSocket
  console.error = (...args) => {
    const message = args[0]?.toString?.() || '';
    
    // Filtrar errores de WebSocket de Vite
    if (
      message.includes('WebSocket connection') ||
      message.includes('[vite]') ||
      message.includes('failed to connect to websocket') ||
      message.includes('ws://localhost') ||
      message.includes('createConnection')
    ) {
      return; // Silenciar
    }
    
    // Mostrar otros errores normalmente
    originalError(...args);
  };
  
  // Override console.warn para filtrar warnings de Vite
  console.warn = (...args) => {
    const message = args[0]?.toString?.() || '';
    
    if (message.includes('[vite]') || message.includes('WebSocket')) {
      return; // Silenciar
    }
    
    originalWarn(...args);
  };
}

// Service Worker deshabilitado durante desarrollo para evitar cache issues
// if ('serviceWorker' in navigator) {
// 	window.addEventListener('load', () => {
// 		navigator.serviceWorker.register('/sw.js').catch(() => {})
// 	})
// }

createRoot(document.getElementById('root')).render(<App />)