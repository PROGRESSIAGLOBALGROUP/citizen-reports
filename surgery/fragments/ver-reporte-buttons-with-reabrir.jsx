      {/* Botones de Acción (Solo para usuarios autenticados) */}
      {usuario && (usuario.rol === 'admin' || usuario.rol === 'supervisor') && (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={cargarHistorial}
            disabled={cargandoHistorial}
            style={{
              padding: '12px 24px',
              backgroundColor: cargandoHistorial ? '#c4b5fd' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: cargandoHistorial ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (!cargandoHistorial) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)';
            }}
          >
            📜 Ver Historial
          </button>
          
          <button
            onClick={abrirModalAsignacion}
            disabled={loadingAsignacion || reporte?.estado === 'cerrado'}
            style={{
              padding: '12px 24px',
              backgroundColor: (loadingAsignacion || reporte?.estado === 'cerrado') ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (loadingAsignacion || reporte?.estado === 'cerrado') ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: reporte?.estado === 'cerrado' ? 0.5 : 1
            }}
            onMouseOver={(e) => {
              if (!loadingAsignacion && reporte?.estado !== 'cerrado') {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
            }}
          >
            👤 Asignar Funcionario
          </button>

          {/* Botón de Reapertura (solo admin y si está cerrado) */}
          {usuario.rol === 'admin' && reporte?.estado === 'cerrado' && (
            <button
              onClick={() => setMostrarModalReabrir(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
              }}
            >
              🔓 Reabrir Reporte
            </button>
          )}
        </div>
      )}

