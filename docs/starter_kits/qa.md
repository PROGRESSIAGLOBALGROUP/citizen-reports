# Starter Kit — QA

## Objetivos

- Validar regresiones críticas con mínima configuración.
- Operar suites automatizadas (Vitest + Playwright) y pruebas exploratorias.
- Mantener trazabilidad de bugs y casos en curso.

## Preparación del entorno

1. **Instalaciones básicas**
   - Node.js 20.x y npm 10+
   - Playwright browsers (`npx playwright install`)
   - Acceso a la base de datos SQLite de pruebas si se requiere depuración

2. **Bootstrap del repositorio**

   ```powershell
   git clone <repo-url> citizen-reports
   cd citizen-reports
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

3. **Datos semilla opcionales**
   - Ejecutar `npm run init --prefix server` para generar `data.db` local.
   - Insertar casos manuales usando `client/src/api.js` (fetch) o herramientas REST.

## Ejecución de suites

| Objetivo | Comando | Notas |
|----------|---------|-------|
| Smoke backend | `npm run test:unit` | Usa Jest + Supertest, base para APIs |
| Smoke frontend | `npm run test:front` | Vitest; incluye pruebas de componentes clave |
| E2E completa | `npm run test:e2e` | Playwright; requiere build previo y puerto 4000 libre |
| Pipeline local | `npm run test:ci` | Reproduce CI; ideal antes de aprobar PR |

## Checklist previo a liberar

1. Ejecutar `npm run test:ci` en la rama propuesta.
2. Revisar reportes HTML de Playwright (`playwright-report/index.html`).
3. Verificar que las exportaciones (PNG/GeoJSON) funcionen manualmente.
4. Validar accesibilidad básica (focus, contraste) según `docs/ux_ui_spec.md`.
5. Registrar hallazgos en la herramienta de seguimiento (issue tracker) con pasos claros.

## Pruebas exploratorias sugeridas

- Ingreso de reportes con coordenadas límite (±90, ±180).
- Cambio agresivo de filtros (fechas, tipo) mientras se reciben nuevos datos.
- Uso de grid aggregation con celdas mínimas (0.001) y máximas (1.0).
- Exportación en navegadores alternativos (Edge, Firefox).

## Coordinación

- Sincronizar diariamente con desarrollo sobre bugs bloqueantes.
- Proponer nuevos casos automáticos cuando se detecten regresiones repetidas.
- Mantener la matriz de cobertura en `docs/changelog.md` si se agregan suites nuevas.
