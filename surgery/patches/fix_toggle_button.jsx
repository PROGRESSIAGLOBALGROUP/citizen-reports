              <button
                onClick={() => {
                  console.log('🔘 Toggle button clicked:', filtrosActivos.length, 'vs', tipos.length);
                  setFiltrosActivos(
                    filtrosActivos.length === tipos.length 
                      ? [] 
                      : [...tipos]
                  );
                }}
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
                {filtrosActivos.length === tipos.length ? 'Ninguno' : 'Todos'}
              </button>