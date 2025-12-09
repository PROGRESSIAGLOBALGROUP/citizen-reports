# 🗑️ Flujo de Eliminación de Dependencias con Usuarios Asignados

## ¿Cómo funciona?

El sistema citizen-reports permite eliminar dependencias que tienen usuarios asignados mediante un proceso de **reasignación automática**.

### Paso a Paso:

#### 1. **Selecciona la dependencia a eliminar**
   - Ve al panel Admin → Dependencias
   - Localiza la dependencia que deseas eliminar

#### 2. **Haz click en el botón "Eliminar"** 🗑️
   - El sistema verifica automáticamente si hay usuarios asignados
   
#### 3. **¿Tiene usuarios?**

   **OPCIÓN A: Sin usuarios**
   - Verás un confirmación: ¿Confirmar eliminación?
   - Haz click en "Aceptar" → Dependencia eliminada
   
   **OPCIÓN B: Con usuarios** ⭐ TÚ ESTÁS AQUÍ
   - Aparecerá un **modal con la lista de usuarios asociados**
   - El modal te pide: "Reasignar usuarios a otra dependencia"

#### 4. **Reasigna los usuarios**
   - En el modal, selecciona una **dependencia destino** del dropdown
   - Haz click en **"Reasignar y Eliminar"**
   - El sistema reasigna todos los usuarios y elimina la dependencia original

### Resultado

- ✅ Todos los usuarios se mueven a la nueva dependencia
- ✅ La dependencia original se desactiva (soft delete)
- ✅ El historial audita la acción completa

---

## 🔧 Detalles Técnicos

### Backend API Endpoints

#### 1. Obtener usuarios de una dependencia
```
GET /api/admin/dependencias/:id/usuarios
Headers: Authorization: Bearer <token>

Response:
{
  "dependencia": "Obras Públicas",
  "slug": "obras_publicas",
  "usuarios": [
    {
      "id": 2,
      "nombre": "Juan García",
      "email": "juan@municipio.mx",
      "rol": "funcionario"
    }
  ],
  "count": 1
}
```

#### 2. Reasignar y eliminar dependencia
```
POST /api/admin/dependencias/:id/reasignar-y-eliminar
Headers: 
  - Authorization: Bearer <token>
  - Content-Type: application/json

Body:
{
  "dependenciaDestino": "seguridad_publica"
}

Response:
{
  "mensaje": "Dependencia eliminada. 2 usuario(s) reasignado(s) a Seguridad Pública.",
  "usuariosReasignados": 2
}
```

#### 3. Eliminar directamente (sin usuarios)
```
DELETE /api/admin/dependencias/:id
Headers: Authorization: Bearer <token>

Response:
{
  "mensaje": "Dependencia eliminada exitosamente"
}
```

---

## ✅ Validaciones de Seguridad

| Validación | Descripción |
|-----------|-------------|
| **Autenticación** | Solo admin puede eliminar dependencias |
| **Dependencia válida** | La dependencia debe existir |
| **Usuarios existentes** | Se valida count antes de permitir eliminación directa |
| **Dependencia destino** | Debe ser diferente y estar activa |
| **Auditoría** | Se registra quién, cuándo y qué se reasignó |
| **Integridad referencial** | Los usuariosno se pierden, solo se reasignan |

---

## 🐛 Troubleshooting

### Problema: El modal no aparece después de hacer click en Eliminar

**Solución:**
1. Abre la **Consola del Navegador** (F12 → Console)
2. Verifica que veas logs con `🗑️ handleEliminar:`
3. Si no ves logs → el botón no se está llamando correctamente
4. Recarga la página (Ctrl+R) e intenta nuevamente

### Problema: Veo un error que dice "usuario(s) asociado(s)"

**Solución:**
- Este es el comportamiento esperado
- Haz **click nuevamente en "Eliminar"**
- Ahora el modal de reasignación debería aparecer

### Problema: No hay dependencias destino disponibles

**Solución:**
- Necesitas al menos 2 dependencias activas para reasignar
- Crea una nueva dependencia primero
- O verifica que no todas estén desactivadas

---

## 📊 Ejemplo de Flujo Completo

```
Inicio
  ↓
[Admin hace click en Eliminar de "Obras Públicas"]
  ↓
Backend verifica: ¿"Obras Públicas" tiene usuarios?
  ↓
  SÍ → Retorna { count: 2, usuarios: [...] }
       Frontend muestra MODAL
       ↓
       [Admin selecciona destino: "Seguridad Pública"]
       ↓
       [Admin hace click en "Reasignar y Eliminar"]
       ↓
       Backend reasigna usuarios
       Marca "Obras Públicas" como activo=0
       ↓
  NO → Muestra confirm
       ↓
       [Admin confirma]
       ↓
       Backend elimina (soft delete)
       ↓
Fin: Dependencia eliminada ✅
```

---

## 📝 Código Frontend Relevante

**Ubicación:** `client/src/AdminDependencias.jsx`

**Estados:**
```javascript
const [modalEliminar, setModalEliminar] = useState(false);
const [dependenciaEliminar, setDependenciaEliminar] = useState(null);
const [usuariosAsociados, setUsuariosAsociados] = useState([]);
const [dependenciaDestino, setDependenciaDestino] = useState('');
```

**Funciones principales:**
- `handleEliminar()` - Consulta usuarios y muestra modal
- `handleReasignarYEliminar()` - Reasigna y elimina
- `eliminarDependenciaDirecto()` - Elimina sin usuarios

---

## 🎯 Resumen

✅ **El flujo de eliminación de dependencias CON usuarios ya está completamente implementado**
- Backend: Endpoint `reasignar-y-eliminar` ✅
- Frontend: Modal de reasignación ✅
- API: Validaciones ✅
- Auditoría: Historial registra cambios ✅

**Si tienes problemas:**
1. Abre la consola (F12)
2. Revisa los logs 🗑️
3. Contacta soporte con los logs de la consola
