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
                        {(reporte.estado || 'abierto').replace(/_/g, ' ')}
                      </span>
