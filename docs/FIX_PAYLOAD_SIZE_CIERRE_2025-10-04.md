# Corrección: Error 413 Payload Too Large en Solicitud de Cierre

**Fecha**: 2025-10-04  
**Tipo**: Bugfix  
**Prioridad**: Alta  
**Issue**: Error 413 al intentar cerrar reporte con firma digital y evidencias

## Problema Identificado

### Síntomas

- Al intentar cerrar un reporte con firma digital y evidencias fotográficas, el servidor responde con error **413 Payload Too Large**
- Error en consola del navegador: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- La solicitud POST a `/api/reportes/:id/solicitar-cierre` falla completamente

### Captura del Error

```
POST http://localhost:5173/api/reportes/2/solicitar-cierre 413 (Payload Too Large)
```

### Análisis de Causa Raíz

1. **Límite configurado**: Express estaba configurado con `limit: '1mb'` para JSON body parsing
2. **Payload real**:
   - Firma digital (PNG en base64): ~30 KB
   - 3 evidencias fotográficas (JPEG en base64): ~900 KB (300 KB × 3)
   - JSON overhead + otros campos: ~100 KB
   - **Total**: ~1.2 MB

3. **Documentación de referencia**: `docs/ALMACENAMIENTO_FIRMAS_EVIDENCIAS.md` especifica:
   - Firma típica: 20-40 KB
   - Evidencias: máximo 900 KB (3 fotos × 300 KB)
   - Total esperado por cierre: ~930 KB

## Solución Implementada

### Cambio en Configuración

**Archivo**: `server/app.js` (línea 89)

**ANTES:**

```javascript
app.use(express.json({ limit: '1mb' }));
```

**DESPUÉS:**

```javascript
app.use(express.json({ limit: '5mb' }));
```

### Justificación del Nuevo Límite

- **1 MB**: Insuficiente (payload real ~1.2 MB)
- **5 MB**: Límite apropiado que:
  - ✅ Soporta firma (30 KB) + 3 evidencias (900 KB) con margen de seguridad
  - ✅ Previene payloads excesivos (>5 MB serán rechazados)
  - ✅ Protege contra ataques DoS con bodies masivos
  - ✅ Es consistente con la arquitectura documentada

### Implementación Según Protocolo

Se siguió el protocolo Code Surgeon (`code_surgeon/BEST_PRACTICES.md`):

1. ✅ **Test-Driven Surgery**: Se crearon tests ANTES del cambio
2. ✅ **Single Responsibility**: Cambio específico de una sola línea
3. ✅ **Idempotencia**: El cambio puede aplicarse múltiples veces
4. ✅ **Atomic Operation**: Cambio + tests + verificación

## Tests Implementados

**Archivo**: `tests/backend/payload-size.test.js`

### Casos de Prueba

1. ✅ **Acepta firma de ~30KB**: Verifica que una firma típica pasa sin problemas
2. ✅ **Acepta firma + 3 evidencias (~1.2MB)**: Verifica el escenario completo de cierre con evidencias
3. ✅ **Rechaza payload >5MB**: Verifica que el límite superior funciona correctamente

### Resultados de Tests

```bash
npm run test:unit -- tests/backend/payload-size.test.js

✓ acepta solicitud de cierre con firma de ~30KB
✓ acepta solicitud de cierre con firma + 3 evidencias (~1.2MB total)
✓ rechaza payload que excede 5MB

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

## Impacto

### Antes del Fix

- ❌ Imposible cerrar reportes con evidencias fotográficas
- ❌ Error 413 Payload Too Large
- ❌ Flujo de cierre bloqueado para funcionarios

### Después del Fix

- ✅ Funcionarios pueden cerrar reportes con firma digital
- ✅ Soporta hasta 3 evidencias fotográficas (300 KB c/u)
- ✅ Límite de seguridad previene payloads excesivos
- ✅ Consistente con documentación de arquitectura

## Seguridad y Consideraciones

### Protecciones Mantenidas

1. **Límite superior**: 5 MB previene ataques DoS
2. **Validación de formato**: Backend valida que imágenes sean data URLs válidos
3. **Límite de cantidad**: Máximo 3 fotos por cierre (validado en backend)
4. **Compresión en cliente**: Frontend comprime imágenes antes de enviar

### Riesgos Mitigados

- ❌ DoS con payloads masivos (límite 5 MB)
- ❌ Archivos no-imagen (validación de data URL)
- ❌ Spam de fotos (máximo 3)

## Referencias

- **Documentación**: `docs/ALMACENAMIENTO_FIRMAS_EVIDENCIAS.md`
- **ADR relevante**: ADR-0010 (Audit Trail - menciona cierres)
- **Protocolo Code Surgeon**: `code_surgeon/BEST_PRACTICES.md`
- **Test suite**: `tests/backend/payload-size.test.js`

## Deployment

### Desarrollo

El cambio ya está aplicado en `server/app.js`. Reinicia el servidor:

```powershell
.\stop-servers.ps1
.\start-dev.ps1
```

### Producción

```powershell
.\stop-servers.ps1
.\start-prod.ps1 -Build
```

## Verificación Manual

1. Inicia sesión como funcionario (ej: `func.obras1@jantetelco.gob.mx` / `admin123`)
2. Ve a "Mis Reportes Asignados"
3. Haz clic en "Solicitar Cierre" en cualquier reporte
4. Firma en el canvas
5. Sube hasta 3 fotos de evidencia
6. Haz clic en "Enviar"
7. ✅ Debería recibir confirmación exitosa

## Notas Técnicas

### Express Body Parser Limits

- `express.json({ limit })` acepta strings con unidades: '1mb', '5mb', '10mb'
- El límite aplica al body completo del request, no a archivos individuales
- Si se excede, Express responde con 413 automáticamente

### Base64 Overhead

- Base64 incrementa tamaño en ~33% vs binario
- Imagen PNG 30 KB → ~40 KB en base64
- Imagen JPEG 300 KB → ~400 KB en base64

### Alternativas Futuras (si escala)

Si el volumen crece significativamente (>50,000 reportes/año):

- Migrar a Azure Blob Storage o AWS S3
- Almacenar solo URLs en DB
- Implementar CDN para carga rápida
- Ver: `docs/ALMACENAMIENTO_FIRMAS_EVIDENCIAS.md` § "Migración Futura"
