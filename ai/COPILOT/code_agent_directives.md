# GitHub Copilot Code Agent — Directives
Timestamp: 2025-09-27 15:10:08 GMT-6
UUID: 85e9924d-cbb1-4243-ae88-e8386a42991d

## Principios obligatorios
- UX/UI customer high-focused
- FrontEnd/BackEnd separados (MVC)
- Privacy/Security/Legal/Resilience by Design
- Modular/Integral by Design
- Refactorización inteligente
- SoC, DRY, SOLID, YAGNI, KISS
- Fail-safe sin placeholders
- Lint-error free
- Gobernanza IA: no retrabajar soluciones, no archivos fuera de rutas

## SDLC
- Tests primero (unit, integration, e2e)
- Implementar mínimo para pasar tests
- Cobertura mínima: 90% backend, 80% frontend
- Ciclo: test → implementar → lint → refactor → QA

## Rutas
- server/** → backend
- client/** → frontend
- tests/** → pruebas
- docs/** → documentación
- ai/** → prompts
- scripts/ai/** → scripts IA
