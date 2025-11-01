  // Función para agregar marcadores filtrados con manejo de coordenadas duplicadas
  const agregarMarcadores = () => {
    console.log('🗺️ Agregando marcadores:', reportes.length, 'reportes totales');
    console.log('🔍 Filtros activos:', filtrosActivos);
    
    // Los reportes ya vienen filtrados desde SimpleApp.jsx (tipo + prioridad)
    const reportesFiltrados = reportes;
    
    console.log('✅ Reportes filtrados a mostrar:', reportesFiltrados.length);
    
    // Agrupar reportes por coordenadas para detectar duplicados
    const coordenadasMap = new Map();
    reportesFiltrados.forEach(reporte => {
      const coordKey = `${reporte.lat},${reporte.lng}`;
      if (!coordenadasMap.has(coordKey)) {
        coordenadasMap.set(coordKey, []);
      }
      coordenadasMap.get(coordKey).push(reporte);
    });
    
    console.log('📍 Análisis de coordenadas duplicadas:');
    let totalCoordenadasUnicas = 0;
    let totalCoordenadasDuplicadas = 0;
    coordenadasMap.forEach((reportesEnCoordenada, coordKey) => {
      if (reportesEnCoordenada.length > 1) {
        console.log(`   🔄 Coordenada ${coordKey}: ${reportesEnCoordenada.length} reportes (IDs: ${reportesEnCoordenada.map(r => r.id).join(', ')})`);
        totalCoordenadasDuplicadas++;
      } else {
        totalCoordenadasUnicas++;
      }
    });
    console.log(`   📊 Total coordenadas únicas: ${totalCoordenadasUnicas}`);
    console.log(`   📊 Total coordenadas con duplicados: ${totalCoordenadasDuplicadas}`);

    let marcadoresCreados = 0;
    let marcadoresErrores = 0;

    // Procesar cada grupo de coordenadas
    coordenadasMap.forEach((reportesEnCoordenada, coordKey) => {
      reportesEnCoordenada.forEach((reporte, index) => {
        try {
          // Validar coordenadas antes de crear el marcador
          if (isNaN(reporte.lat) || isNaN(reporte.lng)) {
            console.error(`❌ Marcador - Coordenadas inválidas:`, reporte.lat, reporte.lng, 'para reporte ID:', reporte.id);
            marcadoresErrores++;
            return;
          }

          if (reporte.lat < -90 || reporte.lat > 90 || reporte.lng < -180 || reporte.lng > 180) {
            console.error(`❌ Marcador - Coordenadas fuera de rango:`, reporte.lat, reporte.lng, 'para reporte ID:', reporte.id);
            marcadoresErrores++;
            return;
          }

          const tipoInfo = tiposInfo[reporte.tipo] || { 
            nombre: reporte.tipo, 
            icono: '📍', 
            color: '#64748b' 
          };
          
          // Aplicar micro-desplazamiento para reportes duplicados
          let latFinal = reporte.lat;
          let lngFinal = reporte.lng;
          
          if (reportesEnCoordenada.length > 1) {
            // Calcular desplazamiento circular para múltiples reportes en la misma coordenada
            const radius = 0.0002; // ~20 metros de radio
            const angle = (index * 2 * Math.PI) / reportesEnCoordenada.length;
            latFinal = reporte.lat + (radius * Math.cos(angle));
            lngFinal = reporte.lng + (radius * Math.sin(angle));
            
            console.log(`🔄 Aplicando micro-desplazamiento a reporte ID ${reporte.id}: (${reporte.lat}, ${reporte.lng}) → (${latFinal.toFixed(6)}, ${lngFinal.toFixed(6)})`);
          }
          
          console.log(`📍 Creando marcador para reporte ID ${reporte.id}:`, reporte.tipo, 'en', [latFinal.toFixed(6), lngFinal.toFixed(6)]);
          
          // Determinar prioridad basada en peso
          const prioridad = reporte.peso >= 4 ? 'alta' : reporte.peso >= 2 ? 'media' : 'baja';
          const tamano = prioridad === 'alta' ? 35 : prioridad === 'media' ? 28 : 22;
          const borderWidth = prioridad === 'alta' ? 4 : 3;
          
          // Crear icono personalizado
          const customIcon = L.divIcon({
            html: `
              <div style="
                background-color: ${tipoInfo.color};
                width: ${tamano}px;
                height: ${tamano}px;
                border-radius: 50%;
                border: ${borderWidth}px solid white;
                box-shadow: 0 3px 12px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${tamano > 30 ? '16px' : '14px'};
                transform: translate(-50%, -50%);
                transition: all 0.2s ease;
              ">
                ${tipoInfo.icono}
              </div>
            `,
            className: 'custom-div-icon',
            iconSize: [tamano, tamano],
            iconAnchor: [tamano/2, tamano/2]
          });

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
                  ${reporte.descripcion}
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
          
          if (mapInstance.current) {
            marker.addTo(mapInstance.current);
            markersRef.current.push(marker);
            marcadoresCreados++;
            console.log(`✅ Marcador agregado exitosamente para reporte ID:`, reporte.id);
          } else {
            console.error(`❌ No se pudo agregar marcador - mapInstance.current es null para reporte ID:`, reporte.id);
            marcadoresErrores++;
          }
        } catch (error) {
          console.error(`❌ Error creando marcador para reporte ID:`, reporte.id, error);
          marcadoresErrores++;
        }
      });
    });

    console.log(`🏁 Resumen de creación de marcadores:`);
    console.log(`   ✅ Marcadores creados exitosamente: ${marcadoresCreados}`);
    console.log(`   ❌ Marcadores con errores: ${marcadoresErrores}`);
    console.log(`   📊 Total reportes procesados: ${reportesFiltrados.length}`);
    console.log(`   🎯 Marcadores almacenados en referencia: ${markersRef.current.length}`);
    console.log(`   📍 Total coordenadas únicas procesadas: ${coordenadasMap.size}`);
  };