import React, { useState } from 'react';

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
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', maxWidth: '500px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700' }}>{config.titulo}</h2>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#666' }}>{config.desc}</p>
          <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
            {config.detalles.map((d, i) => <div key={i} style={{ fontSize: '12px', color: '#78350f', marginBottom: i < config.detalles.length - 1 ? '6px' : 0 }}>{d}</div>)}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setModalConfirmacion(null)} disabled={cargando} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Cancelar</button>
            <button onClick={modalConfirmacion === 'eliminar_reportes' ? handleEliminarReportes : handleReiniciarDB} disabled={cargando} style={{ padding: '8px 16px', backgroundColor: config.color, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', opacity: cargando ? 0.6 : 1 }}>{cargando ? '⏳' : config.confirmar}</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700' }}>🗄️ Herramientas de Base de Datos</h2>

      {mensaje && (
        <div style={{ padding: '12px 16px', backgroundColor: mensaje.includes('✅') ? '#d1fae5' : '#fee2e2', color: mensaje.includes('✅') ? '#065f46' : '#991b1b', border: `1px solid ${mensaje.includes('✅') ? '#a7f3d0' : '#fecaca'}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
          {mensaje}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {/* Backup */}
        <div style={{ padding: '16px', backgroundColor: '#f0f9ff', border: '2px solid #0284c7', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: '#0c4a6e' }}>📥 Descargar Respaldo</h3>
            <p style={{ margin: '0', fontSize: '12px', color: '#0c4a6e', opacity: 0.8 }}>Descarga copia de BD</p>
          </div>
          <button onClick={handleDescargarBackup} disabled={cargando} style={{ padding: '10px 16px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', opacity: cargando ? 0.6 : 1 }}>
            {cargando ? '⏳ Descargando' : '💾 Descargar'}
          </button>
        </div>

        {/* Eliminar Reportes */}
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '2px solid #dc2626', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: '#7c2d12' }}>🗑️ Eliminar Reportes</h3>
            <p style={{ margin: '0', fontSize: '12px', color: '#7c2d12', opacity: 0.8 }}>Elimina TODOS</p>
          </div>
          <button onClick={() => setModalConfirmacion('eliminar_reportes')} disabled={cargando} style={{ padding: '10px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', opacity: cargando ? 0.6 : 1 }}>
            {cargando ? '⏳ Procesando' : '🗑️ Eliminar'}
          </button>
        </div>

        {/* Reiniciar BD */}
        <div style={{ padding: '16px', backgroundColor: '#fef5f1', border: '2px solid #92400e', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: '#54381e' }}>🔄 Reiniciar BD</h3>
            <p style={{ margin: '0', fontSize: '12px', color: '#54381e', opacity: 0.8 }}>Preserva solo admin</p>
          </div>
          <button onClick={() => setModalConfirmacion('reiniciar_db')} disabled={cargando} style={{ padding: '10px 16px', backgroundColor: '#92400e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', opacity: cargando ? 0.6 : 1 }}>
            {cargando ? '⏳ Procesando' : '🔄 Reiniciar'}
          </button>
        </div>
      </div>

      {renderModal()}
    </div>
  );
}
