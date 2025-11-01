# Repoblación de Base de Datos - 2025-10-05

## 🎯 Objetivo

Regenerar completamente la base de datos desde `server/schema.sql` con todos los datos originales del proyecto, eliminando datos de prueba inconsistentes.

## ✅ Acciones Realizadas

### 1. Respaldo de Seguridad
- ✅ Backup creado en: `backups/data-backup-before-repopulate-[timestamp].db`

### 2. Regeneración Completa
- ✅ Eliminada base de datos anterior (`server/data.db`)
- ✅ Recreada desde `server/schema.sql` con SQLite3
- ✅ Todas las tablas y esquemas restaurados correctamente

### 3. Datos Agregados

#### 📋 **11 Reportes** (10 originales + 1 de prueba)
| ID | Tipo | Descripción | Dependencia | Estado |
|----|------|-------------|-------------|--------|
| 1 | baches | Bache en Av. Morelos | obras_publicas | abierto |
| 2 | alumbrado | Lámpara fundida | servicios_publicos | abierto |
| 3 | seguridad | Falta señalización | seguridad_publica | abierto |
| 4 | baches | Banqueta hundida | obras_publicas | abierto |
| 5 | limpieza | Basura acumulada | servicios_publicos | abierto |
| 6 | agua | Fuga de agua | agua_potable | abierto |
| 7 | parques | Jardín sin mantenimiento | parques_jardines | abierto |
| 8 | agua | Coladera sin tapa | agua_potable | abierto |
| 9 | seguridad | Semáforo descompuesto | seguridad_publica | abierto |
| 10 | alumbrado | Poste inclinado | servicios_publicos | abierto |
| 11 | **quema** | **Incendio forestal** | **medio_ambiente** | **abierto** |

**Nota especial sobre Reporte #11:**
- Tipo: `quema` (se asigna automáticamente a dependencia `medio_ambiente`)
- Asignado a: Func. Parques (usuario_id=8, dependencia=`parques_jardines`)
- **Es una asignación interdepartamental** para probar el fix implementado
- El funcionario pertenece a PARQUES_JARDINES pero atiende reporte de MEDIO_AMBIENTE

#### 👥 **8 Usuarios** (1 admin + 3 supervisores + 4 funcionarios)
| ID | Email | Nombre | Dependencia | Rol | Password |
|----|-------|--------|-------------|-----|----------|
| 1 | admin@jantetelco.gob.mx | Administrador del Sistema | administracion | admin | admin123 |
| 2 | supervisor.obras@jantetelco.gob.mx | Supervisor Obras Públicas | obras_publicas | supervisor | admin123 |
| 3 | func.obras1@jantetelco.gob.mx | Juan Pérez - Obras | obras_publicas | funcionario | admin123 |
| 4 | supervisor.servicios@jantetelco.gob.mx | Supervisora Servicios Públicos | servicios_publicos | supervisor | admin123 |
| 5 | func.servicios1@jantetelco.gob.mx | María López - Servicios | servicios_publicos | funcionario | admin123 |
| 6 | func.seguridad1@jantetelco.gob.mx | Carlos Ramírez - Seguridad | seguridad_publica | funcionario | admin123 |
| 7 | supervisor.parques@jantetelco.gob.mx | Parkeador | parques_jardines | supervisor | admin123 |
| 8 | func.parques1@jantetelco.gob.mx | Func. Parques | parques_jardines | funcionario | admin123 |

**Todos los usuarios usan password: `admin123`**
Hash bcrypt: `$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba`

#### 🔗 **9 Asignaciones** (reportes → funcionarios)
| Reporte ID | Tipo | Asignado a | Asignado por | Notas |
|------------|------|------------|--------------|-------|
| 1 | baches | Juan Pérez - Obras | Admin | Reporte de bache asignado para revisión |
| 4 | baches | Juan Pérez - Obras | Supervisor Obras | Banqueta requiere atención prioritaria |
| 2 | alumbrado | María López - Servicios | Admin | Cambio de lámpara en plaza |
| 5 | limpieza | María López - Servicios | Supervisora Servicios | Limpieza de basura acumulada |
| 10 | alumbrado | María López - Servicios | Supervisora Servicios | Revisar poste inclinado |
| 3 | seguridad | Carlos Ramírez - Seguridad | Admin | Instalación de señalización |
| 9 | seguridad | Carlos Ramírez - Seguridad | Admin | Reparación de semáforo |
| 7 | parques | Func. Parques | Supervisor Parques | Mantenimiento de jardín municipal |
| **11** | **quema** | **Func. Parques** | **Admin** | **Asignación interdepartamental para prueba** |

## 🔍 Verificación

### Estado de Servidores
- ✅ Backend: http://localhost:4000 (Status 200)
- ✅ Frontend: http://localhost:5173 (Status 200)
- ✅ API endpoint `/api/reportes` retorna 11 reportes correctamente

### Tablas Creadas
```sql
✅ reportes              (11 registros)
✅ usuarios              (8 registros)
✅ sesiones              (0 registros - se crean al login)
✅ asignaciones          (9 registros)
✅ cierres_pendientes    (0 registros - se crean al solicitar cierre)
```

## 🧪 Prueba del Fix (Asignación Interdepartamental)

### Escenario de Prueba
Para verificar que el fix implementado funciona correctamente:

1. **Login:** http://localhost:5173
   - Email: `func.parques1@jantetelco.gob.mx`
   - Password: `admin123`

2. **Navegar a:** Panel de Funcionario

3. **Seleccionar:** Reporte #11 (Incendio forestal - tipo: quema)

4. **Acción:** Clic en "Solicitar Cierre"

5. **Llenar formulario:**
   - Notas: "Incendio controlado, zona segura"
   - Firma digital: "Func. Parques"
   - Evidencias: (opcional)

6. **Resultado esperado:** ✅ "Solicitud de cierre enviada al supervisor"

### ¿Por qué funciona ahora?

**ANTES (❌):**
```javascript
const supervisorId = await obtenerSupervisor(reporte.dependencia);
// Buscaba supervisor de medio_ambiente → NULL (no existe)
```

**DESPUÉS (✅):**
```javascript
const supervisorId = await obtenerSupervisor(req.usuario.dependencia);
// Busca supervisor de parques_jardines → encuentra a Parkeador (id=7)
```

El sistema ahora busca el supervisor del **funcionario que solicita el cierre**, no del departamento original del reporte. Esto permite asignaciones interdepartamentales donde un funcionario de PARQUES puede atender un reporte de MEDIO_AMBIENTE y su propio supervisor (Parkeador) debe aprobar el cierre.

## 📊 Resumen de Cambios

| Concepto | Antes | Después |
|----------|-------|---------|
| Reportes | 13 (datos inconsistentes) | 11 (datos originales + 1 prueba) |
| Usuarios | 8 | 8 (sin cambios) |
| Asignaciones | 1 | 9 (datos de ejemplo completos) |
| Dependencias | Algunas sin coordenadas | Todas con coordenadas reales de Jantetelco |
| Tipos de reporte | Duplicados/inconsistentes | Tipos únicos correctos |

## 🎉 Conclusión

La base de datos ha sido completamente repoblada con:
- ✅ Todos los datos originales del schema.sql
- ✅ Asignaciones de ejemplo lógicas por departamento
- ✅ Reporte de prueba (#11) para validar fix interdepartamental
- ✅ Usuarios con contraseñas correctas (admin123)
- ✅ Coordenadas geográficas reales de Jantetelco, Morelos
- ✅ Sistema listo para pruebas end-to-end

**Sistema operativo y listo para usar.**
