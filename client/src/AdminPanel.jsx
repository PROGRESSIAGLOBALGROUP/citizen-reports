import React, { useState } from 'react';
import AdminUsuarios from './AdminUsuarios.jsx';
import AdminCategorias from './AdminCategorias.jsx';
import AdminDependencias from './AdminDependencias.jsx';

export default function AdminPanel() {
  const [seccionActiva, setSeccionActiva] = useState('usuarios'); // 'usuarios', 'categorias', 'dependencias'

  const tabs = [
    { id: 'usuarios', label: '👥 Usuarios' },
    { id: 'categorias', label: '📂 Categorías' },
    { id: 'dependencias', label: '🏢 Dependencias' }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 50px)', 
      width: '100%',
      backgroundColor: 'white'
    }}>
      {/* Barra de pestañas de administración */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        padding: '0',
        flexWrap: 'nowrap',
        flexShrink: 0
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSeccionActiva(tab.id)}
            style={{
              flex: '1',
              padding: '12px 16px',
              backgroundColor: seccionActiva === tab.id ? '#3b82f6' : '#f3f4f6',
              color: seccionActiva === tab.id ? 'white' : '#374151',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderBottom: seccionActiva === tab.id ? '3px solid #1e40af' : '3px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de las secciones */}
      <div style={{
        flex: '1',
        overflow: 'auto',
        padding: '20px',
        backgroundColor: '#f9fafb'
      }}>
        {seccionActiva === 'usuarios' && <AdminUsuarios />}
        {seccionActiva === 'categorias' && <AdminCategorias fullscreen={true} />}
        {seccionActiva === 'dependencias' && <AdminDependencias fullscreen={true} />}
      </div>
    </div>
  );
}
