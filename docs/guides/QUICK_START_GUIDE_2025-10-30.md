# 🚀 QUICK START GUIDE - JANTETELCO CITIZENS REPORT PORTAL

**Last Updated:** October 30, 2025  
**Status:** ✅ Production Ready  
**System:** Online at http://145.79.0.77:4000

---

## 🎯 Quick Access

### 📍 Live System
- **URL:** http://145.79.0.77:4000
- **Status:** ✅ Online
- **Features Available:**
  - 🗺️ Interactive heatmap (14+ reports)
  - 📝 Report form (21 report types)
  - 👨‍💼 Admin panel (CRUD for users, categories, types)
  - 📊 Dashboard with statistics

### 🧪 Test Users (Password: `admin123`)

| Email | Role | Department |
|-------|------|-----------|
| `admin@jantetelco.gob.mx` | Admin | Administration |
| `supervisor.obras@jantetelco.gob.mx` | Supervisor | Public Works |
| `func.obras1@jantetelco.gob.mx` | Staff | Public Works |

---

## 📂 Project Structure (After Reorganization)

```
jantetelco/
├─ config/                    (Configuration files)
│  ├─ .eslintrc.cjs
│  └─ .prettierrc
│
├─ docs/                      (All documentation)
│  ├─ INICIO_RAPIDO.md        (This file)
│  ├─ adr/                    (Architecture decisions)
│  ├─ api/                    (API specs)
│  ├─ operations/             (Operations guides)
│  └─ archive/                (Historical docs)
│
├─ scripts/                   (Automation scripts)
│  ├─ deployment/             (Deploy scripts for VPS)
│  └─ development/            (Dev tools & checks)
│
├─ server/                    (Node.js Express API)
│  ├─ simple-test.js          (MAIN SERVER - 554 lines, 32+ endpoints)
│  ├─ schema.sql              (Database schema)
│  ├─ data.db                 (SQLite database)
│  └─ package.json
│
├─ client/                    (React frontend)
│  ├─ src/                    (Source code)
│  ├─ dist/                   (Compiled assets - deployed to VPS)
│  ├─ package.json
│  └─ vite.config.js
│
├─ tests/                     (Test files)
│  └─ fixtures/               (Test data)
│
└─ package.json               (Root dependencies)
```

---

## 🛠️ Development Setup (Local)

### Prerequisites
- Node.js 20+ ([Download](https://nodejs.org/))
- npm 10+ (comes with Node.js)
- Git

### Installation

```bash
# Clone repository
git clone <repo-url>
cd jantetelco

# Install dependencies
npm install

# Install backend deps
cd server && npm install && cd ..

# Install frontend deps
cd client && npm install && cd ..

# Initialize database
cd server && npm run init && cd ..
```

### Running Locally

**Option 1: Manual Setup (Two Terminal Windows)**

```powershell
# Terminal 1: Backend on :4000
cd server
npm run dev

# Terminal 2: Frontend on :5173 (with proxy to :4000)
cd client
npm run dev
```

Then open http://localhost:5173

**Option 2: Using Helper Scripts (If Available)**

```powershell
.\start-dev.ps1      # Auto-starts both servers
```

---

## 📝 Creating Your First Report

### As a Citizen (No Login Required)

1. Open http://145.79.0.77:4000
2. Click **"Reportar Problema"** button
3. Fill the form:
   - **Tipo:** Choose from 21 available types (baches, alumbrado, agua, etc)
   - **Descripción:** Detailed problem description
   - **Ubicación:** Click on map to select location
   - **Prioridad:** Choose HIGH/MEDIUM/LOW
4. Click **"Enviar Reporte"**
5. Report appears on heatmap instantly ✅

### Available Report Types (21 Total)

**Public Works:**
- baches (potholes)
- alumbrado (street lights)
- desagüe (drainage)
- árboles (trees)
- ciclovía (bike lanes)

**Water Services:**
- agua (water issues)
- alcantarillado (sewage)
- pluvial (storm water)

**Security:**
- seguridad (security issues)
- tránsito (traffic)
- emergencia (emergencies)

**And 11 more...**

---

## 👨‍💼 Admin Panel

### Accessing Admin Panel

1. Open http://145.79.0.77:4000
2. Look for **"🔐 Admin"** link in navigation
3. Login with admin credentials:
   - Email: `admin@jantetelco.gob.mx`
   - Password: `admin123`

### Admin Panel Sections

#### 👥 Users Management
- View all users (8 test users available)
- Create new user
- Edit user details
- Change password
- Assign roles (admin, supervisor, staff)
- Set department

#### 📋 Categories Management
- View all 7 categories (Obras Públicas, Servicios Públicos, etc)
- Create new category
- Edit category name and description
- Manage nested report types

#### 🏷️ Report Types Management
- View all 21 report types
- Create new type
- Edit type properties:
  - Name (tipo)
  - Display name (nombre)
  - Icon (icono)
  - Color (color)
  - Category assignment
- Activate/deactivate types

#### 🏢 Departments
- View all 8 departments
- Create new department
- Assign staff to departments
- Set department supervisor

---

## 🔌 API Endpoints (Quick Reference)

### Public Endpoints (No Auth Required)

```
GET  /                          HTML (frontend)
GET  /api/tipos                 All report types (21)
GET  /api/categorias-con-tipos  Categories with nested types
GET  /api/reportes              All reports (list, filter)
GET  /api/reportes/geojson      GeoJSON export
GET  /api/reportes/grid         Grid aggregation
POST /api/reportes              Create new report
```

### Admin Endpoints (Auth Required)

```
GET    /api/admin/usuarios              List users
POST   /api/admin/usuarios              Create user
GET    /api/admin/usuarios/:id          Get user
PUT    /api/admin/usuarios/:id          Update user
DELETE /api/admin/usuarios/:id          Delete user

GET    /api/admin/categorias            List categories
POST   /api/admin/categorias            Create category
PUT    /api/admin/categorias/:id        Update category
DELETE /api/admin/categorias/:id        Delete category

GET    /api/admin/tipos                 List types
POST   /api/admin/tipos                 Create type
PUT    /api/admin/tipos/:id             Update type
DELETE /api/admin/tipos/:id             Delete type
```

### Authentication

```
GET  /api/auth/me               Get current user
GET  /api/usuarios              Alias for users list
GET  /api/dependencias          Get departments
GET  /api/roles                 Get available roles
```

---

## 📊 API Testing with curl

### Get All Report Types
```bash
curl http://145.79.0.77:4000/api/tipos
```

### Create a Report
```bash
curl -X POST http://145.79.0.77:4000/api/reportes \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "bache",
    "descripcion": "Gran bache en calle Juárez",
    "lat": 18.7,
    "lng": -99.1,
    "peso": 5
  }'
```

### Get Categories with Types
```bash
curl http://145.79.0.77:4000/api/categorias-con-tipos
```

---

## 🗄️ Database

### Location
- **Local:** `server/data.db` (SQLite3)
- **Schema:** `server/schema.sql` (auto-initialized)

### Tables (8 Total)
```
reportes              14+ citizen reports
usuarios              8 test users
dependencias          8 municipal departments
categorias            7 report categories
tipos_reporte         21 report types
sesiones              Session management
asignaciones          Report assignments
historial_cambios     Audit trail
```

### Initialize Database
```bash
cd server
npm run init          # Creates/resets data.db
```

### Query Database
```bash
# Using sqlite3 CLI
sqlite3 server/data.db "SELECT COUNT(*) FROM reportes;"
```

---

## 🧪 Testing

### Run All Tests
```bash
npm run test:all      # Lint + unit + frontend + e2e
```

### Run Specific Tests
```bash
npm run test:unit     # Backend tests only
npm run test:front    # Frontend tests only
npm run test:e2e      # End-to-end tests
```

---

## 🚀 Deployment to VPS

### Prerequisites
- SSH access to VPS (145.79.0.77)
- Ubuntu 24.04 LTS
- Node.js 20+ installed
- PM2 installed globally

### Quick Deploy

```bash
# 1. Build frontend
cd client && npm run build && cd ..

# 2. Upload to VPS
scp -r dist/ user@145.79.0.77:/path/to/jantetelco/client/

# 3. Restart service
ssh user@145.79.0.77
pm2 restart citizen-reports
```

### Or Use Deployment Script
```bash
./scripts/deployment/deploy-complete.ps1
```

---

## 🐛 Troubleshooting

### Issue: Cannot access http://145.79.0.77:4000

**Solution:**
1. Check PM2 service: `pm2 list`
2. Verify port 4000 is open: `sudo ufw allow 4000`
3. Check logs: `pm2 logs citizen-reports`
4. Restart: `pm2 restart citizen-reports`

### Issue: Types dropdown empty

**Solution:**
- Verify GET /api/tipos returns data
- Check database has tipos_reporte records
- Restart backend: `npm run dev` (local) or `pm2 restart` (VPS)

### Issue: Reports not appearing on map

**Solution:**
1. Check GET /api/reportes returns reports
2. Verify coordinates are valid (lat ∈ [-90,90], lng ∈ [-180,180])
3. Check browser console for errors
4. Clear cache: Ctrl+Shift+Delete

### Issue: Admin panel empty

**Solution:**
1. Verify you're logged in (check /api/auth/me)
2. Check GET /api/admin/usuarios returns data
3. Check database has users
4. Try logging out and back in

---

## 📚 Documentation

### Important Docs
- **[WORKSPACE_REORGANIZATION](./WORKSPACE_REORGANIZATION_2025-10-30.md)** - Folder structure guide
- **[RESUMEN_OPERACION_COMPLETA](./RESUMEN_OPERACION_COMPLETA_2025-10-30.md)** - Complete operation summary
- **[API Reference](./docs/api/openapi.yaml)** - OpenAPI specification
- **[Architecture Decisions](./docs/adr/)** - Design decisions

### Common Tasks

**Add a new report type:**
1. Go to Admin Panel → Report Types
2. Click "Create Type"
3. Fill form: nombre, icono, color, category
4. Click Save

**Create a new user:**
1. Go to Admin Panel → Users
2. Click "Create User"
3. Fill form: email, password, role, department
4. Click Save

**Export reports:**
```bash
curl http://145.79.0.77:4000/api/reportes/geojson > reports.geojson
# Open in QGIS, ArcGIS, or other GIS software
```

---

## 🔐 Security Notes

### Demo Credentials (LOCAL ONLY)
```
Email: admin@jantetelco.gob.mx
Password: admin123
```

⚠️ **IMPORTANT:** Change passwords before production use!

### Next Phase: Real Authentication
- Replace demo auth with JWT tokens
- Implement bcrypt password hashing
- Add email verification
- Add 2FA (optional)

---

## 📞 Support

### Having Issues?

1. **Check logs:**
   ```bash
   # Local
   npm run dev
   
   # VPS
   pm2 logs citizen-reports
   ```

2. **Check database:**
   ```bash
   cd server && npm run init
   ```

3. **Restart service:**
   ```bash
   # Local: Stop (Ctrl+C) and restart
   npm run dev
   
   # VPS
   pm2 restart citizen-reports
   ```

4. **Reset everything:**
   ```bash
   rm server/data.db
   cd server && npm run init
   npm run dev
   ```

---

## 🗺️ Project Map

```
📍 Where to Find Things:

Looking for...                          Check...
────────────────────────────────────────────────────────────
Report form logic                      client/src/ReportForm.jsx
Map/heatmap                            client/src/SimpleApp.jsx
Admin panel                            client/src/AdminPanel.jsx
API endpoints                          server/simple-test.js
Database schema                        server/schema.sql
Test users                             server/simple-test.js (line ~100)
Test data                              tests/fixtures/*.json
Deployment scripts                     scripts/deployment/
Dev tools                              scripts/development/
Docs & guides                          docs/
Configuration files                    config/
Historical documentation               docs/archive/
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Frontend loads at http://localhost:5173 (or http://145.79.0.77:4000)
- [ ] All 21 report types visible in dropdown
- [ ] Can create a new report
- [ ] Report appears on map immediately
- [ ] Admin panel accessible after login
- [ ] Users/Categories/Types tabs populated
- [ ] No console errors (F12 to check)
- [ ] Database has 14+ reports visible

---

## 🚀 Next Steps

1. ✅ **Phase 1 Complete:** MVP deployed and stable
2. 🔄 **Phase 2 In Progress:** Real authentication (JWT + bcrypt)
3. ⏳ **Phase 3 Planned:** Advanced workflows
4. ⏳ **Phase 4 Planned:** Production hardening

---

**Status:** System operational and ready for use  
**Last Updated:** October 30, 2025  
**Version:** 1.0 (Initial Release)

🎉 Welcome to Jantetelco Citizens Report Portal!
