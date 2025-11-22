      // ========================================================================
      // REVERSE GEOCODING EN TIEMPO REAL
      // Obtener información de ubicación (colonia, código postal, municipio, etc.)
      // desde Nominatim (OpenStreetMap) - SIN COSTO, respeta privacidad
      // ========================================================================
      try {
        setMessage({ type: 'info', text: 'Obteniendo información de ubicación...' });
        
        const response = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
        
        if (response.ok) {
          const geoData = await response.json();
          
          if (geoData.success && geoData.data) {
            const { colonia, codigo_postal, municipio, estado_ubicacion, pais } = geoData.data;
            
            console.log('✅ Datos de geocoding obtenidos:', {
              colonia,
              codigo_postal,
              municipio,
              estado_ubicacion,
              pais
            });
            
            // SIEMPRE actualizar formData con los datos disponibles (aunque sean null)
            // Esto asegura que los campos se muestren en el formulario
            const datosUbicacion = {
              colonia: colonia,
              codigo_postal: codigo_postal,
              municipio: municipio,
              estado_ubicacion: estado_ubicacion,
              pais: pais || 'México'
            };
            
            console.log('📝 Actualizando formData con:', datosUbicacion);
            
            // Actualizar formData y crear marcador
            setFormData(prev => {
              const nuevoEstado = {
                ...prev,
                ...datosUbicacion
              };
              
              // Crear marcador SIEMPRE (independiente de validación)
              setTimeout(() => {
                actualizarMarcadorMapa(lat, lng, nuevoEstado.tipo);
              }, 0);
              
              return nuevoEstado;
            });
            
            // VALIDACIÓN: Verificar municipio Y código postal para habilitar envío
            // Normalizar valores: null/undefined -> cadena vacía para validación
            const municipioNorm = (municipio || '').trim();
            const codigoPostalNorm = (codigo_postal || '').trim();
            
            if (!municipioNorm || !codigoPostalNorm) {
              // NO resetear formData, solo marcar como incompleto
              setDatosUbicacionCompletos(false);
              
              let errorMsg = 'No fue posible determinar ';
              if (!municipioNorm) {
                errorMsg += 'el Municipio';
              }
              if (!codigoPostalNorm) {
                errorMsg += (!municipioNorm) ? ' y el Código Postal' : 'el Código Postal';
              }
              errorMsg += ', por favor seleccione otro punto en el mapa';
              
              setMessage({ 
                type: 'error', 
                text: errorMsg
              });
              return;
            }
            
            // Validación pasada: marcar como completo
            setDatosUbicacionCompletos(true);
            
            // Mostrar mensaje de éxito con información obtenida
            const infoText = [
              datosUbicacion.colonia && `Colonia: ${datosUbicacion.colonia}`,
              datosUbicacion.codigo_postal && `CP: ${datosUbicacion.codigo_postal}`,
              datosUbicacion.municipio && `Municipio: ${datosUbicacion.municipio}`
            ].filter(Boolean).join(' | ');
            
            setMessage({ 
              type: 'success', 
              text: infoText || `Ubicación seleccionada: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
            });
          } else {
            console.warn('⚠️ Reverse geocoding sin datos:', geoData);
            setDatosUbicacionCompletos(false);
            setMessage({ 
              type: 'error', 
              text: 'No fue posible determinar el Municipio y Código Postal, por favor seleccione otro punto en el mapa'
            });
          }
        } else {
          console.warn('⚠️ Error en reverse geocoding:', response.status);
          setDatosUbicacionCompletos(false);
          setMessage({ 
            type: 'error', 
            text: 'No fue posible determinar el Municipio y Código Postal, por favor seleccione otro punto en el mapa'
          });
        }
      } catch (error) {
        console.error('❌ Error en reverse geocoding:', error);
        setDatosUbicacionCompletos(false);
        setMessage({ 
          type: 'error', 
          text: 'No fue posible determinar el Municipio y Código Postal, por favor seleccione otro punto en el mapa'
        });
      }
