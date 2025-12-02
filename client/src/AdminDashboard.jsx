import React, { useState, useEffect, useMemo } from 'react';
import './gobierno-premium-panel.css';

/**
 * AdminDashboard - Dashboard de métricas para administradores
 * US-A06: Dashboard de Métricas
 * 
 * Muestra:
 * - Total de reportes por estado
 * - Reportes por tipo (gráfico de barras)
 * - Reportes por dependencia
 * - Tendencia semanal/mensual
 * - Tiempo promedio de resolución
 * - Filtros por rango de fechas
 */
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState('semana'); // semana, mes, todo
  const [exportando, setExportando] = useState(false);

  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    cargarDatos();
    // Auto-refresh cada 5 minutos
    const interval = setInterval(cargarDatos, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Error al cargar métricas');
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calcular porcentajes para gráficos
  const calcularPorcentaje = (valor, total) => {
    if (!total || total === 0) return 0;
    return Math.round((valor / total) * 100);
  };

  // Formatear días a texto legible
  const formatearDias = (dias) => {
    if (!dias || dias < 0) return 'N/A';
    if (dias < 1) return `${Math.round(dias * 24)} horas`;
    if (dias === 1) return '1 día';
    return `${Math.round(dias)} días`;
  };

  // Obtener color por estado
  const getColorEstado = (estado) => {
    const colores = {
      'nuevo': '#fbbf24',      // amarillo
      'pendiente': '#fbbf24',
      'asignado': '#3b82f6',   // azul
      'en_proceso': '#3b82f6',
      'pendiente_cierre': '#8b5cf6', // violeta
      'cerrado': '#22c55e',    // verde
      'rechazado': '#ef4444'   // rojo
    };
    return colores[estado] || '#6b7280';
  };

  // Exportar a CSV
  const exportarCSV = async () => {
    if (!data) return;
    
    setExportando(true);
    try {
      const response = await fetch('/api/reportes?limit=10000', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Error al obtener datos');
      
      const reportes = await response.json();
      
      // Crear CSV
      const headers = ['ID', 'Tipo', 'Descripción', 'Estado', 'Dependencia', 'Colonia', 'Fecha Creación', 'Última Actualización'];
      const rows = reportes.map(r => [
        r.id,
        r.tipo,
        `"${(r.descripcion || '').replace(/"/g, '""')}"`,
        r.estado,
        r.dependencia || '',
        r.colonia || '',
        r.created_at,
        r.updated_at || ''
      ]);
      
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      // Descargar
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reportes_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err) {
      console.error('Error exportando:', err);
      alert('Error al exportar datos');
    } finally {
      setExportando(false);
    }
  };

  // Datos para tendencia según filtro
  const datosTendencia = useMemo(() => {
    if (!data) return [];
    return filtroFecha === 'semana' ? data.tendenciaSemanal : data.tendenciaMensual;
  }, [data, filtroFecha]);

  // Máximo para escala de gráficos
  const maxTendencia = useMemo(() => {
    if (!datosTendencia || datosTendencia.length === 0) return 1;
    return Math.max(...datosTendencia.map(d => d.cantidad), 1);
  }, [datosTendencia]);

  if (loading && !data) {
    return (
      <div className="gp-dashboard-loading">
        <div className="gp-spinner"></div>
        <p>Cargando métricas del sistema...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gp-dashboard-error">
        <span className="gp-error-icon">⚠️</span>
        <h3>Error al cargar datos</h3>
        <p>{error}</p>
        <button onClick={cargarDatos} className="gp-btn-retry">
          🔄 Reintentar
        </button>
      </div>
    );
  }

  const { general, porEstado, porTipo, porDependencia, tiempoResolucion, cierresPendientes, recientes24h, porPrioridad } = data || {};

  return (
    <div className="gp-dashboard">
      {/* Header */}
      <div className="gp-dashboard-header">
        <div className="gp-dashboard-title">
          <span className="gp-dashboard-icon">📊</span>
          <div>
            <h2>Dashboard de Métricas</h2>
            <p className="gp-dashboard-subtitle">
              Actualizado: {new Date(data?.timestamp).toLocaleString('es-MX')}
            </p>
          </div>
        </div>
        <div className="gp-dashboard-actions">
          <button 
            onClick={cargarDatos} 
            className="gp-btn-refresh"
            disabled={loading}
          >
            {loading ? '⏳' : '🔄'} Actualizar
          </button>
          <button 
            onClick={exportarCSV} 
            className="gp-btn-export"
            disabled={exportando}
          >
            {exportando ? '⏳' : '📥'} Exportar CSV
          </button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="gp-dashboard-kpis">
        <div className="gp-kpi-card gp-kpi-primary">
          <div className="gp-kpi-icon">📋</div>
          <div className="gp-kpi-content">
            <span className="gp-kpi-value">{general?.total_reportes || 0}</span>
            <span className="gp-kpi-label">Total Reportes</span>
          </div>
        </div>
        
        <div className="gp-kpi-card gp-kpi-success">
          <div className="gp-kpi-icon">✅</div>
          <div className="gp-kpi-content">
            <span className="gp-kpi-value">
              {porEstado?.find(e => e.estado === 'cerrado')?.cantidad || 0}
            </span>
            <span className="gp-kpi-label">Cerrados</span>
          </div>
        </div>
        
        <div className="gp-kpi-card gp-kpi-warning">
          <div className="gp-kpi-icon">⏳</div>
          <div className="gp-kpi-content">
            <span className="gp-kpi-value">{cierresPendientes?.cantidad || 0}</span>
            <span className="gp-kpi-label">Cierres Pendientes</span>
          </div>
        </div>
        
        <div className="gp-kpi-card gp-kpi-info">
          <div className="gp-kpi-icon">🆕</div>
          <div className="gp-kpi-content">
            <span className="gp-kpi-value">{recientes24h?.cantidad || 0}</span>
            <span className="gp-kpi-label">Últimas 24h</span>
          </div>
        </div>
        
        <div className="gp-kpi-card gp-kpi-neutral">
          <div className="gp-kpi-icon">⏱️</div>
          <div className="gp-kpi-content">
            <span className="gp-kpi-value">{formatearDias(tiempoResolucion?.dias_promedio)}</span>
            <span className="gp-kpi-label">Tiempo Promedio</span>
          </div>
        </div>
        
        <div className="gp-kpi-card gp-kpi-neutral">
          <div className="gp-kpi-icon">👥</div>
          <div className="gp-kpi-content">
            <span className="gp-kpi-value">{general?.usuarios_activos || 0}</span>
            <span className="gp-kpi-label">Usuarios Activos</span>
          </div>
        </div>
      </div>

      {/* Gráficos en grid */}
      <div className="gp-dashboard-grid">
        
        {/* Reportes por Estado */}
        <div className="gp-dashboard-card">
          <h3 className="gp-card-title">📊 Reportes por Estado</h3>
          <div className="gp-chart-bars">
            {porEstado?.map((item, idx) => (
              <div key={idx} className="gp-bar-item">
                <div className="gp-bar-label">
                  <span className="gp-bar-dot" style={{ backgroundColor: getColorEstado(item.estado) }}></span>
                  <span>{item.estado.replace('_', ' ')}</span>
                </div>
                <div className="gp-bar-container">
                  <div 
                    className="gp-bar-fill" 
                    style={{ 
                      width: `${calcularPorcentaje(item.cantidad, general?.total_reportes)}%`,
                      backgroundColor: getColorEstado(item.estado)
                    }}
                  ></div>
                </div>
                <span className="gp-bar-value">{item.cantidad}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reportes por Tipo */}
        <div className="gp-dashboard-card">
          <h3 className="gp-card-title">📂 Top 10 Tipos de Reporte</h3>
          <div className="gp-chart-bars">
            {porTipo?.slice(0, 10).map((item, idx) => (
              <div key={idx} className="gp-bar-item">
                <div className="gp-bar-label">
                  <span>{item.tipo.replace('_', ' ')}</span>
                </div>
                <div className="gp-bar-container">
                  <div 
                    className="gp-bar-fill gp-bar-tipo" 
                    style={{ 
                      width: `${calcularPorcentaje(item.cantidad, porTipo[0]?.cantidad)}%`
                    }}
                  ></div>
                </div>
                <span className="gp-bar-value">{item.cantidad}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reportes por Dependencia */}
        <div className="gp-dashboard-card">
          <h3 className="gp-card-title">🏢 Reportes por Dependencia</h3>
          <div className="gp-chart-bars">
            {porDependencia?.map((item, idx) => (
              <div key={idx} className="gp-bar-item">
                <div className="gp-bar-label">
                  <span>{item.dependencia.replace('_', ' ')}</span>
                </div>
                <div className="gp-bar-container">
                  <div 
                    className="gp-bar-fill gp-bar-dep" 
                    style={{ 
                      width: `${calcularPorcentaje(item.cantidad, porDependencia[0]?.cantidad)}%`
                    }}
                  ></div>
                </div>
                <span className="gp-bar-value">{item.cantidad}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reportes por Prioridad */}
        <div className="gp-dashboard-card">
          <h3 className="gp-card-title">🎯 Distribución por Prioridad</h3>
          <div className="gp-priority-grid">
            {porPrioridad?.map((item, idx) => {
              const colors = {
                'critica': { bg: '#fef2f2', border: '#ef4444', text: '#dc2626' },
                'alta': { bg: '#fffbeb', border: '#f59e0b', text: '#d97706' },
                'normal': { bg: '#f0fdf4', border: '#22c55e', text: '#16a34a' }
              };
              const c = colors[item.prioridad] || colors.normal;
              return (
                <div 
                  key={idx} 
                  className="gp-priority-card"
                  style={{ backgroundColor: c.bg, borderColor: c.border }}
                >
                  <span className="gp-priority-icon">
                    {item.prioridad === 'critica' ? '🔴' : item.prioridad === 'alta' ? '🟡' : '🟢'}
                  </span>
                  <span className="gp-priority-value" style={{ color: c.text }}>
                    {item.cantidad}
                  </span>
                  <span className="gp-priority-label">
                    {item.prioridad.charAt(0).toUpperCase() + item.prioridad.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tendencia Temporal */}
        <div className="gp-dashboard-card gp-card-wide">
          <div className="gp-card-header">
            <h3 className="gp-card-title">📈 Tendencia de Reportes</h3>
            <div className="gp-filter-tabs">
              <button 
                className={`gp-filter-tab ${filtroFecha === 'semana' ? 'active' : ''}`}
                onClick={() => setFiltroFecha('semana')}
              >
                Última Semana
              </button>
              <button 
                className={`gp-filter-tab ${filtroFecha === 'mes' ? 'active' : ''}`}
                onClick={() => setFiltroFecha('mes')}
              >
                Último Mes
              </button>
            </div>
          </div>
          <div className="gp-trend-chart">
            {datosTendencia?.length > 0 ? (
              <div className="gp-trend-bars">
                {datosTendencia.map((item, idx) => (
                  <div key={idx} className="gp-trend-bar-wrapper">
                    <div 
                      className="gp-trend-bar"
                      style={{ height: `${(item.cantidad / maxTendencia) * 100}%` }}
                      title={`${item.fecha}: ${item.cantidad} reportes`}
                    >
                      <span className="gp-trend-value">{item.cantidad}</span>
                    </div>
                    <span className="gp-trend-label">
                      {new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-MX', { 
                        day: '2-digit', 
                        month: 'short' 
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="gp-no-data">
                <span>📭</span>
                <p>No hay datos para el período seleccionado</p>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas de Resolución */}
        <div className="gp-dashboard-card">
          <h3 className="gp-card-title">⏱️ Tiempos de Resolución</h3>
          <div className="gp-resolution-stats">
            <div className="gp-stat-row">
              <span className="gp-stat-label">⚡ Más rápido</span>
              <span className="gp-stat-value gp-stat-success">
                {formatearDias(tiempoResolucion?.dias_minimo)}
              </span>
            </div>
            <div className="gp-stat-row">
              <span className="gp-stat-label">📊 Promedio</span>
              <span className="gp-stat-value gp-stat-info">
                {formatearDias(tiempoResolucion?.dias_promedio)}
              </span>
            </div>
            <div className="gp-stat-row">
              <span className="gp-stat-label">🐢 Más lento</span>
              <span className="gp-stat-value gp-stat-warning">
                {formatearDias(tiempoResolucion?.dias_maximo)}
              </span>
            </div>
          </div>
        </div>

        {/* Resumen de Personal */}
        <div className="gp-dashboard-card">
          <h3 className="gp-card-title">👥 Personal del Sistema</h3>
          <div className="gp-staff-stats">
            <div className="gp-staff-item">
              <span className="gp-staff-icon">👷</span>
              <span className="gp-staff-value">{general?.total_funcionarios || 0}</span>
              <span className="gp-staff-label">Funcionarios</span>
            </div>
            <div className="gp-staff-item">
              <span className="gp-staff-icon">👔</span>
              <span className="gp-staff-value">{general?.total_supervisores || 0}</span>
              <span className="gp-staff-label">Supervisores</span>
            </div>
            <div className="gp-staff-item">
              <span className="gp-staff-icon">🏢</span>
              <span className="gp-staff-value">{general?.dependencias_activas || 0}</span>
              <span className="gp-staff-label">Dependencias</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
