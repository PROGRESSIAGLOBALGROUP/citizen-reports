import React, { useState } from 'react';
import './gobierno-premium-panel.css';

export default function AdminDatabaseTools() {
  const token = localStorage.getItem('auth_token');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [modalConfirmacion, setModalConfirmacion] = useState(null);

  const handleDescargarBackup = async () => {
    if (cargando) return;
    setCargando(true);
    setMensaje('');

    try {
      const res = await fetch('/api/admin/database/backup', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const error = await res.json();
        setMensaje(`❌ Error: ${error.error}`);
        setCargando(false);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `citizen-reports-backup-${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      setMensaje('✅ Respaldo descargado correctamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error:', error);
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarReportes = async () => {
    if (cargando) return;
    setCargando(true);
    setMensaje('');

    try {
      const res = await fetch('/api/admin/database/reports', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ confirmacion: 'eliminar_todos_reportes' })
      });

      if (!res.ok) {
        const error = await res.json();
        setMensaje(`❌ Error: ${error.error}`);
        setModalConfirmacion(null);
        setCargando(false);
        return;
      }

      const data = await res.json();
      setMensaje(`✅ ${data.mensaje}`);
      setModalConfirmacion(null);
      setTimeout(() => setMensaje(''), 4000);
    } catch (error) {
      console.error('Error:', error);
      setMensaje(`❌ Error: ${error.message}`);
      setModalConfirmacion(null);
    } finally {
      setCargando(false);
    }
  };

  const handleReiniciarDB = async () => {
    if (cargando) return;
    setCargando(true);
    setMensaje('');

    try {
      const res = await fetch('/api/admin/database/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ confirmacion: 'reiniciar_base_datos' })
      });

      if (!res.ok) {
        const error = await res.json();
        setMensaje(`❌ Error: ${error.error}`);
        setModalConfirmacion(null);
        setCargando(false);
        return;
      }

      const data = await res.json();
      setMensaje(`✅ ${data.mensaje}`);
      setModalConfirmacion(null);
      setTimeout(() => setMensaje(''), 4000);
    } catch (error) {
      console.error('Error:', error);
      setMensaje(`❌ Error: ${error.message}`);
      setModalConfirmacion(null);
    } finally {
      setCargando(false);
    }
  };

  const renderModal = () => {
    if (!modalConfirmacion) return null;

    const configs = {
      eliminar: {
        titulo: '⚠️ Eliminar Todos los Reportes',
        desc: 'Eliminará TODOS los reportes. IRREVERSIBLE.',
        detalles: ['• Se eliminarán todas las asignaciones', '• Se eliminarán todos los cierres', '• Se eliminarán notas de trabajo'],
        color: '#dc2626',
        confirmar: 'Sí, eliminar'
      },
      reset: {
        titulo: '⚠️ Reiniciar Base de Datos',
        desc: 'Eliminará todo EXCEPTO usuarios admin. IRREVERSIBLE.',
        detalles: ['• Se eliminarán todos los reportes', '• Se eliminarán usuarios no-admin', '• Se limpiarán sesiones y historial'],
        color: '#92400e',
        confirmar: 'Sí, reiniciar'
      }
    };

    const config = configs[modalConfirmacion === 'eliminar_reportes' ? 'eliminar' : 'reset'];

    return (
      <div className="gp-confirm-overlay">
        <div className="gp-confirm-modal">
          <h2 className="gp-confirm-title">{config.titulo}</h2>
          <p className="gp-confirm-desc">{config.desc}</p>
          <div className="gp-confirm-warning">
            {config.detalles.map((d, i) => <div key={i} className="gp-confirm-detail">{d}</div>)}
          </div>
          <div className="gp-confirm-actions">
            <button onClick={() => setModalConfirmacion(null)} disabled={cargando} className="gp-btn-cancel">Cancelar</button>
            <button
              onClick={modalConfirmacion === 'eliminar_reportes' ? handleEliminarReportes : handleReiniciarDB}
              disabled={cargando}
              className="gp-btn-confirm"
              style={{ backgroundColor: config.color, opacity: cargando ? 0.6 : 1 }}
            >
              {cargando ? '⏳' : config.confirmar}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="gobierno-premium">
      {/* Header Premium */}
      <div className="gp-admin-header">
        <div className="gp-admin-header-icon">🗄️</div>
        <div className="gp-admin-header-content">
          <h1 className="gp-admin-header-title">Herramientas de Base de Datos</h1>
          <p className="gp-admin-header-subtitle">Respaldos, mantenimiento y operaciones avanzadas</p>
        </div>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className={`gp-alert gp-mb-20 ${mensaje.includes('✅') ? 'gp-alert-success' : 'gp-alert-error'}`}>
          <span className="gp-alert-icon">{mensaje.includes('✅') ? '✓' : '✕'}</span>
          <span>{mensaje}</span>
        </div>
      )}

      {/* Grid de herramientas */}
      <div className="gp-tools-grid">
        {/* Backup */}
        <div className="gp-tool-card gp-tool-backup">
          <div className="gp-card-header">
            <span className="gp-badge gp-badge-info">Seguridad</span>
          </div>
          <div className="gp-card-body">
            <h3 className="gp-card-title">📥 Descargar Respaldo</h3>
            <p className="gp-tool-desc">
              Descarga una copia completa de la base de datos en formato SQLite
            </p>
            <button onClick={handleDescargarBackup} disabled={cargando} className="gp-btn gp-btn-primary gp-btn-full">
              {cargando ? '⏳ Descargando...' : '💾 Descargar Backup'}
            </button>
          </div>
        </div>

        {/* Eliminar Reportes */}
        <div className="gp-tool-card gp-tool-danger">
          <div className="gp-card-header">
            <span className="gp-badge gp-badge-danger">⚠️ Peligro</span>
          </div>
          <div className="gp-card-body">
            <h3 className="gp-card-title">🗑️ Eliminar Reportes</h3>
            <p className="gp-tool-desc">
              Elimina TODOS los reportes del sistema. Esta acción es irreversible.
            </p>
            <button onClick={() => setModalConfirmacion('eliminar_reportes')} disabled={cargando} className="gp-btn gp-btn-danger gp-btn-full">
              {cargando ? '⏳ Procesando...' : '🗑️ Eliminar Todos'}
            </button>
          </div>
        </div>

        {/* Reiniciar BD */}
        <div className="gp-tool-card gp-tool-warning">
          <div className="gp-card-header">
            <span className="gp-badge gp-badge-warning">⚠️ Crítico</span>
          </div>
          <div className="gp-card-body">
            <h3 className="gp-card-title">🔄 Reiniciar Base de Datos</h3>
            <p className="gp-tool-desc">
              Reinicia el sistema preservando únicamente usuarios admin. Irreversible.
            </p>
            <button onClick={() => setModalConfirmacion('reiniciar_db')} disabled={cargando} className="gp-btn gp-btn-warning gp-btn-full">
              {cargando ? '⏳ Procesando...' : '🔄 Reiniciar Sistema'}
            </button>
          </div>
        </div>
      </div>

      {renderModal()}
    </div>
  );
}
