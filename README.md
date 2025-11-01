# Jantetelco Heatmap Platform

A full-stack civic-tech application for capturing community incident reports, aggregating them into heatmaps, and exporting the insights for urban decision making. The system ships with a React + Leaflet client, an Express + SQLite API, and automated quality tooling so AI agents and humans can collaborate confidently.

## 🎯 **Start Here** ← NEW (October 31, 2025)

**New deployment & responsive design just shipped!** 🚀

- 👉 **Quick start:** Read [`INDEX.md`](INDEX.md) (Master navigation for all docs)
- 🚀 **First time user:** Read [`EMPIEZA_AQUI.md`](EMPIEZA_AQUI.md) (2 min)
- ✅ **Validate live:** Open http://145.79.0.77:4000/ and hard refresh (Ctrl+Shift+R)
- 📱 **Mobile design:** Responsive CSS now deployed (top bar 50px, map 93% viewport)
- 🛠️ **Deploy script:** Use `.\deploy.ps1` for 36-second deployments

**Status:** ✅ Server online | ✅ Responsive mobile | ✅ Deployment automated | 🔄 Waiting for your feedback

---

## Why it matters

- **Rapid situational awareness:** Plot geo-referenced reports instantly on an interactive heatmap.
- **Privacy-aware analytics:** Toggle grid-based aggregation to anonymize sensitive locations while spotting hotspots.
- **Operations ready:** Export to PNG or GeoJSON, serve the SPA directly from Node, and persist data with a zero-configuration SQLite database.
- **AI-first workflow:** Documentation, tests, and prompts are curated so autonomous agents can extend the codebase safely (see `ai/` and `docs/`).

## System at a glance

```text
┌──────────────┐         REST/JSON          ┌───────────────┐
│ React SPA    │  ───────────────────────▶ │ Express API    │
│  (Leaflet)   │    VITE proxy / fetch     │  + SQLite DB   │
└─────┬────────┘ ◀───────────────────────  └─────────┬──────┘
      │               Static assets (dist)            │
      └──────────────┬────────────────────────────────┘
                     │  Single Node process serves API + SPA
                     ▼
                SQLite data.db (reportes)
```

- **Frontend** (`client/`): Vite-powered React SPA with Leaflet heatmap layers, filters, exports, geolocation capture, and same-origin tile proxying to satisfy the strict CSP.
- **Backend** (`server/`): Express service exposing `/api/reportes` endpoints, input validation, GeoJSON export, and static serving of the built SPA.
- **Database** (`schema.sql`): Single `reportes` table optimized with location & type indexes; initialization managed via `npm run init`.

## 🎉 Recent Improvements (October 31, 2025)

### ✨ Mobile-First Responsive Design
- **CSS rewritten** for mobile optimization: top bar reduced from 60px → 50px
- **Buttons redesigned**: flex layout ensures equal width and accessibility (44px+ touch targets)
- **Viewport optimization**: Map now occupies 93% of screen in mobile view (was 40%)
- **No clutter**: Brand and metrics hidden on mobile; focus on the map
- **Live deployment**: Changes deployed to `145.79.0.77:4000` in 36 seconds via automated script

### 🚀 Automated Deployment (30 seconds)
- **New `deploy.ps1` script**: Vite build → SCP transfer → PM2 restart → validation → done
- **Zero manual steps**: Build, SSH, validation all automated
- **Error handling**: Built-in checks for missing files, failed builds, restart status
- **Timestamp validation**: Ensures CSS/JS hashes match between local and production

### 📚 Documentation Overhaul
- [`docs/DEPLOYMENT_PROCESS.md`](docs/DEPLOYMENT_PROCESS.md) - Complete reference (2000+ lines)
- [`docs/DEPLOYMENT_QUICK_START.md`](docs/DEPLOYMENT_QUICK_START.md) - 2-minute guide
- [`docs/RESPONSIVE_MOBILE_IMPROVEMENTS.md`](docs/RESPONSIVE_MOBILE_IMPROVEMENTS.md) - Technical details
- [`docs/VISUAL_VALIDATION_GUIDE.md`](docs/VISUAL_VALIDATION_GUIDE.md) - What you should see
- [`PRE_VALIDACION_CHECKLIST.md`](PRE_VALIDACION_CHECKLIST.md) - Deployment verification

### 🔧 Admin Panel Fixes
- Fixed 404 errors on admin endpoints
- Added `/api/categorias-con-tipos` for nested category/type management
- Admin panel now fully responsive and functional

**See:** [`RESUMEN_HOY_OCT31.md`](RESUMEN_HOY_OCT31.md) for full summary

---

## Tech stack

| Layer      | Technologies                                                      |
| ---------- | ----------------------------------------------------------------- |
| Frontend   | React 18, Vite 5, Leaflet + leaflet.heat, html-to-image           |
| Backend    | Node 20+, Express 4, SQLite3 5, Helmet, CORS, Compression, Morgan |
| Tooling    | Jest, Vitest, Playwright, ESLint, Prettier                        |
| Automation | `ai/` directives, `code_surgeon` scripts, `docs/` governance      |

## Project structure (trimmed)

```text
server/             Express API + SQLite access layer
client/             React SPA (heatmap UI)
docs/               Architecture, SDLC, UX, API specs, governance
ai/                 Agent prompts and guardrails
code_surgeon/       Safe editing toolkit for automated agents
tests/              Jest (backend), Vitest (frontend), Playwright (e2e)
scripts/            Automation helpers
```

## Getting started (development)

1. **Prerequisites**
   - Node.js 20.x (or newer LTS) and npm 10+
   - On Windows PowerShell, enable execution policy for local scripts if needed: `Set-ExecutionPolicy -Scope Process RemoteSigned`

2. **Quick start (Recommended)** 🚀

   ```powershell
   # Inicia ambos servidores automáticamente con reinicio persistente
   .\start-dev.ps1
   ```

   Este script:
   - ✅ Verifica e instala dependencias automáticamente
   - ✅ Inicializa la base de datos si no existe
   - ✅ Abre backend (puerto 4000) y frontend (puerto 5173) en ventanas separadas
   - ✅ Reinicia automáticamente los servidores si hay errores
   - ✅ Muestra credenciales de prueba y URLs

   📚 **Documentación completa:** [`docs/SCRIPTS_SERVIDORES.md`](docs/SCRIPTS_SERVIDORES.md)

3. **Inicio manual (Alternativa)**

   <details>
   <summary>Click para expandir pasos manuales</summary>

   **Install dependencies:**

   ```powershell
   cd server
   npm install
   cd ..\client
   npm install
   ```

   **Run services:**
   - Backend (with live schema init and static hosting):

     ```powershell
     cd ..\server
     npm run init   # creates data.db using schema.sql
     npm run dev    # runs Express on http://localhost:4000
     ```

   - Frontend (Vite dev server with proxy):

     ```powershell
     cd ..\client
     npm run dev    # defaults to http://localhost:5173
     ```

     Set `VITE_API_URL` in a `.env` file if the API runs on a non-default origin.

   </details>

4. **Detener servidores** 🛑

   ```powershell
   # Detiene todos los servidores de Jantetelco de forma segura
   .\stop-servers.ps1
   ```

   Útil cuando:
   - Las ventanas de terminal se cerraron pero los procesos siguen corriendo
   - Necesitas liberar los puertos 4000 y 5173
   - Quieres reiniciar desde cero

5. **Working with agents**
   - Open `ai/COPILOT/code_agent_directives.md` to coordinate GitHub Copilot Code Agent.
   - Use `npm run ai:bootstrap` from the repository root to install shared tooling.

## Production build & deployment

### Quick start (Recommended) 🏭

```powershell
# Compila frontend y ejecuta en modo producción
.\start-prod.ps1 -Build
```

Este script:

- ✅ Compila automáticamente el frontend si no existe o si usas `-Build`
- ✅ Inicia un solo proceso Node que sirve API + SPA en puerto 4000
- ✅ Reinicia automáticamente ante errores
- ✅ Optimizado para producción (NODE_ENV=production)

📚 **Documentación completa:** [`docs/SCRIPTS_SERVIDORES.md`](docs/SCRIPTS_SERVIDORES.md)

### Manual deployment (Alternativa)

<details>
<summary>Click para expandir pasos manuales</summary>

1. Build the SPA:

   ```powershell
   cd client
   npm install
   npm run build
   ```

2. Prepare the backend:

   ```powershell
   cd ..\server
   npm install
   npm run init   # idempotent schema setup
   ```

3. Serve everything from the backend:

   ```powershell
   npm start
   ```

</details>

The Express server will serve both the API and the files under `client/dist`. Configure with environment variables:

| Variable           | Default     | Description                                           |
| ------------------ | ----------- | ----------------------------------------------------- |
| `PORT`             | `4000`      | HTTP port for Express                                 |
| `DB_PATH`          | `./data.db` | Absolute/relative path for SQLite file                |
| `TILE_PROXY_HOSTS` | `a,b,c`     | Comma-separated hosts or base URLs for `/tiles` proxy |

## Operations & maintenance

- **Log rotation:** Morgan logs go to stdout by default. In production, run the Node process under a supervisor (PM2, systemd, Docker) with rotation enabled or swap Morgan’s stream for a pre-rotated file writer.
- **Database backups:** The entire dataset lives inside the SQLite file configured via `DB_PATH`. Back it up regularly with `npm run backup:db` (supports `DB_PATH` and `BACKUP_DIR` overrides), test restores, and always snapshot before schema migrations or OS upgrades.
- **Automated backups:** For Windows Task Scheduler, point a daily task at `powershell.exe -ExecutionPolicy Bypass -File scripts/backup-db.ps1` (set `-DbPath`/`-BackupDir` as needed). On Linux/macOS, add `0 2 * * * cd /path/to/repo && DB_PATH=./server/data.db BACKUP_DIR=./backups npm run backup:db >> /var/log/jantetelco-backups.log 2>&1` to `crontab`.
- **One-stop maintenance:** `npm run maintenance` encadena respaldo y smoke-check en un solo comando. Para automatizaciones headless, usa `node scripts/maintenance.js --log ./logs/maintenance.log --metrics-file ./metrics/maintenance.prom --metrics-url http://pushgateway:9091/metrics/job/heatmap --metrics-labels env=prod,region=mx --retain-backups 7 --compress-log --archive ./archives/$(Get-Date -Format yyyyMMdd-HHmmss).tgz` (o la variante `scripts/maintenance.ps1` con `-MetricsFile`, `-MetricsUrl`, `-MetricsLabels`, `-RetainBackups`, `-CompressLog`, `-ArchivePath`). El script también respeta variables como `MAINTENANCE_METRICS_URL`, `MAINTENANCE_METRICS_LABELS`, `MAINTENANCE_ENV/REGION`, `MAINTENANCE_BACKUP_DIR` y `MAINTENANCE_ARCHIVE_PATH` para ejecutar sin banderas adicionales.
- **Tile health monitoring:** Schedule `powershell.exe -ExecutionPolicy Bypass -File scripts/tile-smoke.ps1 -Template "http://localhost:4000/tiles/{z}/{x}/{y}.png" -LogFile C:\\Logs\\tiles.log` on Windows or add `30 6 * * * cd /path/to/repo && node scripts/tile-smoke.js http://localhost:4000/tiles/{z}/{x}/{y}.png --json >> /var/log/jantetelco-tiles.log 2>&1` to `crontab` so you receive early warnings when upstream providers degrade.
- **Tile proxy knobs:** The `/tiles/{z}/{x}/{y}.png` proxy cycles through OpenStreetMap’s CDN by default and serves a cached 1×1 PNG fallback (header `X-Fallback-Tile: 1`) when upstreams fail. Override the hosts via `TILE_PROXY_HOSTS="https://tiles1.example.com,https://tiles2.example.com"` to point at your own cache/CDN; comma-separated values are normalized automatically.
- **Tile smoke-check:** Run `npm run smoke:tiles` to probe representative tiles and detect degraded responses (fallback PNGs) or outright errors. Pasa un dominio alterno como primer argumento (`npm run smoke:tiles -- "https://tile.example.com/{z}/{x}/{y}.png"`) y afina los objetivos con `--coords` si necesitas validar mosaicos específicos.

## API overview

- Base URL: `http://localhost:4000` (or the deployed hostname)
- JSON endpoints:

  | Method | Path                     | Description                                              |
  | ------ | ------------------------ | -------------------------------------------------------- |
  | POST   | `/api/reportes`          | Create a report (tipo, descripcion, lat, lng, peso)      |
  | GET    | `/api/reportes`          | List reports with optional geo/date/type filters         |
  | GET    | `/api/reportes/tipos`    | Enumerate distinct report types                          |
  | GET    | `/api/reportes/geojson`  | Export filtered reports as GeoJSON FeatureCollection     |
  | GET    | `/api/reportes/grid`     | Aggregate reports into grid cells for privacy            |
  | GET    | `/tiles/{z}/{x}/{y}.png` | Same-origin proxy for OpenStreetMap tiles (respects CSP) |

- Detailed schema, parameters, and response samples live in [`docs/api/openapi.yaml`](./docs/api/openapi.yaml).

## Data model

| Column        | Type    | Notes                                                 |
| ------------- | ------- | ----------------------------------------------------- |
| `id`          | INTEGER | Autoincrement primary key                             |
| `tipo`        | TEXT    | Category/label provided by the user                   |
| `descripcion` | TEXT    | Optional narrative                                    |
| `lat` / `lng` | REAL    | Geographic coordinates (validated server-side)        |
| `peso`        | INTEGER | Intensity for heatmap weighting, defaults to 1        |
| `creado_en`   | TEXT    | ISO timestamp generated by SQLite (`datetime('now')`) |

## Sample data seeding

Need a quick dataset for demos or manual QA? Run the seeder inside `server/`:

```powershell
cd server
npm install    # first time only
npm run seed   # appends representative reports
# optionally wipe existing rows before seeding
npm run seed -- --reset
# or seed from a custom JSON fixture
npm run seed -- --from-file ./fixtures/demo-reportes.json
```

Both commands respect the `DB_PATH` environment variable, letting you seed alternative SQLite files (for example, `DB_PATH=./demo.db npm run seed -- --reset`).

## Testing & quality gates

From the repository root:

```powershell
npm install   # installs shared dev tooling listed in package.json
npm run lint
npm run test:unit
npm run test:front
npm run test:e2e
# or bundle everything, including the Playwright preflight, in a single command
npm run test:all
```

- **Backend unit tests** (`tests/backend`) use Jest + Supertest.
- **Frontend tests** (`tests/frontend`) rely on Vitest and React Testing Library.
- **E2E tests** (`tests/e2e`) run with Playwright; `npm run test:e2e` (and therefore `npm run test:all`) rebuilds the SPA and reinitializes a dedicated `e2e.db` via `node server/server.js --init` before the browser session starts, guaranteeing an isolated dataset for every run.

## Continuous integration & guardrails

- `.github/workflows/ci.yml` runs on every push and pull request targeting `main`, executing lint, back-end, front-end, and Playwright suites with cached installs.
- Playwright HTML reports and traces are archived as workflow artifacts for post-mortem debugging.
- Husky + lint-staged enforce ESLint (no warnings) and Prettier formatting on staged files; triggered automatically after `npm install`. Set `HUSKY=0` if you must bypass the hook for emergencies.
- Add a status badge once the repository is hosted (example: `![CI](https://github.com/<owner>/<repo>/actions/workflows/ci.yml/badge.svg)`).

## Observability & operations

- Logging: Morgan (combined format) emits HTTP logs; extend with application metrics as needed.
- Compression + Helmet + CORS middleware are pre-configured for production readiness.
- Database maintenance: SQLite file lives at `DB_PATH`; back it up before schema migrations.

## Further documentation

| Topic                         | File                                                     |
| ----------------------------- | -------------------------------------------------------- |
| Architecture deep dive        | [`docs/architecture.md`](./docs/architecture.md)         |
| UX & accessibility spec       | [`docs/ux_ui_spec.md`](./docs/ux_ui_spec.md)             |
| Security & privacy stance     | [`docs/security_privacy.md`](./docs/security_privacy.md) |
| Legal & compliance guidelines | [`docs/legal_compliance.md`](./docs/legal_compliance.md) |
| SDLC governance               | [`docs/sdlc/governance.md`](./docs/sdlc/governance.md)   |
| Change history                | [`docs/changelog.md`](./docs/changelog.md)               |

## Roadmap ideas

- Add authentication & rate limiting (pair with `express-rate-limit` + API keys).
- Extend analytics (time-series charts, anomaly detection).
- Automate CI/CD pipeline integrating lint/test/e2e stages.
- Publish a public dataset export with redaction policies.

## Deployment to Production (30 seconds)

### Quick Start

```powershell
# One-liner: build + copy + restart
cd c:\PROYECTOS\Jantetelco\client && npm run build && scp -r dist/* root@145.79.0.77:/root/citizen-reports/server/dist/ && ssh root@145.79.0.77 "cd /root/citizen-reports && pm2 restart citizen-reports"

# Or use the automated script
.\deploy.ps1 -Message "Your deployment message"
```

### Detailed Process

See **[`docs/DEPLOYMENT_PROCESS.md`](./docs/DEPLOYMENT_PROCESS.md)** for the complete 5-step workflow with explanations, troubleshooting, and validation steps.

**Quick reference:** [`docs/DEPLOYMENT_QUICK_START.md`](./docs/DEPLOYMENT_QUICK_START.md)

**Automated script:** `./deploy.ps1`

### Key Points

- ✅ Build locally: `npm run build` (Vite compiles React → `dist/`)
- ✅ Copy to server: `scp -r dist/* root@145.79.0.77:/root/citizen-reports/server/dist/`
- ✅ Restart app: `ssh root@145.79.0.77 "pm2 restart citizen-reports"`
- ✅ Browser: Hard refresh (`Ctrl+Shift+R`) to clear cache
- ⏱️ **Total time: ~30 seconds**

### Environment

| Key | Value |
|-----|-------|
| **Host** | `145.79.0.77` |
| **User** | `root` |
| **SSH Port** | 22 |
| **HTTP Port** | 4000 |
| **App Path** | `/root/citizen-reports/` |
| **URL** | `http://145.79.0.77:4000/` |

---

## Contributing

1. Fork or branch from `main`.
2. Align on requirements via ADRs (`docs/adr/`).
3. Apply TDD workflow (`docs/tdd_philosophy.md`), run the full `npm run test:all` gate, and update the changelog.
4. Open a pull request referencing the relevant issues/ADRs.

---

Need something clarified or a quick walkthrough? Start with [`docs/architecture.md`](./docs/architecture.md) for a detailed mental model, then explore the code in `client/src` and `server/`.
