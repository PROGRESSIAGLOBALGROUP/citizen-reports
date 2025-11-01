      const reporteData = {
        tipo: formData.tipo,
        descripcion: formData.descripcion.trim(),
        descripcion_corta: formData.descripcionCorta.trim(), // CORRECCIÓN: snake_case para backend
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        peso: parseInt(formData.peso),
        // Agregar datos de identificación sin molestar al usuario
        fingerprint: datosIdentificacion.fingerprint,
        sesionId: datosIdentificacion.sesionId,
        userAgent: datosIdentificacion.userAgent
      };
