const renderNavigation = () => (
    <div className="top-bar" style={{
      position: 'static',
      height: '50px',
      zIndex: 1999,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderBottom: '1px solid #334155',
      padding: '0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'stretch',
      gap: '0',
      margin: '0',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    }}>
      {/* MÓVIL: Botones grandes de navegación con tema oscuro */}
      <div style={{ display: 'flex', gap: '0', alignItems: 'stretch', flex: '1' }}>
      <button
        onClick={navigateToMap}
        style={{
          flex: '1 1 auto',
          padding: '0',
          background: currentView === 'map' 
            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
            : 'rgba(15, 23, 42, 0.5)',
          color: currentView === 'map' ? 'white' : '#94a3b8',
          border: 'none',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          borderRadius: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minWidth: '0',
          whiteSpace: 'nowrap',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: currentView === 'map' ? '0 4px 10px rgba(59, 130, 246, 0.4)' : 'none',
          borderRight: '1px solid #334155'
        }}
      >
        <span style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          animation: currentView === 'map' ? 'shimmer 2s infinite' : 'none'
        }} />
        🗺️ Mapa
      </button>
      
      <button
        onClick={navigateToForm}
        style={{
          flex: '1 1 auto',
          padding: '0 8px',
          background: currentView === 'form' 
            ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
            : 'rgba(15, 23, 42, 0.5)',
          color: currentView === 'form' ? 'white' : '#94a3b8',
          border: 'none',
          fontSize: '18px',
          fontWeight: '800',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          borderRadius: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minWidth: '0',
          whiteSpace: 'nowrap',
          borderLeft: '1px solid #334155',
          borderRight: '1px solid #334155',
          boxShadow: currentView === 'form' ? '0 4px 10px rgba(139, 92, 246, 0.4)' : 'none',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <span style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: currentView === 'form' ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' : 'transparent',
          animation: currentView === 'form' ? 'shimmer 2s infinite' : 'none'
        }} />
        📝 Reportar
      </button>

      {/* Botón de Login/Panel/Usuario */}
      {!usuario ? (
        <button
          onClick={() => setMostrarLogin(true)}
          style={{
            flex: '1 1 auto',
            padding: '0 12px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            fontSize: '18px',
            fontWeight: '900',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            borderRadius: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            minWidth: '0',
            whiteSpace: 'nowrap',
            borderLeft: '1px solid #334155',
            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.6)';
            e.target.style.transform = 'translateY(0px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = '0 4px 10px rgba(16, 185, 129, 0.4)';
            e.target.style.transform = 'translateY(0px)';
          }}
        >
          <span style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            animation: 'shimmer 2s infinite'
          }} />
          🔐 Inicia Sesión
        </button>
      ) : (
        <>
          <button
            onClick={navigateToPanel}
            style={{
              flex: '1 1 auto',
              padding: '0 8px',
              background: currentView === 'panel' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : 'rgba(15, 23, 42, 0.5)',
              color: currentView === 'panel' ? 'white' : '#94a3b8',
              border: 'none',
              fontSize: '18px',
              fontWeight: '800',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              borderRadius: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minWidth: '0',
              whiteSpace: 'nowrap',
              borderLeft: '1px solid #334155',
              borderRight: '1px solid #334155',
              boxShadow: currentView === 'panel' ? '0 4px 10px rgba(59, 130, 246, 0.4)' : 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <span style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: currentView === 'panel' ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' : 'transparent',
              animation: currentView === 'panel' ? 'shimmer 2s infinite' : 'none'
            }} />
            📋 Panel
          </button>

          {/* Admin button - solo si es admin */}
          {usuario?.rol === 'admin' && (
            <button
              onClick={navigateToAdmin}
              style={{
                flex: '1 1 auto',
                padding: '0 8px',
                background: currentView === 'admin'
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'rgba(15, 23, 42, 0.5)',
                color: currentView === 'admin' ? 'white' : '#94a3b8',
                border: 'none',
                fontSize: '18px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                borderRadius: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minWidth: '0',
                whiteSpace: 'nowrap',
                borderLeft: '1px solid #334155',
                borderRight: '1px solid #334155',
                boxShadow: currentView === 'admin' ? '0 4px 10px rgba(239, 68, 68, 0.4)' : 'none',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: currentView === 'admin' ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' : 'transparent',
                animation: currentView === 'admin' ? 'shimmer 2s infinite' : 'none'
              }} />
              🚪 Admin
            </button>
          )}

          <button
            onClick={handleLogout}
            style={{
              flex: '1 1 auto',
              padding: '0 12px',
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: '#cbd5e1',
              border: 'none',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              borderRadius: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minWidth: '0',
              whiteSpace: 'nowrap',
              borderLeft: '1px solid #334155',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              fontSize: '14px'
            }}
          >
            <span style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
              animation: 'shimmer 2s infinite'
            }} />
            🚪 Logout
          </button>
        </>
      )}
      </div>
    </div>
  );
