      {/* Modal: Asignar Reporte */}
      {mostrarModalAsignacion && reporteSeleccionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '700',
              marginBottom: '16px',
              color: '#1e293b'
            }}>
              Asignar Reporte #{reporteSeleccionado.id}
            </h2>
            
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#64748b'
            }}>
              <p style={{ margin: 0 }}><strong>Tipo:</strong> {reporteSeleccionado.tipo}</p>
              <p style={{ margin: '4px 0 0 0' }}>
                <strong>Descripción:</strong> {reporteSeleccionado.descripcion_corta || reporteSeleccionado.descripcion}
              </p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                marginBottom: '8px',
                color: '#1e293b'
              }}>
                Seleccionar Funcionario *
              </label>
              <select
                value={funcionarioSeleccionado}
                onChange={(e) => setFuncionarioSeleccionado(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Selecciona un funcionario --</option>
                {funcionariosDisponibles.map(func => (
                  <option key={func.id} value={func.id}>
                    {func.nombre} ({func.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                marginBottom: '8px',
                color: '#1e293b'
              }}>
                Notas (opcional)
              </label>
              <textarea
                value={notasAsignacion}
                onChange={(e) => setNotasAsignacion(e.target.value)}
                placeholder="Instrucciones o detalles adicionales para el funcionario..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setMostrarModalAsignacion(false)}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleAsignarReporte}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: loading ? '#93c5fd' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Asignando...' : 'Asignar Reporte'}
              </button>
            </div>
          </div>
        </div>
      )}
