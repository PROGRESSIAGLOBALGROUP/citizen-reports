# UX/UI Spec

## Personas objetivo

- **Coordinador de protección civil:** Requiere visualizar hotspots de incidentes para tomar decisiones rápidas y compartir reportes ejecutivos.
- **Ciudadano reportero:** Captura eventos desde dispositivos móviles/desktop sin registrarse, esperando respuestas rápidas y transparencia.

## Principios de diseño

- **Enfoque en el mapa:** El lienzo Leaflet ocupa la mayor parte de la pantalla con márgenes mínimos para maximizar contexto espacial.
- **Panel lateral autopista:** Formularios, filtros y exportaciones agrupadas en una columna fija de ~320px, scroll independiente.
- **Retroalimentación inmediata:** Cualquier acción (guardar, filtrar, exportar) debe mostrar confirmación visual o alertas amigables.
- **Modo privacidad:** Alternativa de agregación por grid destacada para cuando se quiere difundir información sin revelar coordenadas exactas.

## Layout y jerarquía

1. **Header (`<h1>`):** Título claro con beneficio principal.
2. **Panel izquierdo:**

    - Formulario “Nuevo reporte”.
    - Sección de filtros con selectores de tipo y rango de fechas.
    - Opciones de visualización (multi capa, grid, paleta).
    - Bloque de exportaciones.

3. **Área derecha:** mapa interactivo (`#map`) responsive, mínimo 520px de alto.

## Interacciones clave

- **Click en mapa:** Rellena lat/lng en el formulario con 6 decimales.
- **Toggle multi capa:** Redibuja el mapa creando un `heatLayer` por tipo con gradientes alternados.
- **Checkbox grid:** Llama al endpoint `/api/reportes/grid` con el tamaño de celda indicado.
- **Exportar PNG:** Usa `html-to-image` y descarga automática del archivo.
- **Exportar GeoJSON:** Dispara descarga de blob sin refrescar la pantalla.

## Accesibilidad

- Contraste suficiente en panel, botones y campos (verificar WCAG AA al ajustar estilos).
- Focus visible en elementos interactivos (aprovechar estilos por defecto del navegador).
- Compatible con teclado: formularios y botones en orden lógico.
- Añadir atributos `aria-label` si se incorporan íconos sin texto futuro.

## Consideraciones responsivas

- Breakpoint sugerido: cuando el ancho sea < 960px, transformar la cuadrícula en layout vertical (panel sobre mapa).
- Asegurar que botones mantengan altura mínima de 40px en dispositivos táctiles.

## Métricas de éxito propuestas

- Tiempo promedio para registrar un reporte < 30 segundos.
- Exportaciones exitosas (>90%) sin errores de red en escenarios de prueba.
- Usuarios pueden identificar un hotspot relevante en menos de 10 segundos durante estudios de usabilidad.
