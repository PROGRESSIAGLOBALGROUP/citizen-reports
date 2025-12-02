import React, { useState } from 'react';
import './gobierno-premium-panel.css';
import AdminUsuarios from './AdminUsuarios.jsx';
import AdminCategorias from './AdminCategorias.jsx';
import AdminDependencias from './AdminDependencias.jsx';
import AdminDatabaseTools from './AdminDatabaseTools.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import { EditarWhiteLabelConfig } from './WhiteLabelConfig.jsx';

export default function AdminPanel() {
  const [seccionActiva, setSeccionActiva] = useState('dashboard');
  const token = localStorage.getItem('auth_token');

  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'usuarios', icon: '👥', label: 'Usuarios' },
    { id: 'categorias', icon: '📂', label: 'Categorías' },
    { id: 'dependencias', icon: '🏢', label: 'Dependencias' },
    { id: 'whitelabel', icon: '🎨', label: 'WhiteLabel' },
    { id: 'database', icon: '🗄️', label: 'BD' }
  ];

  return (
    <div className="gobierno-premium gp-admin-container">
      {/* Premium Admin Tabs */}
      <div className="gp-admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSeccionActiva(tab.id)}
            className={`gp-admin-tab ${seccionActiva === tab.id ? 'active' : ''}`}
          >
            <span className="gp-admin-tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="gp-admin-content">
        {seccionActiva === 'dashboard' && <AdminDashboard />}
        {seccionActiva === 'usuarios' && <AdminUsuarios />}
        {seccionActiva === 'categorias' && <AdminCategorias fullscreen={true} />}
        {seccionActiva === 'dependencias' && <AdminDependencias fullscreen={true} />}
        {seccionActiva === 'whitelabel' && token && <EditarWhiteLabelConfig municipioId="citizen-reports" token={token} />}
        {seccionActiva === 'database' && <AdminDatabaseTools />}
      </div>
    </div>
  );
}
