      // Filtro por tipos seleccionados
      if (filtrosActivos.length > 0 && filtrosActivos.length < tipos.length) {
        params.tipo = filtrosActivos;
        console.log(`🎯 Filtrando por ${filtrosActivos.length} tipos seleccionados`);
      }
