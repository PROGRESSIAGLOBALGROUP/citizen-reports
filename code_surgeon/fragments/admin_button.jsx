          </button>

          {usuario && usuario.rol === 'admin' && (
            <button
              onClick={navigateToAdmin}
              style={{
                flex: '1 1 auto',
                padding: '0',
                backgroundColor: currentView === 'admin' ? '#3b82f6' : '#f3f4f6',
                color: currentView === 'admin' ? 'white' : '#374151',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderRadius: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                minWidth: '0',
                whiteSpace: 'nowrap',
                borderLeft: '1px solid #d1d5db'
              }}
            >
              ⚙️ Admin
            </button>
          )}

          <button
