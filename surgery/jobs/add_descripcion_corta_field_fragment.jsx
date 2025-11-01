          {/* Descripción Corta */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600', 
              color: '#374151'
            }}>
              Descripción Corta *
            </label>
            <input
              type="text"
              name="descripcionCorta"
              value={formData.descripcionCorta}
              onChange={handleInputChange}
              placeholder="Resumen breve (ej: Bache grande en calle principal)"
              maxLength="100"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              Esta descripción aparecerá en el mapa al hacer clic en el marcador ({formData.descripcionCorta.length}/100)
            </p>
          </div>

          {/* Descripción Detallada */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{