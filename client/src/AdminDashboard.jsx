import React, { useState, useEffect, useMemo } from 'react';

/**
 * AdminDashboard - Premium World-Class Analytics Dashboard v2
 * 
 * Redesigned with inline styles for guaranteed rendering
 * Pure SVG charts, no external dependencies
 */

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES - Inline para garantizar renderizado correcto
// ═══════════════════════════════════════════════════════════════════════════════

const styles = {
  // Container principal
  dashboard: {
    padding: '24px',
    background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)',
    minHeight: '100%',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  
  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  periodToggle: {
    display: 'flex',
    background: '#fff',
    borderRadius: '10px',
    padding: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
  },
  toggleBtn: (active) => ({
    padding: '8px 16px',
    border: 'none',
    background: active ? '#3b82f6' : 'transparent',
    color: active ? '#fff' : '#64748b',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  }),
  refreshBtn: (spinning) => ({
    width: '40px',
    height: '40px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    borderRadius: '10px',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    animation: spinning ? 'spin 1s linear infinite' : 'none',
  }),
  exportBtn: {
    padding: '10px 18px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.2s ease',
  },

  // KPI Grid
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  kpiCard: (color) => {
    const colors = {
      blue: { bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', glow: 'rgba(59, 130, 246, 0.3)' },
      orange: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245, 158, 11, 0.3)' },
      green: { bg: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16, 185, 129, 0.3)' },
      cyan: { bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', glow: 'rgba(6, 182, 212, 0.3)' },
    };
    return {
      background: colors[color]?.bg || colors.blue.bg,
      borderRadius: '16px',
      padding: '24px',
      color: '#fff',
      boxShadow: `0 10px 30px ${colors[color]?.glow || colors.blue.glow}`,
      position: 'relative',
      overflow: 'hidden',
    };
  },
  kpiContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    position: 'relative',
    zIndex: 1,
  },
  kpiIcon: {
    fontSize: '42px',
    opacity: 0.9,
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
  },
  kpiInfo: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: '13px',
    opacity: 0.9,
    fontWeight: '500',
    marginBottom: '4px',
  },
  kpiValue: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: 1.1,
    marginBottom: '4px',
  },
  kpiTrend: {
    fontSize: '12px',
    opacity: 0.85,
    fontWeight: '500',
  },
  kpiDecoration: {
    position: 'absolute',
    right: '-20px',
    bottom: '-20px',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
  },

  // Charts Grid
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  chartCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
  },
  chartHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f1f5f9',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  chartIcon: {
    fontSize: '20px',
  },

  // Trend Chart
  trendCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
    marginBottom: '24px',
  },

  // Bottom Grid
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },

  // Loading / Error states
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    background: '#fff',
    borderRadius: '16px',
    margin: '24px',
    textAlign: 'center',
  },
  retryBtn: {
    padding: '12px 24px',
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '16px',
  },
};

// CSS Keyframes (inyectado una vez)
const injectKeyframes = () => {
  if (document.getElementById('dashboard-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'dashboard-keyframes';
  style.textContent = `
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  `;
  document.head.appendChild(style);
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodo, setPeriodo] = useState('semanal');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    injectKeyframes();
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error cargando métricas');
      const result = await res.json();
      setData(result);
      setLastUpdate(new Date());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const chartData = useMemo(() => {
    if (!data) return null;

    const estadoCounts = { pendiente: 0, abierto: 0, en_proceso: 0, cerrado: 0 };
    (data.porEstado || []).forEach(item => {
      const key = item.estado?.toLowerCase().replace(' ', '_') || 'pendiente';
      estadoCounts[key] = item.cantidad;
    });

    const totalReportes = Object.values(estadoCounts).reduce((a, b) => a + b, 0);
    const tendencia = periodo === 'semanal' ? (data.tendenciaSemanal || []) : (data.tendenciaMensual || []);

    return {
      estadoCounts,
      totalReportes,
      tendencia,
      porTipo: data.porTipo || [],
      porDependencia: data.porDependencia || [],
      general: data.general || {},
      tiempoResolucion: data.tiempoResolucion || {},
      personal: data.personal || {},
      cierresPendientes: data.cierresPendientes?.cantidad || 0,
      recientes24h: data.recientes24h?.cantidad || 0,
      porPrioridad: data.porPrioridad || []
    };
  }, [data, periodo]);

  const exportarCSV = () => {
    if (!chartData) return;
    const BOM = '\uFEFF';
    const headers = ['Métrica', 'Valor', 'Categoría'];
    const rows = [
      ['Total Reportes', chartData.totalReportes, 'General'],
      ['Pendientes', chartData.estadoCounts.pendiente, 'Estado'],
      ['Abiertos', chartData.estadoCounts.abierto, 'Estado'],
      ['En Proceso', chartData.estadoCounts.en_proceso, 'Estado'],
      ['Cerrados', chartData.estadoCounts.cerrado, 'Estado'],
      ['Funcionarios', chartData.personal.funcionarios || 0, 'Personal'],
      ['Supervisores', chartData.personal.supervisores || 0, 'Personal'],
      ['Tiempo Promedio (días)', (chartData.tiempoResolucion.dias_promedio || 0).toFixed(2), 'Rendimiento'],
    ];
    chartData.porTipo.forEach(item => rows.push([item.tipo, item.cantidad, 'Por Tipo']));
    chartData.porDependencia.forEach(item => rows.push([item.dependencia, item.cantidad, 'Por Dependencia']));

    const csv = BOM + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div style={styles.dashboard}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ color: '#64748b', fontSize: '15px' }}>Cargando métricas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.dashboard}>
        <div style={styles.errorContainer}>
          <span style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</span>
          <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>Error cargando métricas</h3>
          <p style={{ color: '#64748b', margin: 0 }}>{error}</p>
          <button style={styles.retryBtn} onClick={() => fetchData()}>🔄 Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>
            <span>📊</span> Dashboard de Métricas
          </h1>
          <p style={styles.subtitle}>
            Última actualización: {lastUpdate?.toLocaleTimeString('es-MX')}
          </p>
        </div>
        <div style={styles.headerActions}>
          <div style={styles.periodToggle}>
            <button 
              style={styles.toggleBtn(periodo === 'semanal')}
              onClick={() => setPeriodo('semanal')}
            >
              7 días
            </button>
            <button 
              style={styles.toggleBtn(periodo === 'mensual')}
              onClick={() => setPeriodo('mensual')}
            >
              30 días
            </button>
          </div>
          <button 
            style={styles.refreshBtn(refreshing)}
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Actualizar"
          >
            🔄
          </button>
          <button style={styles.exportBtn} onClick={exportarCSV}>
            📥 Exportar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <KPICard 
          icon="📋" 
          label="Total Reportes" 
          value={chartData.totalReportes} 
          trend={`+${chartData.recientes24h} hoy`}
          color="blue"
        />
        <KPICard 
          icon="⏳" 
          label="Pendientes" 
          value={chartData.estadoCounts.pendiente + chartData.estadoCounts.abierto} 
          trend="Requieren atención"
          color="orange"
        />
        <KPICard 
          icon="✅" 
          label="Resueltos" 
          value={chartData.estadoCounts.cerrado} 
          trend={`${Math.round((chartData.estadoCounts.cerrado / Math.max(chartData.totalReportes, 1)) * 100)}% del total`}
          color="green"
        />
        <KPICard 
          icon="⏱️" 
          label="Tiempo Promedio" 
          value={`${(chartData.tiempoResolucion.dias_promedio || 0).toFixed(1)}d`} 
          trend={chartData.tiempoResolucion.dias_promedio > 3 ? 'Mejorar SLA' : 'Dentro de SLA'}
          color="cyan"
        />
      </div>

      {/* Charts Row */}
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <span style={styles.chartIcon}>🍩</span>
            <h3 style={styles.chartTitle}>Distribución por Estado</h3>
          </div>
          <DonutChart data={chartData.estadoCounts} total={chartData.totalReportes} />
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <span style={styles.chartIcon}>📊</span>
            <h3 style={styles.chartTitle}>Top Tipos de Reporte</h3>
          </div>
          <BarChart data={chartData.porTipo} />
        </div>
      </div>

      {/* Trend Chart */}
      <div style={styles.trendCard}>
        <div style={styles.chartHeader}>
          <span style={styles.chartIcon}>📈</span>
          <h3 style={styles.chartTitle}>
            Tendencia de Reportes ({periodo === 'semanal' ? 'Últimos 7 días' : 'Últimos 30 días'})
          </h3>
        </div>
        <TrendChart data={chartData.tendencia} />
      </div>

      {/* Bottom Grid */}
      <div style={styles.bottomGrid}>
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <span style={styles.chartIcon}>🏢</span>
            <h3 style={styles.chartTitle}>Reportes por Dependencia</h3>
          </div>
          <DependenciasList data={chartData.porDependencia} total={chartData.totalReportes} />
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <span style={styles.chartIcon}>🎯</span>
            <h3 style={styles.chartTitle}>Por Prioridad</h3>
          </div>
          <PriorityBars data={chartData.porPrioridad} />
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <span style={styles.chartIcon}>👥</span>
            <h3 style={styles.chartTitle}>Personal Activo</h3>
          </div>
          <PersonalStats data={chartData.personal} cierresPendientes={chartData.cierresPendientes} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function KPICard({ icon, label, value, trend, color }) {
  return (
    <div style={styles.kpiCard(color)}>
      <div style={styles.kpiContent}>
        <div style={styles.kpiIcon}>{icon}</div>
        <div style={styles.kpiInfo}>
          <div style={styles.kpiLabel}>{label}</div>
          <div style={styles.kpiValue}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
          <div style={styles.kpiTrend}>{trend}</div>
        </div>
      </div>
      <div style={styles.kpiDecoration}></div>
    </div>
  );
}

function DonutChart({ data, total }) {
  const segments = [
    { key: 'cerrado', label: 'Cerrado', color: '#10b981', value: data.cerrado },
    { key: 'abierto', label: 'Abierto', color: '#ef4444', value: data.abierto },
    { key: 'pendiente', label: 'Pendiente', color: '#f59e0b', value: data.pendiente },
    { key: 'en_proceso', label: 'En Proceso', color: '#3b82f6', value: data.en_proceso },
  ].filter(s => s.value > 0);

  let cumulative = 0;
  const arcs = segments.map(seg => {
    const percent = total > 0 ? (seg.value / total) * 100 : 0;
    const startAngle = cumulative * 3.6;
    cumulative += percent;
    const endAngle = cumulative * 3.6;
    return { ...seg, percent, startAngle, endAngle };
  });

  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const createArc = (startAngle, endAngle, outerR, innerR) => {
    if (endAngle - startAngle >= 359.99) {
      // Full circle
      return `
        M ${100 - outerR} 100 A ${outerR} ${outerR} 0 1 1 ${100 + outerR} 100 A ${outerR} ${outerR} 0 1 1 ${100 - outerR} 100
        M ${100 - innerR} 100 A ${innerR} ${innerR} 0 1 0 ${100 + innerR} 100 A ${innerR} ${innerR} 0 1 0 ${100 - innerR} 100
      `;
    }
    const start = polarToCartesian(100, 100, outerR, endAngle);
    const end = polarToCartesian(100, 100, outerR, startAngle);
    const innerStart = polarToCartesian(100, 100, innerR, endAngle);
    const innerEnd = polarToCartesian(100, 100, innerR, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${outerR} ${outerR} 0 ${largeArc} 0 ${end.x} ${end.y} L ${innerEnd.x} ${innerEnd.y} A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y} Z`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg viewBox="0 0 200 200" style={{ width: '180px', height: '180px' }}>
        <circle cx="100" cy="100" r="70" fill="none" stroke="#e2e8f0" strokeWidth="30" />
        {arcs.map((arc, i) => (
          <path 
            key={arc.key} 
            d={createArc(arc.startAngle, arc.endAngle, 85, 55)} 
            fill={arc.color}
            style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
          />
        ))}
        <text x="100" y="95" textAnchor="middle" style={{ fontSize: '28px', fontWeight: '700', fill: '#1e293b' }}>
          {total}
        </text>
        <text x="100" y="115" textAnchor="middle" style={{ fontSize: '12px', fill: '#64748b' }}>
          Total
        </text>
      </svg>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {arcs.map(seg => (
          <div key={seg.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: seg.color }}></span>
            <span style={{ color: '#475569', minWidth: '80px' }}>{seg.label}</span>
            <span style={{ fontWeight: '600', color: '#1e293b' }}>{seg.value}</span>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{seg.percent.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No hay datos</div>;
  }

  const maxValue = Math.max(...data.map(d => d.cantidad), 1);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];
  
  const formatTipo = (tipo) => (tipo || 'Sin tipo').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).substring(0, 18);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.slice(0, 8).map((item, idx) => (
        <div key={item.tipo || idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '110px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {formatTipo(item.tipo)}
          </div>
          <div style={{ flex: 1, height: '24px', background: '#f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{
              width: `${(item.cantidad / maxValue) * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${colors[idx % colors.length]}, ${colors[(idx + 1) % colors.length]})`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: '10px',
              minWidth: '40px',
              transition: 'width 0.5s ease',
            }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#fff' }}>{item.cantidad}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No hay datos de tendencia disponibles</div>;
  }

  const maxValue = Math.max(...data.map(d => d.cantidad), 1);
  const height = 180;
  const width = 700;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2),
    y: padding.top + chartH - (d.cantidad / maxValue) * chartH,
    value: d.cantidad,
    fecha: d.fecha
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;

  const yTicks = [0, 0.5, 1].map(t => ({
    value: Math.round(maxValue * t),
    y: padding.top + chartH - t * chartH
  }));

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: '400px', height: '200px' }}>
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={padding.left} y1={tick.y} x2={width - padding.right} y2={tick.y} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={padding.left - 10} y={tick.y + 4} textAnchor="end" style={{ fontSize: '11px', fill: '#94a3b8' }}>{tick.value}</text>
          </g>
        ))}
        
        <path d={areaPath} fill="url(#trendGradient)" />
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
        
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
            <title>{formatDate(p.fecha)}: {p.value} reportes</title>
          </g>
        ))}
        
        {points.filter((_, i) => data.length <= 10 || i % Math.ceil(data.length / 7) === 0).map((p, i) => (
          <text key={i} x={p.x} y={height - 10} textAnchor="middle" style={{ fontSize: '10px', fill: '#94a3b8' }}>
            {formatDate(p.fecha)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function DependenciasList({ data, total }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No hay dependencias</div>;
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
  const formatDep = (d) => (d || 'Sin asignar').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {data.map((item, idx) => {
        const percent = total > 0 ? (item.cantidad / total) * 100 : 0;
        return (
          <div key={item.dependencia || idx}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[idx % colors.length] }}></span>
                <span style={{ fontSize: '14px', color: '#475569' }}>{formatDep(item.dependencia)}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{item.cantidad}</span>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>{percent.toFixed(0)}%</span>
              </div>
            </div>
            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${percent}%`, height: '100%', background: colors[idx % colors.length], borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PriorityBars({ data }) {
  const config = {
    critica: { label: 'Crítica', color: '#ef4444', icon: '🔴' },
    alta: { label: 'Alta', color: '#f59e0b', icon: '🟠' },
    normal: { label: 'Normal', color: '#10b981', icon: '🟢' }
  };

  const total = data.reduce((sum, item) => sum + item.cantidad, 0) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {Object.entries(config).map(([key, cfg]) => {
        const item = data.find(d => d.prioridad === key);
        const count = item?.cantidad || 0;
        const percent = (count / total) * 100;
        
        return (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{cfg.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>{cfg.label}</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{count}</span>
            </div>
            <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${percent}%`, height: '100%', background: cfg.color, borderRadius: '5px', transition: 'width 0.5s ease' }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PersonalStats({ data, cierresPendientes }) {
  const stats = [
    { icon: '👷', label: 'Funcionarios', value: data.funcionarios || 0, color: '#3b82f6' },
    { icon: '👔', label: 'Supervisores', value: data.supervisores || 0, color: '#8b5cf6' },
    { icon: '🛡️', label: 'Administradores', value: data.admins || 0, color: '#10b981' },
    { icon: '📝', label: 'Cierres Pendientes', value: cierresPendientes, color: '#f59e0b' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
      {stats.map((stat, idx) => (
        <div key={idx} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '16px',
          background: `${stat.color}10`,
          borderRadius: '12px',
          border: `1px solid ${stat.color}20`,
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: `${stat.color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
          }}>
            {stat.icon}
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
