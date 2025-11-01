# TDD 100% IA

## Ciclo propuesto

1. **Red:** escribir una prueba que falle (Vitest/Jest/Playwright) describiendo el comportamiento deseado.
2. **Green:** implementar el mínimo código para aprobar la prueba manteniendo estilos existentes.
3. **Refactor:** limpiar duplicidad, nombres y deuda técnica conservando la suite verde.

## Criterios de aceptación

- Cobertura objetivo backend ≥ 100% lineal en módulos críticos (`server/`).
- Nuevos endpoints requieren pruebas: unidad (Jest + Supertest) y, si afectan UX, Vitest o Playwright.
- Cada PR debe adjuntar evidencia del comando `npm run test:all` exitoso.
- Actualizar `docs/changelog.md` y referencias de arquitectura cuando cambie el comportamiento observable.

## Automatización con agentes

- Usa `code_surgeon` para aplicar parches seguros durante refactors automáticos.
- Prompts en `ai/` describen guardrails; sincroniza cambios relevantes.
- Registra decisiones de diseño en `docs/adr/` para preservar contexto entre iteraciones IA/humano.
