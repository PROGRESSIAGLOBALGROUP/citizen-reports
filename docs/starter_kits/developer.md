# Starter Kit — Desarrollo

## Objetivos

- Preparar el entorno local en menos de 30 minutos.
- Entender el flujo TDD + CI/CD del proyecto.
- Coordinar entregas con documentación y pruebas completas.

## Checklist de instalación

1. **Prerrequisitos**
   - Node.js 20.x y npm 10+
   - Git + acceso al repositorio
   - PowerShell (Windows) con `Set-ExecutionPolicy -Scope Process RemoteSigned`

2. **Clonar y bootstrap**

   ```powershell
   git clone <repo-url> Jantetelco
   cd Jantetelco
   npm install
   npm install --prefix server
   npm install --prefix client
   npm run ai:bootstrap
   ```

3. **Configurar Playwright**

   ```powershell
   npx playwright install
   ```

## Flujo de trabajo recomendado

1. Crear rama `feature/<descripcion>` o `fix/<descripcion>`.
2. Diseñar pruebas primero (Vitest/Jest/Playwright) siguiendo `docs/tdd_philosophy.md`.
3. Implementar cambios mínimos para pasar las pruebas.
4. Ejecutar `npm run test:all` y actualizar documentación + `docs/changelog.md`.
5. Abrir PR con checklist completo y coordinar revisión.

## Comandos clave

| Comando | Propósito |
|---------|-----------|
| `npm run lint` | Revisar estilo y reglas ESLint/Prettier |
| `npm run test:unit` | Pruebas backend (Jest + Supertest) |
| `npm run test:front` | Pruebas frontend (Vitest + RTL) |
| `npm run test:e2e` | Pruebas Playwright end-to-end |
| `npm run test:ci` | Pipeline local equivalente a GitHub Actions |

## Buenas prácticas

- Usa `code_surgeon` para refactors complejos asistidos por IA.
- Documenta decisiones en `docs/adr/` y anota cambios relevantes en `docs/changelog.md`.
- Evita subir `client/dist`, `data.db` u otros artefactos generados.
- Coordina con QA antes de cambios que impacten flujos críticos.
