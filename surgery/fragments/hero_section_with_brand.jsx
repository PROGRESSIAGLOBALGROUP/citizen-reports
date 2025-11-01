          {/* HERO SECTION - Branding + Identidad */}
          <div style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
            padding: esMobil ? '16px' : '20px',
            borderBottom: '3px solid #1e3a8a',
            color: 'white',
            flexShrink: 0
          }}>
            {/* Brand Header */}
            <div style={{
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: esMobil ? '11px' : '10px',
                  opacity: 0.9,
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  🌍 PROGRESSIA
                </div>
                <h1 style={{
                  margin: '4px 0 0 0',
                  fontSize: esMobil ? '18px' : '20px',
                  fontWeight: '800',
                  lineHeight: '1.2'
                }}>
                  Citizen-Reports
                </h1>
              </div>
              <div style={{
                fontSize: '32px',
                lineHeight: '1'
              }}>
                📍
              </div>
            </div>
            
            {/* Location Badge */}
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              border: '1px solid rgba(255,255,255,0.3)',
              textAlign: 'center'
            }}>
              🏛️ H. Ayuntamiento de Jantetelco, Morelos, México
            </div>
          </div>
          
          {/* Contenido scrolleable del panel */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: esMobil ? '12px' : '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Modo Vista + Selector de Mes/Año - ARRIBA */}
            <div style={{
              padding: '10px',
              background: modoVista === 'abiertos' ? '#dbeafe' : modoVista === 'cerrados' ? '#fef3c7' : '#f3f4f6',
              borderRadius: '8px',
              border: `1px solid ${modoVista === 'abiertos' ? '#93c5fd' : modoVista === 'cerrados' ? '#fcd34d' : '#d1d5db'}`
            }}>
              {/* Toggle Abiertos/Cerrados/Todos */}
              <div style={{
                display: 'flex',
                gap: '2px',
                marginBottom: '8px',
                background: 'white',
                borderRadius: '6px',
                padding: '2px',
                border: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setModoVista('abiertos')}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    background: modoVista === 'abiertos' ? '#3b82f6' : 'transparent',
                    color: modoVista === 'abiertos' ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}
                >
                  ● Abiertos
                </button>
                <button
                  onClick={() => setModoVista('cerrados')}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    background: modoVista === 'cerrados' ? '#f59e0b' : 'transparent',
                    color: modoVista === 'cerrados' ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}
                >
                  ✓ Cerrados
                </button>
                <button
                  onClick={() => setModoVista('todos')}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    background: modoVista === 'todos' ? '#6b7280' : 'transparent',
                    color: modoVista === 'todos' ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}
                >
                  ◉ Todos
                </button>
              </div>
              
              {/* Selector de Mes/Año */}
              <div style={{
                display: 'flex',
                gap: '4px',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => setMesSeleccionado(mesSeleccionado === 0 ? 11 : mesSeleccionado - 1)}
                  style={{
                    padding: '4px 8px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  &lt;
                </button>
                <input
                  type="month"
                  value={`${añoSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split('-');
                    setAñoSeleccionado(parseInt(year));
                    setMesSeleccionado(parseInt(month) - 1);
                  }}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                />
                <button
                  onClick={() => setMesSeleccionado(mesSeleccionado === 11 ? 0 : mesSeleccionado + 1)}
                  style={{
                    padding: '4px 8px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  &gt;
                </button>
              </div>
            </div>

            {/* Resumen - SEGUNDO */}
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Resumen Actual
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontSize: '12px'
                }}>
                  <div style={{ fontWeight: '600', color: '#1e40af' }}>{reportesVisibles.length}</div>
                  <div style={{ fontSize: '10px', color: '#0c4a6e' }}>Visibles</div>
                </div>
                <div style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#fecaca',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontSize: '12px'
                }}>
                  <div style={{ fontWeight: '600', color: '#7f1d1d' }}>{reportesPrioridadTotal.alta || 0}</div>
                  <div style={{ fontSize: '10px', color: '#991b1b' }}>Alta</div>
                </div>
              </div>
            </div>

            {/* Botón LIMPIAR/TODOS - PROMINENTE Y ARRIBA */}
            <button
              onClick={toggleTodos}
              style={{
                padding: '10px 12px',
                fontSize: '12px',
                fontWeight: '700',
                backgroundColor: filtrosActivos.length === tipos.length ? '#3b82f6' : '#e5e7eb',
                color: filtrosActivos.length === tipos.length ? 'white' : '#374151',
                border: `2px solid ${filtrosActivos.length === tipos.length ? '#1e40af' : '#d1d5db'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = filtrosActivos.length === tipos.length ? '#2563eb' : '#d1d5db';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = filtrosActivos.length === tipos.length ? '#3b82f6' : '#e5e7eb';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {filtrosActivos.length === tipos.length ? '🔄 Mostrar Todos' : '🔍 Seleccionar Todos'}
            </button>

            {/* Prioridades - TERCERO */}
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🎯 Filtrar por Prioridad
              </h3>
              {[
                { nivel: 'alta', color: '#ef4444', label: 'Alta' },
                { nivel: 'media', color: '#f59e0b', label: 'Media' },
                { nivel: 'baja', color: '#10b981', label: 'Baja' }
              ].map(p => (
                <button
                  key={p.nivel}
                  onClick={() => togglePrioridad(p.nivel)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    marginBottom: '4px',
                    backgroundColor: prioridadesActivas.includes(p.nivel) ? p.color : '#e5e7eb',
                    color: prioridadesActivas.includes(p.nivel) ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '600',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  {p.label}
                  <span>{prioridadesActivas.includes(p.nivel) ? '✓' : ''}</span>
                </button>
              ))}
            </div>

            {/* Categorías de Reportes - CUARTO */}
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📋 Categorías ({filtrosActivos.length}/{tipos.length})
              </h3>
              
              {categorias.map(cat => {
                const reportesCat = reportes.filter(r => 
                  cat.tipos.some(t => t.tipo === r.tipo)
                ).length;
                const reportesCatVisibles = reportesVisibles.filter(r => 
                  cat.tipos.some(t => t.tipo === r.tipo)
                ).length;
                
                return (
                  <div key={cat.id} style={{ marginBottom: '8px' }}>
                    <button
                      onClick={() => toggleCategoria(cat.id)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: '#374151'
                      }}
                    >
                      <span>{cat.nombre}</span>
                      <span style={{
                        fontSize: '9px',
                        backgroundColor: '#e5e7eb',
                        padding: '2px 6px',
                        borderRadius: '12px',
                        marginRight: '8px'
                      }}>
                        {reportesCatVisibles}/{reportesCat}
                      </span>
                      <span>{categoriasColapsadas.has(cat.id) ? '▶' : '▼'}</span>
                    </button>
                    
                    {!categoriasColapsadas.has(cat.id) && (
                      <div style={{ marginTop: '4px', paddingLeft: '8px' }}>
                        {cat.tipos.map(tipo => {
                          const reportesTipo = reportes.filter(r => r.tipo === tipo.tipo).length;
                          const reportesTipoVisibles = reportesVisibles.filter(r => r.tipo === tipo.tipo).length;
                          
                          return (
                            <button
                              key={tipo.id}
                              onClick={() => toggleTipo(tipo.tipo)}
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                marginBottom: '2px',
                                backgroundColor: filtrosActivos.includes(tipo.tipo) ? tipo.color || '#3b82f6' : '#e5e7eb',
                                color: filtrosActivos.includes(tipo.tipo) ? 'white' : '#6b7280',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '10px',
                                fontWeight: '500',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span>{tipo.icono}</span>
                              <span style={{ flex: 1 }}>{tipo.nombre}</span>
                              <span style={{
                                fontSize: '8px',
                                padding: '1px 4px',
                                backgroundColor: 'rgba(255,255,255,0.3)',
                                borderRadius: '10px',
                                marginRight: '4px'
                              }}>
                                {reportesTipoVisibles}/{reportesTipo}
                              </span>
                              <span>
                                {filtrosActivos.includes(tipo.tipo) ? '✓' : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
