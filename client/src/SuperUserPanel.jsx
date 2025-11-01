import React, { useState, useEffect } from 'react';

function SuperUserPanel({ superUserToken }) {
  const [config, setConfig] = useState(null);
  const [editConfig, setEditConfig] = useState({
    nombre_municipio: 'Jantetelco',
    mostrar_progressia: true,
    mostrar_citizen_reports: true,
    color_primario: '#1e40af',
    color_secundario: '#2563eb',
    nombre_app: 'Citizen-Reports',
    lema: 'Transparencia Municipal'
  });
  const [stats, setStats] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [activo, setActivo] = useState('config');

  useEffect(() => {
    cargarConfig();
    cargarStats();
  }, []);

  const cargarConfig = async () => {
    try {
      const res = await fetch('/api/whitelabel/config');
      const data = await res.json();
      setConfig(data);
      setEditConfig(data);
    } catch (error) {
      console.error('Error cargando config:', error);
    }
  };

  const cargarStats = async () => {
    if (!superUserToken) return;
    
    try {
      const res = await fetch('/api/super-usuario/stats', {
        headers: { 'X-Super-User-Token': superUserToken }
      });
      const data = await res.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error cargando stats:', error);
    }
  };

  const guardarConfig = async () => {
    if (!superUserToken) {
      setMensaje('❌ Token de super usuario no configurado');
      return;
    }

    setGuardando(true);
    setMensaje('');

    try {
      const res = await fetch('/api/super-usuario/whitelabel/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Super-User-Token': superUserToken
        },
        body: JSON.stringify(editConfig)
      });

      if (!res.ok) {
        const error = await res.json();
        setMensaje(`❌ Error: ${error.error}`);
        return;
      }

      const data = await res.json();
      setConfig(data.config);
      setMensaje('✅ Configuración guardada correctamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error guardando config:', error);
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setGuardando(false);
    }
  };

  if (!superUserToken) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        border: '1px solid #fcd34d'
      }}>
        <p style={{ margin: '0', fontWeight: '600' }}>⚠️ Token de super usuario requerido</p>
        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#666' }}>
          Configura SUPER_USER_TOKEN en las variables de entorno del servidor
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>
        🔐 Panel de Super Usuario
      </h2>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setActivo('config')}
          style={{
            padding: '8px 16px',
            backgroundColor: activo === 'config' ? '#3b82f6' : 'transparent',
            color: activo === 'config' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          ⚙️ White Label
        </button>
        <button
          onClick={() => setActivo('stats')}
          style={{
            padding: '8px 16px',
            backgroundColor: activo === 'stats' ? '#3b82f6' : 'transparent',
            color: activo === 'stats' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          📊 Estadísticas
        </button>
      </div>

      {/* Contenido */}
      {activo === 'config' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
              📍 Nombre del Municipio
            </label>
            <input
              type="text"
              value={editConfig.nombre_municipio}
              onChange={(e) => setEditConfig({ ...editConfig, nombre_municipio: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
              📱 Nombre de la App
            </label>
            <input
              type="text"
              value={editConfig.nombre_app}
              onChange={(e) => setEditConfig({ ...editConfig, nombre_app: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
              💬 Lema
            </label>
            <input
              type="text"
              value={editConfig.lema}
              onChange={(e) => setEditConfig({ ...editConfig, lema: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
                🎨 Color Primario
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  value={editConfig.color_primario}
                  onChange={(e) => setEditConfig({ ...editConfig, color_primario: e.target.value })}
                  style={{
                    width: '50px',
                    height: '40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={editConfig.color_primario}
                  onChange={(e) => setEditConfig({ ...editConfig, color_primario: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
                🎨 Color Secundario
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  value={editConfig.color_secundario}
                  onChange={(e) => setEditConfig({ ...editConfig, color_secundario: e.target.value })}
                  style={{
                    width: '50px',
                    height: '40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={editConfig.color_secundario}
                  onChange={(e) => setEditConfig({ ...editConfig, color_secundario: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={editConfig.mostrar_progressia}
                onChange={(e) => setEditConfig({ ...editConfig, mostrar_progressia: e.target.checked })}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: '600', fontSize: '14px' }}>🌍 Mostrar "PROGRESSIA"</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editConfig.mostrar_citizen_reports}
                onChange={(e) => setEditConfig({ ...editConfig, mostrar_citizen_reports: e.target.checked })}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: '600', fontSize: '14px' }}>📱 Mostrar "Citizen-Reports"</span>
            </label>
          </div>

          {mensaje && (
            <div style={{
              padding: '12px',
              marginBottom: '16px',
              backgroundColor: mensaje.includes('✅') ? '#d1fae5' : '#fee2e2',
              color: mensaje.includes('✅') ? '#065f46' : '#991b1b',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              {mensaje}
            </div>
          )}

          <button
            onClick={guardarConfig}
            disabled={guardando}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: guardando ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              opacity: guardando ? 0.6 : 1
            }}
          >
            {guardando ? '💾 Guardando...' : '💾 Guardar Configuración'}
          </button>
        </div>
      )}

      {activo === 'stats' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ padding: '16px', backgroundColor: '#dbeafe', borderRadius: '6px', border: '1px solid #93c5fd' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af' }}>{stats.total_reportes}</div>
            <div style={{ fontSize: '12px', color: '#0c4a6e', fontWeight: '600' }}>Total de Reportes</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#fce7f3', borderRadius: '6px', border: '1px solid #fbcfe8' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#be185d' }}>{stats.total_usuarios}</div>
            <div style={{ fontSize: '12px', color: '#831843', fontWeight: '600' }}>Total de Usuarios</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#ddd6fe', borderRadius: '6px', border: '1px solid #c4b5fd' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#6d28d9' }}>{stats.reportes_abiertos}</div>
            <div style={{ fontSize: '12px', color: '#4c1d95', fontWeight: '600' }}>Reportes Abiertos</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#d1d5db', borderRadius: '6px', border: '1px solid #9ca3af' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#374151' }}>{stats.reportes_cerrados}</div>
            <div style={{ fontSize: '12px', color: '#1f2937', fontWeight: '600' }}>Reportes Cerrados</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperUserPanel;
