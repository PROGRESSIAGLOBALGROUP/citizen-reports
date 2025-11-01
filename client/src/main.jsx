import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// Service Worker deshabilitado durante desarrollo para evitar cache issues
// if ('serviceWorker' in navigator) {
// 	window.addEventListener('load', () => {
// 		navigator.serviceWorker.register('/sw.js').catch(() => {})
// 	})
// }

createRoot(document.getElementById('root')).render(<App />)