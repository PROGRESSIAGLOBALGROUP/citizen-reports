      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setVista('mis-reportes')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: vista === 'mis-reportes' ? '3px solid #3b82f6' : 'none',
            marginBottom: '-2px',
            color: vista === 'mis-reportes' ? '#3b82f6' : '#64748b',
            fontWeight: vista === 'mis-reportes' ? '600' : '400',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📋 Mis Reportes Asignados
        </button>
        
        {(usuario.rol === 'supervisor' || usuario.rol === 'admin') && (
          <>
            <button
              onClick={() => setVista('reportes-dependencia')}
              style={{
                padding: '12px 24px',
                background: 'none',
                border: 'none',
                borderBottom: vista === 'reportes-dependencia' ? '3px solid #3b82f6' : 'none',
                marginBottom: '-2px',
                color: vista === 'reportes-dependencia' ? '#3b82f6' : '#64748b',
                fontWeight: vista === 'reportes-dependencia' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🏢 Reportes de Mi Dependencia
            </button>
            
            <button
              onClick={() => setVista('cierres-pendientes')}
              style={{
                padding: '12px 24px',
                background: 'none',
                border: 'none',
                borderBottom: vista === 'cierres-pendientes' ? '3px solid #3b82f6' : 'none',
                marginBottom: '-2px',
                color: vista === 'cierres-pendientes' ? '#3b82f6' : '#64748b',
                fontWeight: vista === 'cierres-pendientes' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✅ Cierres Pendientes de Aprobación
            </button>
          </>
        )}
      </div>
