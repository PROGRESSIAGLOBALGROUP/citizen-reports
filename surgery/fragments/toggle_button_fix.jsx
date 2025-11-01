              <button
                onClick={toggleTodosFiltros}
                style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                {(filtrosActivos.length === tipos.length && tipos.every(tipo => filtrosActivos.includes(tipo))) ? 'Ninguno' : 'Todos'}
              </button>