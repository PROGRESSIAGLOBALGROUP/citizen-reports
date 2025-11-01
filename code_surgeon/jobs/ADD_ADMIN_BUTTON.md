# Job: Agregar botón Admin a la barra de navegación

## Ubicación
Archivo: `client/src/App.jsx`

## Descripción
El botón Admin está faltando en la barra de navegación. Debe aparecer:
- DESPUÉS del botón "Panel"
- SOLO si el usuario está logueado Y tiene rol 'admin'
- Con los mismos estilos que los otros botones de navegación

## Marcadores
START: `          </button>\n\n          <button`
END: `            onClick={handleLogout},`

(El botón Admin debe ir entre Panel y Logout)

## Estrategia
Insertar nuevo bloque de código para:
1. Renderizar botón "Admin" con icono y texto
2. Verificar que usuario.rol === 'admin'
3. Llamar a navigateToAdmin cuando se clickee
4. Aplicar estilos consistentes con otros botones
