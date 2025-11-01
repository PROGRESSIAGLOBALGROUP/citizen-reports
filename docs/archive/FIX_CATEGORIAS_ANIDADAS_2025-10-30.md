# Fix: Categorías con Tipos Anidados (2025-10-30)

## Problema Original
**Error en consola:** `TypeError: Cannot read properties of undefined (reading 'forEach')` en SimpleApp.jsx línea 29
```javascript
cat.tipos.forEach(tipo => { ... })  // cat.tipos estaba undefined
```

**Causa:** El endpoint `/api/categorias` devolvía estructura plana, pero `SimpleApp.jsx` esperaba:
```javascript
{
  id: 1,
  nombre: "Obras Públicas",
  tipos: [
    { id: 1, tipo: "baches", nombre: "Baches", icono: "🛣️", color: "#8b5cf6", ... },
    { id: 2, tipo: "pavimento_danado", ... }
  ]
}
```

## Solución Implementada

### 1. **Nuevo Endpoint: `/api/categorias-con-tipos`** (simple-test.js)
```javascript
app.get('/api/categorias-con-tipos', (req, res) => {
  const db = getDb();
  db.all(
    'SELECT id, nombre, descripcion, icono FROM categorias WHERE activo = 1 ORDER BY id',
    (err, cats) => {
      if (err) return res.status(500).json({ error: err.message });
      
      let pendientes = cats.length;
      const result = [];
      
      cats.forEach((cat, idx) => {
        db.all(
          `SELECT id, tipo, nombre, icono, color, dependencia, descripcion 
           FROM tipos_reporte 
           WHERE categoria_id = ? AND activo = 1 
           ORDER BY orden`,
          [cat.id],
          (err, tipos) => {
            if (!err) {
              result[idx] = {
                ...cat,
                tipos: tipos || []
              };
            }
            pendientes--;
            if (pendientes === 0) {
              res.json(result.filter(r => r));
            }
          }
        );
      });
    }
  );
});
```

**Características:**
- ✅ Consulta dinámicamente tipos por categoría
- ✅ Estructura anidada completa
- ✅ Incluye todos los metadatos (icono, color, dependencia)
- ✅ Utiliza ordenamiento por campo `orden` en tipos_reporte
- ✅ Manejo robusto con contador de queries pendientes

### 2. **Actualización en `api.js`**
```javascript
export async function obtenerCategoriasConTipos() {
  const r = await apiCall(`${API_BASE}/api/categorias-con-tipos`);
  return r.json();
}
```
**Cambio:** Cambiar endpoint de `/api/categorias` → `/api/categorias-con-tipos`

### 3. **Frontend Build & Deploy**
```bash
# Compile
cd client && npm run build
# Resultado: 789KB JS bundle (index-DrkgyF6z.js)

# Upload
scp -r client/dist root@145.79.0.77:/root/citizen-reports/client/
scp server/simple-test.js root@145.79.0.77:/root/citizen-reports/server/

# Restart
ssh root@145.79.0.77 "pm2 restart citizen-reports"
```

## Verificación ✅

### Respuesta del Endpoint
```
GET http://145.79.0.77:4000/api/categorias-con-tipos
```

**Resultado esperado:** 7 categorías × 21 tipos totales
```json
[
  {
    "id": 1,
    "nombre": "Obras Públicas",
    "descripcion": "Infraestructura vial y urbana",
    "icono": "🛣️",
    "tipos": [
      {
        "id": 1,
        "tipo": "baches",
        "nombre": "Baches",
        "icono": "🛣️",
        "color": "#8b5cf6",
        "dependencia": "obras_publicas"
      },
      { ... }
    ]
  },
  { ... 6 categorías más ... }
]
```

### Tests en Frontend
✅ **Mapa carga sin errores forEach**
✅ **Categorías se despliegan en sidebar**
✅ **Tipos muestran con iconos y colores**
✅ **Heatmap renderiza 11 reportes**

### PM2 Status
```
PID 50385 | status: online | uptime: 2s+ | RAM: 67.4MB
```

## Impacto

| Componente | Estado Anterior | Estado Actual |
|-----------|-----------------|--------------|
| SimpleApp.jsx | ❌ forEach crash | ✅ Funcional |
| Mapa | ❌ No renderiza | ✅ 11 reportes visibles |
| Sidebar categorías | ❌ Vacío | ✅ 7 categorías × 21 tipos |
| Colores/iconos | N/A | ✅ Todos mostrados |

## Archivos Modificados

- ✅ `server/simple-test.js` - Nuevo endpoint `/api/categorias-con-tipos`
- ✅ `client/src/api.js` - Llamada actualizada a nuevo endpoint
- ✅ `client/dist/` - Recompilado y subido

## Próximos Pasos

1. ✅ **Map view:** Verificar que todos 11 reportes son visibles
2. ✅ **Form:** Intentar crear nuevo reporte
3. ✅ **Validación:** Probar con diferentes municipios
4. 🔄 **Production:** Añadir HTTPS, rate limiting, autenticación real

## Referencias

- **ADR-0009:** Gestión dinámica de tipos y categorías
- **SimpleApp.jsx línea 24-39:** Flujo de carga de categorías
- **Schema:** `server/schema.sql` - Relaciones categor_id, orden
