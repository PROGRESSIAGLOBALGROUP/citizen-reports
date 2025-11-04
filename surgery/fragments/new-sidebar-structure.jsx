      {/* Panel Lateral Izquierdo - REIMAGINADO */}
      <aside style={{
        width: '360px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRight: '1px solid #334155',
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* ===================== SECTION 1: TABS + CALENDAR ===================== */}
        <div style={{
          padding: '20px',
          borderBottom: '2px solid #334155'
        }}>
          {/* Header Title */}
          <h1 style={{ 
            margin: '0 0 20px 0', 
            fontSize: '26px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.5px'
          }}>
            📍 Reportes
          </h1>

          {/* STATUS TABS: Abiertos | Cerrados | Todos */}
          <div style={{
            display: 'flex',
            gap: '6px',
            background: '#1e293b',
            padding: '5px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #334155'
          }}>
            {[
              { id: 'abiertos', label: 'Abiertos', icon: '🔴', color: '#3b82f6' },
              { id: 'cerrados', label: 'Cerrados', icon: '✅', color: '#10b981' },
              { id: 'todos', label: 'Todos', icon: '📊', color: '#8b5cf6' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setModoVista(tab.id)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: modoVista === tab.id 
                    ? `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}dd 100%)`
                    : 'transparent',
                  color: modoVista === tab.id ? 'white' : '#94a3b8',
                  border: modoVista === tab.id ? `2px solid ${tab.color}` : '1px solid #475569',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '700',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: modoVista === tab.id ? `0 0 20px ${tab.color}40` : 'none'
                }}
                onMouseOver={(e) => {
                  if (modoVista !== tab.id) {
                    e.target.style.background = '#334155';
                    e.target.style.color = '#cbd5e1';
                  }
                }}
                onMouseOut={(e) => {
                  if (modoVista !== tab.id) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#94a3b8';
                  }
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* CALENDAR SECTION */}
          <div style={{
            background: '#1e293b',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '600' }}>📅</span>
              <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '600' }}>
                {new Date(añoSeleccionado, mesSeleccionado).toLocaleDateString('es-ES', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px'
            }}>
              <button
                onClick={() => {
                  if (mesSeleccionado === 0) {
                    setMesSeleccionado(11);
                    setAñoSeleccionado(añoSeleccionado - 1);
                  } else {
                    setMesSeleccionado(mesSeleccionado - 1);
                  }
                }}
                aria-label="Mes anterior"
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #334155 0%, #1f2937 100%)',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#60a5fa',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #475569 0%, #334155 100%)';
                  e.target.style.boxShadow = '0 4px 12px rgba(96, 165, 250, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #334155 0%, #1f2937 100%)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                }}
              >
                ‹
              </button>
              
              <input
                type="month"
                value={`${añoSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}`}
                onChange={(e) => {
                  const [año, mes] = e.target.value.split('-').map(Number);
                  const hoy = new Date();
                  const mesActual = hoy.getMonth();
                  const añoActual = hoy.getFullYear();
                  
                  if (año > añoActual || (año === añoActual && mes - 1 > mesActual)) {
                    return;
                  }
                  
                  setAñoSeleccionado(año);
                  setMesSeleccionado(mes - 1);
                }}
                max={(() => {
                  const hoy = new Date();
                  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
                })()}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#cbd5e1',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#60a5fa';
                  e.target.style.boxShadow = '0 0 12px rgba(96, 165, 250, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#475569';
                  e.target.style.boxShadow = 'none';
                }}
              />
              
              <button
                onClick={() => {
                  const hoy = new Date();
                  const mesActual = hoy.getMonth();
                  const añoActual = hoy.getFullYear();
                  
                  if (añoSeleccionado < añoActual || 
                      (añoSeleccionado === añoActual && mesSeleccionado < mesActual)) {
                    if (mesSeleccionado === 11) {
                      setMesSeleccionado(0);
                      setAñoSeleccionado(añoSeleccionado + 1);
                    } else {
                      setMesSeleccionado(mesSeleccionado + 1);
                    }
                  }
                }}
                disabled={esMesActual}
                aria-label="Mes siguiente"
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: esMesActual 
                    ? 'rgba(51, 65, 85, 0.5)' 
                    : 'linear-gradient(135deg, #334155 0%, #1f2937 100%)',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  cursor: esMesActual ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: esMesActual ? '#64748b' : '#60a5fa',
                  opacity: esMesActual ? 0.5 : 1,
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
                onMouseOver={(e) => {
                  if (!esMesActual) {
                    e.target.style.background = 'linear-gradient(135deg, #475569 0%, #334155 100%)';
                    e.target.style.boxShadow = '0 4px 12px rgba(96, 165, 250, 0.2)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!esMesActual) {
                    e.target.style.background = 'linear-gradient(135deg, #334155 0%, #1f2937 100%)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                  }
                }}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* ===================== SECTION 2: SHOW ALL + SUMMARY ===================== */}
        <div style={{
          padding: '20px',
          borderBottom: '2px solid #334155',
          background: '#0f172a'
        }}>
          {/* SHOW ALL / SELECT ALL BUTTON */}
          <button
            onClick={toggleTodosFiltros}
            style={{
              width: '100%',
              padding: '14px 16px',
              marginBottom: '16px',
              background: (filtrosActivos.length === tipos.length && tipos.every(tipo => filtrosActivos.includes(tipo)))
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              border: '2px solid #8b5cf6',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.target.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.5)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.3)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: '16px' }}>
              {(filtrosActivos.length === tipos.length && tipos.every(tipo => filtrosActivos.includes(tipo))) ? '✓' : '+'}
            </span>
            {(filtrosActivos.length === tipos.length && tipos.every(tipo => filtrosActivos.includes(tipo))) ? 'Seleccionar Todos' : 'Mostrar Todos'}
          </button>

          {/* SUMMARY CARDS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            {/* Card 1: Total */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #60a5fa',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
              transition: 'all 0.25s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
            }}
            >
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
                {reportesVisibles.length}
              </div>
              <div style={{ fontSize: '11px', color: '#dbeafe', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {modoVista === 'abiertos' ? 'Abiertos' : modoVista === 'cerrados' ? 'Cerrados' : 'Total'}
              </div>
            </div>

            {/* Card 2: High Priority */}
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #f87171',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
              transition: 'all 0.25s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
            }}
            >
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
                {reportesPrioridad.alta || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#fee2e2', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Alta Prioridad
              </div>
            </div>
          </div>
        </div>

        {/* ===================== SECTION 3: CATEGORIES + PRIORITIES ===================== */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          background: '#0f172a'
        }}>
          {/* -------- SECTION 3A: CATEGORIES -------- */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{
              margin: '0 0 14px 0',
              fontSize: '16px',
              fontWeight: '700',
              color: '#cbd5e1',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>📋</span> Categorías
            </h3>
            
            {/* ADR-0009: Categorías dinámicas */}
            {categorias.map((categoria) => {
              const colapsada = categoriasColapsadas.has(categoria.id);
              const tiposEnCategoria = categoria.tipos.map(t => t.tipo);
              const reportesEnCategoria = reportes.filter(r => tiposEnCategoria.includes(r.tipo));
              
              return (
                <div key={categoria.id} style={{ marginBottom: '12px' }}>
                  {/* Category Header - Clickable */}
                  <div 
                    onClick={() => {
                      setCategoriasColapsadas(prev => {
                        const next = new Set(prev);
                        if (next.has(categoria.id)) {
                          next.delete(categoria.id);
                        } else {
                          next.add(categoria.id);
                        }
                        return next;
                      });
                    }}
                    style={{
                      padding: '12px 14px',
                      background: 'linear-gradient(135deg, #334155 0%, #1f2937 100%)',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #475569 0%, #334155 100%)';
                      e.currentTarget.style.borderColor = '#60a5fa';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(96, 165, 250, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #334155 0%, #1f2937 100%)';
                      e.currentTarget.style.borderColor = '#475569';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <span style={{ fontSize: '18px' }}>{categoria.icono}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1' }}>
                        {categoria.nombre}
                      </span>
                      {reportesEnCategoria.length > 0 && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: '#60a5fa',
                          background: 'rgba(96, 165, 250, 0.15)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {reportesEnCategoria.length}
                        </span>
                      )}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      transition: 'transform 0.2s ease',
                      transform: colapsada ? 'rotate(-90deg)' : 'rotate(0deg)'
                    }}>
                      ▼
                    </span>
                  </div>

                  {/* Types List - Expandable */}
                  {!colapsada && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      marginTop: '6px',
                      paddingLeft: '8px',
                      borderLeft: '2px solid #475569'
                    }}>
                      {categoria.tipos.map((tipoObj) => {
                        const tipo = tipoObj.tipo;
                        const info = tiposInfo[tipo] || { 
                          nombre: tipoObj.nombre, 
                          icono: tipoObj.icono, 
                          color: tipoObj.color 
                        };
                        const reportesDelTipo = reportes.filter(r => r.tipo === tipo);
                        const isSelected = filtrosActivos.includes(tipo);

                        return (
                          <div 
                            key={tipo}
                            onClick={() => toggleFiltro(tipo)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 12px',
                              background: isSelected 
                                ? `linear-gradient(135deg, ${info.color}20 0%, ${info.color}10 100%)`
                                : 'transparent',
                              border: isSelected 
                                ? `1.5px solid ${info.color}` 
                                : '1px solid #475569',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: isSelected ? `0 0 12px ${info.color}30` : 'none'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = `linear-gradient(135deg, ${info.color}15 0%, ${info.color}05 100%)`;
                              e.currentTarget.style.borderColor = info.color;
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = isSelected 
                                ? `linear-gradient(135deg, ${info.color}20 0%, ${info.color}10 100%)`
                                : 'transparent';
                              e.currentTarget.style.borderColor = isSelected ? info.color : '#475569';
                            }}
                          >
                            <span style={{ fontSize: '20px' }}>{info.icono}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1' }}>
                                {info.nombre}
                              </div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                {reportesDelTipo.length} reportes
                              </div>
                            </div>
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '4px',
                              background: isSelected ? info.color : 'rgba(96, 165, 250, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              color: isSelected ? 'white' : 'transparent',
                              fontWeight: '700',
                              transition: 'all 0.2s ease',
                              border: isSelected ? `1px solid ${info.color}` : '1px solid #334155',
                              boxShadow: isSelected ? `0 0 8px ${info.color}50` : 'none'
                            }}>
                              ✓
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* -------- SECTION 3B: PRIORITIES -------- */}
          <div>
            <h3 style={{
              margin: '0 0 14px 0',
              fontSize: '16px',
              fontWeight: '700',
              color: '#cbd5e1',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>🎯</span> Prioridades
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { nivel: 'alta', icon: '🔴', color: '#ef4444', gradientStart: '#7f1d1d', label: 'Alta' },
                { nivel: 'media', icon: '🟠', color: '#f59e0b', gradientStart: '#78350f', label: 'Media' },
                { nivel: 'baja', icon: '🟢', color: '#10b981', gradientStart: '#064e3b', label: 'Baja' }
              ].map((priority) => {
                const isActive = prioridadesActivas.includes(priority.nivel);
                const count = reportesPrioridadTotal[priority.nivel] || 0;

                return (
                  <div
                    key={priority.nivel}
                    onClick={() => togglePrioridad(priority.nivel)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      background: isActive
                        ? `linear-gradient(135deg, ${priority.gradientStart} 0%, ${priority.color}20 100%)`
                        : 'linear-gradient(135deg, #334155 0%, #1f2937 100%)',
                      border: isActive ? `2px solid ${priority.color}` : '1px solid #475569',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? `0 0 16px ${priority.color}40` : 'none'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${priority.gradientStart} 0%, ${priority.color}25 100%)`;
                      e.currentTarget.style.borderColor = priority.color;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = isActive
                        ? `linear-gradient(135deg, ${priority.gradientStart} 0%, ${priority.color}20 100%)`
                        : 'linear-gradient(135deg, #334155 0%, #1f2937 100%)';
                      e.currentTarget.style.borderColor = isActive ? priority.color : '#475569';
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{priority.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1' }}>
                        {priority.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {count} reportes
                      </div>
                    </div>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: isActive ? priority.color : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: isActive ? 'white' : '#94a3b8',
                      fontWeight: '700',
                      transition: 'all 0.2s ease',
                      border: '1px solid #334155',
                      boxShadow: isActive ? `0 0 12px ${priority.color}50` : 'none'
                    }}>
                      {isActive ? '✓' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
