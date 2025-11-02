# 📸 Guía de Verificación Visual - Frontend

## ✅ Qué Debes Ver en http://localhost:5173

### Panel Lateral Izquierdo
Debe mostrar los reportes organizados por categoría:

```
🕳️ BACHES Y VIALIDAD (29 reportes) ← INCLUYE los 2 reclasificados
├─ Falta señalización en cruce peligroso (ID 3) ✅ Ahora en BACHES
├─ Semáforo descompuesto en centro (ID 9) ✅ Ahora en BACHES
├─ Bache profundo en calle principal
├─ Pavimento deteriorado en Av. Morelos
└─ ... (25 más)

💡 ALUMBRADO PÚBLICO (17 reportes)
├─ Lámpara apagada en calle oscura
├─ Poste de luz sin funcionar
└─ ... (15 más)

💧 AGUA POTABLE (14 reportes)
🧹 LIMPIEZA (11 reportes)
🚨 SEGURIDAD CIUDADANA (5 reportes) ← YA NO incluye IDs 3 y 9
🌳 PARQUES Y JARDINES (4 reportes)
```

### Mapa Principal
- **80 puntos distribuidos** en el área de Jantetelco
- Heatmap con **mayor concentración** en zona centro
- Distribución geográfica: ~3 km de diámetro
- Colores según tipo de reporte (si está configurado)

### Detalles Esperados
1. **Total visible:** 80 reportes (no 3, no 10, sino **80**)
2. **Categoría "Baches":** Debe tener 29 reportes (antes tenía 2)
3. **Categoría "Seguridad":** Debe tener 5 reportes (antes tenía 4)
4. **Cobertura del mapa:** Puntos distribuidos en toda la zona urbana

## 🔍 Verificaciones Específicas

### 1. Verificar Reclasificación
Buscar en panel lateral:
- ✅ "Falta señalización..." → debe estar en **Baches**, NO en Seguridad
- ✅ "Semáforo descompuesto..." → debe estar en **Baches**, NO en Seguridad

### 2. Verificar Cantidad Total
- ✅ Contador general debe mostrar **80 reportes**
- ✅ Panel lateral debe tener scroll (muchos reportes)
- ✅ Mapa debe verse "poblado" con muchos puntos

### 3. Verificar Distribución Geográfica
- ✅ Puntos NO deben estar todos en el mismo lugar
- ✅ Debe haber reportes en diferentes calles/zonas
- ✅ Heatmap debe mostrar gradiente de colores

## 🐛 Problemas Comunes

### Si solo ves 3-10 reportes:
```bash
# Refrescar navegador con Ctrl+F5 (forzar recarga)
# O verificar que el servidor esté corriendo:
Get-Process | Where-Object { $_.ProcessName -eq 'node' }
```

### Si los reportes están en categoría incorrecta:
```bash
# Verificar en DB directamente:
Push-Location C:\PROYECTOS\Jantetelco\server
node verificar-correcciones.js
```

### Si el mapa está vacío:
- Verificar consola del navegador (F12) para errores de API
- Probar endpoint manualmente:
  ```bash
  curl http://localhost:4000/api/reportes
  ```

## 📊 Estadísticas Esperadas (Panel Lateral)

Si el frontend muestra estadísticas, deberías ver:

| Categoría | Cantidad | Porcentaje |
|-----------|----------|------------|
| Baches    | 29       | ~36%       |
| Alumbrado | 17       | ~21%       |
| Agua      | 14       | ~18%       |
| Limpieza  | 11       | ~14%       |
| Seguridad | 5        | ~6%        |
| Parques   | 4        | ~5%        |

---
**💡 Tip:** Si ves exactamente esto, ¡TODO ESTÁ CORRECTO! ✅
