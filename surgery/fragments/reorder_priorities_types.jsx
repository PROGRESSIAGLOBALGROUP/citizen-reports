            {/* Prioridades - AHORA ANTES DE TIPOS */}
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
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
            
            {/* Categorías de Reportes con Contadores */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  📋 Categorías ({filtrosActivos.length}/{tipos.length})
                </h3>
                <button
                  onClick={toggleTodos}
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {filtrosActivos.length === tipos.length ? 'Limpiar' : 'Todos'}
                </button>
              </div>
              
              {categorias.map(cat => {
                // Contar reportes de esta categoría
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
                          // Contar reportes de este tipo específico
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
