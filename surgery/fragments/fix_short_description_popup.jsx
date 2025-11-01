          // Crear descripción corta (máximo 50 caracteres)
          const descripcionCorta = reporte.descripcion.length > 50 
            ? reporte.descripcion.substring(0, 50).trim() + '...'
            : reporte.descripcion;

          // Crear marcador con coordenadas ajustadas
          const marker = L.marker([latFinal, lngFinal], { icon: customIcon })
            .bindPopup(`
              <div style="font-family: Inter, sans-serif; min-width: 250px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                  <span style="font-size: 20px;">${tipoInfo.icono}</span>
                  <div>
                    <h4 style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 600;">
                      ${tipoInfo.nombre}
                    </h4>
                    <span style="
                      font-size: 11px; 
                      padding: 2px 8px; 
                      border-radius: 12px; 
                      background: ${prioridad === 'alta' ? '#fee2e2' : prioridad === 'media' ? '#fef3c7' : '#f0fdf4'};
                      color: ${prioridad === 'alta' ? '#dc2626' : prioridad === 'media' ? '#d97706' : '#16a34a'};
                      font-weight: 600;
                      text-transform: uppercase;
                    ">
                      ${prioridad}
                    </span>
                  </div>
                </div>
                <div style="margin-bottom: 8px; color: #374151; font-size: 14px; line-height: 1.4;">
                  ${descripcionCorta}
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280;">
                  <span>Peso: ${reporte.peso} | ID: ${reporte.id}</span>
                  <span>${new Date(reporte.creado_en).toLocaleDateString('es-MX')}</span>
                </div>
                ${reportesEnCoordenada.length > 1 ? `
                  <div style="margin-top: 8px; padding: 4px 8px; background: #f3f4f6; border-radius: 4px; font-size: 11px; color: #6b7280;">
                    📍 ${reportesEnCoordenada.length} reportes en esta ubicación
                  </div>
                ` : ''}
              </div>
            `);