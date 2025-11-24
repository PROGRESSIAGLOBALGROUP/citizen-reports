import React, { useState } from 'react';
import AdminUsuarios from './AdminUsuarios.jsx';
import AdminCategorias from './AdminCategorias.jsx';
import AdminDependencias from './AdminDependencias.jsx';
import AdminDatabaseTools from './AdminDatabaseTools.jsx';
import { EditarWhiteLabelConfig } from './WhiteLabelConfig.jsx';

export default function AdminPanel() {
  const [seccionActiva, setSeccionActiva] = useState('usuarios'); // 'usuarios', 'categorias', 'dependencias', 'whitelabel', 'database'
  const token = localStorage.getItem('auth_token');

  const tabs = [
    { id: 'usuarios', label: '👥 Usuarios' },
    { id: 'categorias', label: '📂 Categorías' },
    { id: 'dependencias', label: '🏢 Dependencias' },
    { id: 'whitelabel', label: '🎨 WhiteLabel' },
    { id: 'database', label: '🗄️ BD' }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 50px)', 
      width: '100%',
      backgroundColor: '#ffffff',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Barra profesional de pestañas de administración - 100% Responsive */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0',
        borderBottom: '2px solid #cbd5e1',
        backgroundColor: '#f8fafc',
        padding: '0',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        width: '100%'
      }}>
        {tabs.map((tab) => {
          const isActive = seccionActiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSeccionActiva(tab.id)}
              style={{
                padding: 'clamp(10px, 2.5vw, 14px) clamp(8px, 2vw, 16px)',
                backgroundColor: isActive ? '#ffffff' : '#f8fafc',
                color: isActive ? '#0284c7' : '#64748b',
                border: 'none',
                borderBottom: isActive ? '3px solid #0284c7' : '3px solid transparent',
                fontSize: 'clamp(11px, 2.5vw, 14px)',
                fontWeight: isActive ? '700' : '600',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(4px, 1vw, 6px)',
                letterSpacing: '0.3px',
                position: 'relative',
                marginBottom: '-2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: '0'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.target.style.backgroundColor = '#f1f5f9';
                  e.target.style.color = '#475569';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.target.style.backgroundColor = '#f8fafc';
                  e.target.style.color = '#64748b';
                }
              }}
            >
              <span style={{ fontSize: 'clamp(12px, 3vw, 16px)', flex: '0 0 auto' }}>
                {tab.label.split(' ')[0]}
              </span>
              <span style={{ display: 'block', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tab.label.substring(tab.label.indexOf(' ') + 1)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contenido de las secciones */}
      <div style={{
        flex: '1',
        overflow: 'auto',
        overflowX: 'hidden',
        padding: 'clamp(16px, 4vw, 24px)',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
        width: '100%'
      }}>
        {seccionActiva === 'usuarios' && <AdminUsuarios />}
        {seccionActiva === 'categorias' && <AdminCategorias fullscreen={true} />}
        {seccionActiva === 'dependencias' && <AdminDependencias fullscreen={true} />}
        {seccionActiva === 'whitelabel' && token && <EditarWhiteLabelConfig municipioId="jantetelco" token={token} />}
        {seccionActiva === 'database' && <AdminDatabaseTools />}
      </div>
    </div>
  );
}
