# SDLC

## Principios

- **Automatización primero:** Cada cambio debe validar lint, pruebas unitarias, UI y E2E (ver `npm run test:all`).
- **Trazabilidad:** Documentar ADRs y actualizar el changelog por feature o fix significativo.
- **Seguridad continua:** Revisar dependencias y parches críticos antes de cada release.

## Pipeline CI/CD

- Workflow: `.github/workflows/ci.yml` (GitHub Actions) ejecuta, en etapas separadas, lint (`npm run lint`), pruebas backend (`npm run test:unit`), pruebas frontend (`npm run test:front`) y E2E (`npm run test:e2e:ci`). El job de E2E primero corre `npm run pretest:e2e:ci` para compilar el front y sembrar el esquema SQLite usado en pruebas, luego publica reportes/traces de Playwright como artefactos.
- `actions/setup-node@v4` gestiona caché de npm para la raíz, `server/` y `client/`. Mantén los `package-lock.json` bajo control de versiones para maximizar el hit rate.
- Husky + lint-staged se activan automáticamente tras `npm install` y bloquean commits con lint o formato pendiente.
- Cualquier fallo en la canalización bloquea el merge; reintenta localmente con `npm run test:ci` antes de actualizar la PR.

## Flujo de trabajo recomendado

1. Crear rama desde `main` siguiendo convención `feature/<descripcion>` o `fix/<descripcion>`.
2. Redactar o actualizar ADR si la decisión afecta arquitectura.
3. Aplicar TDD (`docs/tdd_philosophy.md`) y mantener la suite verde.
4. Ejecutar `npm install` en la raíz para garantizar que Husky + lint-staged estén activos, y abrir PR con checklist:

    - [ ] `npm run test:all`
    - [ ] Actualización de docs relevante
    - [ ] Entrada en `docs/changelog.md`

5. Merge por squash para mantener historial limpio una vez aprobada y verificada en CI.

## Versionado

- Seguir **SemVer (MAJOR.MINOR.PATCH)**.
- Incrementar:

    - **MAJOR** al introducir cambios incompatibles (p. ej. schema de base).
    - **MINOR** para features compatibles hacia atrás.
    - **PATCH** para correcciones o hardening sin cambios funcionales visibles.

## Publicación

- Generar etiqueta (`git tag vX.Y.Z`).
- Adjuntar notas en `docs/changelog.md` y, si aplica, crear release notes externos.
- Distribuir binarios/artefactos: subir `client/dist` y copia de `schema.sql` a repositorio de despliegue si se usa.
