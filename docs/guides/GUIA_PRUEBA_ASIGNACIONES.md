# Guía de Prueba: Sistema de Asignación de Reportes

## Credenciales de Prueba

Todos los usuarios tienen el password: `admin123`

### Usuarios por Dependencia

| Email | Nombre | Dependencia | Rol |
|-------|--------|-------------|-----|
| func.seguridad1@jantetelco.gob.mx | Carlos Ramírez - Seguridad | seguridad_publica | funcionario |
| func.obras1@jantetelco.gob.mx | Juan Pérez - Obras | obras_publicas | funcionario |
| func.servicios1@jantetelco.gob.mx | María López - Servicios | servicios_publicos | funcionario |

### Reportes por Dependencia

#### Seguridad Pública (seguridad_publica)
- ID 3: "Falta señalización en cruce peligroso"
- ID 9: "Semáforo descompuesto en centro"

#### Obras Públicas (obras_publicas)
- ID 1: "Bache en Av. Morelos frente al mercado"
- ID 4: "Banqueta hundida en calle Hidalgo"

#### Servicios Públicos (servicios_publicos)
- ID 2: "Lámpara fundida en plaza principal"
- ID 5: "Basura acumulada en esquina céntrica"
- ID 10: "Poste inclinado por el viento"

## Pasos para Probar

### 1. Ver Reportes como Funcionario de Seguridad

1. Abre el navegador en http://localhost:5173
2. Haz clic en el botón "Iniciar Sesión" (esquina superior derecha)
3. Ingresa:
   - Email: `func.seguridad1@jantetelco.gob.mx`
   - Password: `admin123`
4. Haz clic en el mapa en algún marcador de seguridad (IDs 3 o 9)
5. **Deberías ver:**
   - ✅ Botón "👁️ Ver Reporte Completo"
   - Al hacer clic, te lleva a la vista detallada del reporte
   - Puedes editar "Notas de Trabajo" si estás asignado

### 2. Verificar Seguridad (Reportes de Otra Dependencia)

1. Con la misma sesión (func.seguridad1)
2. Haz clic en un marcador de OTRA dependencia (por ejemplo, ID 1 - Obras)
3. **Deberías ver:**
   - ⚠️ "ℹ️ Este reporte pertenece a otra dependencia"
   - ❌ NO debe aparecer el botón "Ver Reporte"

### 3. Verificar Sin Sesión

1. Cierra sesión (botón 🚪 en la esquina superior derecha)
2. Haz clic en cualquier marcador del mapa
3. **Deberías ver:**
   - 🔐 "🔐 Inicia sesión para ver reportes de tu dependencia"
   - ❌ NO debe aparecer el botón "Ver Reporte"

## Logs de Debug

Abre las DevTools del navegador (F12) y ve a la pestaña Console. Deberías ver logs como:

```javascript
🔍 Debug botón Ver Reporte: {
  reporteId: 3,
  reporteDependencia: "seguridad_publica",
  usuarioExiste: true,
  usuarioDependencia: "seguridad_publica",
  puedeVerReporte: true
}
```

## Casos de Prueba

| Usuario | Reporte | Resultado Esperado |
|---------|---------|-------------------|
| func.seguridad1 | ID 3 (seguridad) | ✅ Botón visible |
| func.seguridad1 | ID 1 (obras) | ⚠️ Mensaje "otra dependencia" |
| func.obras1 | ID 1 (obras) | ✅ Botón visible |
| func.obras1 | ID 3 (seguridad) | ⚠️ Mensaje "otra dependencia" |
| (sin sesión) | Cualquier reporte | 🔐 Mensaje "inicia sesión" |

## Solución de Problemas

### El botón no aparece
1. Verifica que iniciaste sesión (nombre debe aparecer en esquina superior derecha)
2. Verifica que el reporte pertenece a la dependencia del usuario
3. Revisa los logs de debug en la consola del navegador
4. Verifica que el backend esté corriendo en :4000 y frontend en :5173

### Error de autenticación
1. Verifica que el backend esté corriendo: http://localhost:4000/api/reportes
2. Borra localStorage del navegador y vuelve a iniciar sesión
3. Verifica que la base de datos esté inicializada: `npm run init` en /server

### Base de datos no tiene usuarios
Ejecuta desde `/server`:
```bash
npm run init
```

Esto recreará la base de datos con todos los usuarios y reportes de prueba.
