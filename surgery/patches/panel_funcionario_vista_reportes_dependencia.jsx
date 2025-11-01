      {/* Vista: Reportes de Mi Dependencia (solo supervisores/admins) */}
      {vista === 'reportes-dependencia' && !loading && (
        <div>
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px'
          }}>
            <p style={{ margin: 0, color: '#1e40af', fontSize: '14px' }}>
              💡 <strong>Asignar reportes:</strong> Haz clic en "Asignar" para asignar reportes a funcionarios de tu dependencia
            </p>
          </div>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {reportesDependencia.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                No hay reportes en tu dependencia
              </p>
            ) : (
              reportesDependencia.map(reporte => (
                <div key={reporte.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <span style={{
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginRight: '8px'
                      }}>
                        {reporte.tipo}
                      </span>
                      <span style={{
                        backgroundColor: reporte.estado === 'abierto' ? '#fee2e2' : 
                                       reporte.estado === 'asignado' ? '#fef3c7' :
                                       reporte.estado === 'pendiente_cierre' ? '#dbeafe' : '#d1fae5',
                        color: reporte.estado === 'abierto' ? '#991b1b' :
                               reporte.estado === 'asignado' ? '#92400e' :
                               reporte.estado === 'pendiente_cierre' ? '#1e40af' : '#065f46',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {reporte.estado.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>
                      #{reporte.id} • {new Date(reporte.creado_en).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    marginBottom: '8px',
                    color: '#1e293b'
                  }}>
                    {reporte.descripcion_corta || reporte.descripcion?.substring(0, 100)}
                  </h3>
                  
                  {reporte.descripcion && reporte.descripcion !== reporte.descripcion_corta && (
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#64748b',
                      marginBottom: '12px',
                      lineHeight: '1.5'
                    }}>
                      {reporte.descripcion}
                    </p>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px',
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '16px'
                  }}>
                    <span>📍 {reporte.lat.toFixed(4)}, {reporte.lng.toFixed(4)}</span>
                    <span>⚖️ Peso: {reporte.peso}</span>
                    {reporte.prioridad && <span>🚨 {reporte.prioridad}</span>}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => abrirModalAsignacion(reporte)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      👤 Asignar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
