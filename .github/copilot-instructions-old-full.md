# citizen-reports Heatmap Platform - AI Coding Agent Instructions

## 🛡️ MANDATORY FILE CREATION PROTOCOL (READ FIRST!)

**⚠️ CRITICAL:** Before creating ANY file, you MUST follow this sequence:

1. **IDENTIFY:** What file am I creating? (name, type, purpose)
2. **CONSULT:** Read `.meta/FILE_STRUCTURE_PROTOCOL.md` (the authority)
3. **VERIFY:** Is this location allowed by protocol?
4. **DECIDE:** Where does this file belong? (table below)
5. **CREATE:** Use FULL PATH including directory (NOT root unless protocol says OK)
6. **CONFIRM:** Verify file is NOT in root unless explicitly allowed

**Quick Decision Tree:**
```
Is it documentation? → /docs/
Is it governance? → .meta/
Is it deployment? → /docs/deployment/
Is it validation checklist? → /docs/validation/
Is it script/automation? → /scripts/
Is it core code? → /server/ or /client/
STILL UNSURE? → STOP - Ask user instead of guessing
```

**Forbidden Without Protocol Approval:**
- ❌ Creating files in root directory (except: README.md, package.json, LICENSE, CHANGELOG.md)
- ❌ Creating multiple files without checking each one
- ❌ Assuming location - ALWAYS consult protocol first

**Reference:** See `.meta/AI_FILE_CREATION_MANDATE.md` for complete details

**Last Violation:** Nov 1, 2025 (4 files incorrectly in root) → CORRECTED

---

## ⚠️ BOOTSTRAPPED REALITY CHECK (Read This Second)

**Current Situation (October 2025):**
- 💰 **Capital Available:** $0 USD
- 🤝 **Signed Contracts:** 0
- 📝 **Verbal Commitments:** 0 (prospects "in process")
- ⏰ **Runway:** Dependent on parallel income (freelance/employment)

**This is NOT a funded startup. This is a bootstrapped side-project that MIGHT become a business.**

### Critical Success Milestones (Abandon if not met)

| Milestone | Timeline | Success Criteria | If Failed |
|-----------|----------|------------------|-----------|
| **Validation** | Month 1-3 | 2+ mayors say "yes, interested" after seeing mockups | PIVOT or abandon |
| **First Pilot** | Month 4-6 | 1 municipality using system actively (50+ reports) | Re-evaluate viability |
| **First Payment** | Month 7-9 | 1 municipality paying $200+ USD/month | Consider quitting day job |
| **Sustainability** | Month 12-18 | 3-5 paying clients, $1K-2K MRR | Full-time viable |

### Realistic Financial Projections (Bootstrapped)

**Year 1 (Optimistic Scenario):**
- Month 1-6: $0 MRR (validation + free pilots)
- Month 7-12: $300-800 MRR (1-2 paying clients at discounted rates)
- Setup fees: $2K-5K total (if lucky)
- **Total Year 1 Revenue:** $5K-12K USD

**Year 2 (If survival achieved):**
- Month 13-18: $1K-2.5K MRR (3-5 clients)
- Month 19-24: $3K-6K MRR (6-10 clients)
- Setup fees: $15K-30K total
- **Total Year 2 Revenue:** $40K-80K USD

**Year 3 (Scale phase):**
- Target: 15-25 paying municipalities
- MRR: $10K-20K USD
- **Total Year 3 Revenue:** $150K-280K USD

### Required Parallel Income Strategy

**You CANNOT live off this business for 12-18 months minimum.**

**Survival strategies:**
1. ✅ Keep current job (dedicate 15-20hrs/week to this)
2. ✅ Freelance income ($2K-4K USD/month minimum)
3. ✅ Family support (living expenses covered)
4. ❌ Quit everything and "bet on yourself" ← **This will fail**

### When to Abandon Project

**Red flags (quit if 2+ are true by Month 6):**
- ❌ Zero mayors willing to meet with you
- ❌ Meetings happen but all say "send me info" and ghost
- ❌ Free pilots get 0 usage (<10 reports/month)
- ❌ You're spending >30hrs/week and getting burned out
- ❌ Parallel income is suffering (losing freelance clients)

**Green flags (continue if 2+ are true):**
- ✅ 1+ municipalities actively using free pilot (50+ reports)
- ✅ Mayor/staff call YOU asking for updates
- ✅ Other municipalities hear about pilot and ask to join
- ✅ You're working <20hrs/week and making progress

---

## Business Context (Aspirational Vision)

**What This Could Become (If validation succeeds):**

**Value Proposition:** Transparency platform for municipal governments in Mexico and Latin America. Citizens report urban issues (potholes, broken streetlights, water leaks), government staff manages resolution, and the public tracks progress via real-time heatmaps.

**Target Market:** 2,469 municipalities in Mexico alone, most lacking modern civic engagement tools. Each deployment generates recurring revenue through SaaS model + professional services.

**Political Benefits for Officials:**
- 📊 **Transparency = Trust:** Public heatmaps show proactive governance
- 🎯 **Data-Driven Budgets:** Justify infrastructure spending with geo data
- 🏆 **Accountability Metrics:** Demonstrate closure rates and response times
- 🗳️ **Re-election Asset:** Tangible evidence of effective administration

**Revenue Model (Aspirational):**
- Municipal subscription: $500-2K USD/month (varies by population)
- Setup/training: $5K-15K USD one-time
- Custom integrations: $10K-50K USD (ERP, GIS systems)
- Scale target: 50 municipalities = $30K-100K USD/month recurring

**Revenue Reality (Bootstrapped - See "Bootstrapped Reality" section above for honest projections)**

## Deployment Models & Official Government Integration

### Critical Business Requirement: Government Legitimacy

**Challenge:** Citizens and officials need to see this as an "official government portal," not a third-party service. This requires specific deployment strategies.

### Four-Tier Deployment Model (Bootstrapped Reality)

#### Tier 0: Free Pilot (External Domain - 60-90 days) 🆓
**Validation Phase - Get First 3 Municipalities Using System**

```
Architecture:
- Backend: Your single server (shared across pilots)
- Frontend URL: reportes.tuempresa.com/{municipio}
- Branding: Municipality logo + "En colaboración con H. Ayuntamiento"
- Data: Isolated by municipio_id in database
```

**Onboarding Process:**
1. Mayor agrees to "prueba gratuita sin compromiso"
2. You configure: `reportes.tuempresa.com/citizen-reports`
3. You train 2-3 key staff (1 hour session)
4. They use it for 60-90 days (no payment)
5. End of pilot: Convert to Tier 1 or cancel

**Success Metrics to Track:**
- Reports created: Target 50+ in 60 days
- Active users: Target 3-5 staff members
- Mayor engagement: Checks dashboard weekly?
- Citizen adoption: 10+ unique reporters

**Conversion Strategy (Day 60):**
```
If metrics met:
  → "Para continuar y hacerlo oficial, migramos a dominio .gob.mx"
  → Pitch Tier 1 at discounted rate ($300-400/month early adopter)
  
If metrics NOT met:
  → Shut down gracefully
  → Ask for feedback: "¿Qué necesitarían para que esto funcione?"
  → Learn and iterate for next pilot
```

**⚠️ CRITICAL WARNING:**
- **Do NOT run >3 free pilots simultaneously** (you'll burn out)
- **Set hard deadline:** 90 days maximum, then convert or shut down
- **Never say "free forever"** - always "prueba gratuita por 60 días"

**Target:** First 3 municipalities to validate product-market fit

---

#### Tier 1: SaaS Standard ($300-800 USD/month)
**White-Label with Municipal Domain** - Recommended for 90% of municipalities

```
Architecture:
- Backend: Your centralized SaaS (hidden from users)
- Frontend URL: reportes.{municipio}.gob.mx (official domain)
- DNS: CNAME from .gob.mx domain to your servers
- SSL: Auto-managed Let's Encrypt with municipal branding
```

**Technical Implementation:**
```javascript
// Multi-tenancy by domain detection
app.use((req, res, next) => {
  const host = req.hostname;
  
  // Detect municipality by official domain
  if (host.match(/^reportes\.(.+)\.gob\.mx$/)) {
    const municipioId = host.split('.')[1]; // Extract 'citizen-reports'
    req.municipio = loadMunicipioConfig(municipioId);
  }
  
  next();
});
```

**Onboarding Process:**
1. Municipality signs contract
2. You create subdomain: `reportes.{municipio}.gob.mx`
3. Municipality configures DNS CNAME record
4. You auto-generate SSL certificate
5. Citizens access via official .gob.mx domain

**Includes:**
- White-label branding (municipal logo, colors)
- Automatic SSL certificate management
- Daily backups
- 99.5% uptime SLA
- Email support (24-48hrs response)

**Target:** Small municipalities (10K-30K residents)

---

#### Tier 2: SaaS Premium ($1,200-2,000 USD/month)
**Everything in Tier 1 PLUS:**

- Embedded widget for existing government portal
- Custom API integrations (ERP, GIS systems)
- 99.9% uptime SLA
- Priority support (12-24hrs response)
- Dedicated account manager
- Advanced analytics dashboard

**Use Case:** Municipality already has a portal at `www.{municipio}.gob.mx` and wants to embed the reporting system as a section.

**Technical Implementation:**
```html
<!-- Embedded in municipality's existing portal -->
<iframe 
  src="https://app.yourplatform.com/widget/{municipio}" 
  style="width:100%; height:800px; border:none;"
  allow="geolocation">
</iframe>
```

**Target:** Medium municipalities (30K-100K residents)

---

#### Tier 3: Self-Hosted Enterprise ($3K-5K USD/month + $15K-25K setup)
**On-Premise Installation with Remote Support**

```
Architecture:
- Installation: Municipality's own servers/cloud
- Access: You maintain remote access for support only
- Updates: Managed remotely by your team
- Data: 100% in municipality's control
```

**Includes:**
- On-site installation and configuration
- Remote monitoring and maintenance
- 99.95% uptime SLA
- 24/7 phone support
- Quarterly on-site training sessions
- Compliance with data sovereignty laws

**Target:** Large municipalities (100K+ residents), state governments

---

### Legal & Legitimacy Requirements (Mexico)

**For system to be accepted as "official government portal":**

✅ **Domain Requirements:**
- Must use `.gob.mx` domain (managed by municipality)
- SSL certificate with valid chain of trust
- Municipality owns DNS records

✅ **Legal Compliance:**
- Privacy notice visible (LFPDPPP - Mexican data protection law)
- Web accessibility (NMX-R-060-SCFI-2015 standard)
- Open data exports (CSV, GeoJSON)
- Immutable audit trail

✅ **Visual Legitimacy:**
```html
<!-- Required footer on all pages -->
<footer>
  <img src="/escudo-{municipio}.png" alt="Escudo Oficial">
  <p>
    Portal Oficial del H. Ayuntamiento de {Municipio}<br>
    Desarrollado por {YourCompany} | Operado por Dirección de Tecnología<br>
    <a href="/aviso-privacidad">Aviso de Privacidad</a> | 
    <a href="/terminos">Términos de Uso</a>
  </p>
</footer>
```

### Multi-Tenancy Database Schema

```sql
-- Add to server/schema.sql

CREATE TABLE IF NOT EXISTS municipios (
  id TEXT PRIMARY KEY,               -- 'citizen-reports', 'cuernavaca'
  nombre TEXT NOT NULL,              -- 'citizen-reports', 'Cuernavaca'
  estado TEXT NOT NULL,              -- 'Morelos'
  dominio_oficial TEXT UNIQUE,      -- 'reportes.jantetelco.gob.mx'
  tier TEXT DEFAULT 'standard',      -- 'standard', 'premium', 'enterprise'
  fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
  activo INTEGER DEFAULT 1,
  configuracion TEXT                 -- JSON with branding, colors, etc.
);

-- Add municipio_id to all tenant-specific tables
ALTER TABLE reportes ADD COLUMN municipio_id TEXT NOT NULL DEFAULT 'demo';
ALTER TABLE usuarios ADD COLUMN municipio_id TEXT NOT NULL DEFAULT 'demo';

CREATE INDEX idx_reportes_municipio ON reportes(municipio_id);
CREATE INDEX idx_usuarios_municipio ON usuarios(municipio_id);
```

**CRITICAL:** Every query MUST filter by `municipio_id` to ensure data isolation:

```javascript
// CORRECT - Data isolated by municipality
db.all(
  'SELECT * FROM reportes WHERE municipio_id = ? AND tipo = ?',
  [req.municipio.id, tipo],
  callback
);

// WRONG - Exposes data across municipalities
db.all('SELECT * FROM reportes WHERE tipo = ?', [tipo], callback);
```

## Sales Context & Common Objections

### Target Buyer Persona

**Primary Decision Maker:** Mayor (Alcalde) or Municipal IT Director  
**Budget Authority:** City Council (Cabildo) approval required for contracts >$50K USD  
**Sales Cycle:** 3-6 months (includes budget approval, council vote, procurement)  
**Primary Motivation:** Visible transparency before re-election campaign

### The REAL Obstacle (Not in Sales Books)

**Objection #0: "We already use WhatsApp/Facebook, it works fine"**
**Frequency:** 85% of first meetings  
**Why It's Fatal:** Free always beats paid unless there's PAIN

**Counter-Strategy Matrix:**

| Mayor's Pain Level | Your Response | Probability of Sale |
|--------------------|---------------|---------------------|
| **No pain** (citizens quiet) | Politely exit meeting | 0% - Don't waste time |
| **Low pain** (occasional complaints) | Leave mockup, follow up in 3 months | 10% - Low priority |
| **Medium pain** (social media pressure) | Demo + 30-day pilot | 40% - Real opportunity |
| **High pain** (protest/scandal/election year) | Close same week | 80% - They NEED you |

**Real Examples from Field:**

```
Scenario A (Waste of Time):
Mayor: "Mandamos reportes por WhatsApp del secretario"
You: "¿Pero no sería mejor con datos abiertos y..."
Mayor: "Funciona así, gracias"
→ RESULT: Ghost you forever

Scenario B (Good Prospect):
Mayor: "Ayer 300 personas protestaron por baches, salió en TV"
You: "¿Cuándo puedo hacer demo al cabildo?"
Mayor: "Mañana a las 10am"
→ RESULT: Contract in 2 weeks
```

**⚠️ BOOTSTRAPPED REALITY:** You need to qualify HARD. Can't afford to spend 3 months chasing mayors with no pain.

### Common Sales Objections & Technical Solutions

#### 1. "It's too expensive for our budget"
**Frequency:** 60% of prospects  
**Counter-Strategy:** ROI Calculator

**Technical Feature Required:**
```javascript
// Dashboard showing cost savings
GET /api/analytics/roi
Response:
{
  "reportes_procesados": 1247,
  "horas_staff_ahorradas": 89,  // vs manual phone calls
  "costo_alternativa_manual": "$18,450 USD",
  "costo_plataforma": "$650 USD/mes",
  "ahorro_neto": "$17,800 USD/mes"
}
```

**Sales Script:** "El sistema se paga solo. Sin esta plataforma, su equipo atiende reportes vía teléfono/Facebook. Con nuestra calculadora, vemos que procesan ~1,200 reportes/mes. A 5 minutos promedio por llamada = 100 horas de staff. A $15 USD/hora = $1,500 USD/mes solo en costos laborales. Nuestra plataforma cuesta $650/mes y automatiza 80% del proceso."

---

#### 2. "What if we want to switch providers later?" (Vendor Lock-in Fear)
**Frequency:** 40% of prospects  
**Counter-Strategy:** Zero Lock-in Guarantee

**Technical Feature Required:**
```javascript
// Full data export without restrictions
GET /api/export/completo
Headers: { Authorization: 'Bearer {admin_token}' }

Response: ZIP file containing:
- reportes.csv (all reports)
- usuarios.csv (all users)
- historial.csv (full audit trail)
- geojson/municipio.geojson (GIS data)
- schema.sql (database structure)
- README.txt (migration guide)
```

**Sales Script:** "Entendemos su preocupación. Por eso incluimos exportación completa sin restricciones. Si en 2 años deciden cambiar de proveedor, presionan un botón y descargan TODO: datos, usuarios, historial. Incluimos hasta instrucciones para migrar a otro sistema. Cero lock-in."

---

#### 3. "We need integration with our existing ERP/financial system"
**Frequency:** 35% of prospects (medium/large municipalities)  
**Counter-Strategy:** RESTful API + Webhooks

**Technical Feature Required:**
```javascript
// Webhooks for key events
POST /api/webhooks/configurar
Body: {
  "evento": "reporte_nuevo",
  "url_destino": "https://erp.municipio.gob.mx/api/recibir",
  "secreto": "abc123..."
}

// When report created, POST to their ERP:
POST https://erp.municipio.gob.mx/api/recibir
Headers: { X-Webhook-Signature: 'sha256=...' }
Body: {
  "evento": "reporte_nuevo",
  "reporte_id": 1247,
  "tipo": "bache",
  "ubicacion": { lat: 18.7, lng: -99.1 },
  "timestamp": "2025-10-09T14:30:00Z"
}
```

**Sales Script:** "Nuestro sistema tiene API REST completa. Podemos enviar notificaciones automáticas a su ERP cuando se crea/cierra un reporte. También podemos consultar su base de contratos para vincular reportes con licitaciones. La integración típica toma 2-3 semanas."

---

#### 4. "Does it work offline? Our staff works in rural areas with poor internet"
**Frequency:** 25% of prospects  
**Counter-Strategy:** PWA with Offline Queue

**Technical Feature Required:**
```javascript
// Service Worker for offline capability
// client/sw.js
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/reportes') && event.request.method === 'POST') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Store in IndexedDB for later sync
        return caches.open('pending-reports').then(cache => {
          cache.put(event.request.url, event.request.clone());
          return new Response(JSON.stringify({ 
            ok: true, 
            offline: true,
            message: 'Reporte guardado. Se enviará cuando haya conexión.' 
          }));
        });
      })
    );
  }
});
```

**Sales Script:** "Funciona sin internet. Cuando un funcionario está en campo y pierde señal, puede seguir reportando. El sistema guarda los reportes localmente y los sube automáticamente cuando recupera conexión. Lo probamos en citizen-reports (zona rural de Morelos) y funciona perfecto."

---

### Features That Close Sales (Priority Order)

**Must-Have for Sales (Tier 1 - Revenue Blockers):**
1. ✅ **ROI Calculator** - Justifies price, eliminates objection #1
2. ✅ **Full Data Export** - Eliminates vendor lock-in fear (objection #2)
3. ✅ **Public Heatmap** - Shows transparency to citizens (political benefit)
4. ✅ **API REST + Webhooks** - Enables ERP integration (objection #3)
5. ✅ **Mobile-responsive** - Staff uses phones in field

**Nice-to-Have for Upsell (Tier 2 - Expansion Revenue):**
1. 💰 **Advanced Analytics** (+$300 USD/month) - Predictive maintenance
2. 💰 **Native Mobile App** (+$200 USD/month) - Better offline experience
3. 💰 **WhatsApp Integration** (+$150 USD/month) - Citizen notifications
4. 💰 **White-label Branding** (+$500 setup) - Custom colors/logo

---

### Advanced Analytics & AI Roadmap (Post-Validation Only)

**⚠️ CRITICAL: Do NOT build these until Prerequisites are met**

This section follows **usage-based feature unlocking** pattern (Stripe, Intercom, Salesforce model):
- Features unlock based on customer count + revenue + data volume
- Prevents premature optimization
- Validates demand before investing development time

#### Analytics Tier 1: Basic Insights (Build when: 3+ paying clients)

**Prerequisites:**
- ✅ 3+ municipalities paying $300+ USD/month
- ✅ 3+ months of historical data per client
- ✅ At least 1 client explicitly requests "reports/statistics"
- ✅ MRR >$1K USD (proves business viability)

**Features (2-3 days development):**
```javascript
// 1. Top tipos de reporte (SQL GROUP BY)
GET /api/analytics/top-tipos?municipio={id}
Response: [
  { tipo: 'bache', count: 247, porcentaje: 35% },
  { tipo: 'alumbrado', count: 180, porcentaje: 25% },
  { tipo: 'agua', count: 143, porcentaje: 20% }
]

// 2. Tendencia mensual (time series)
GET /api/analytics/tendencia?tipo=bache&municipio={id}
Response: [
  { mes: '2025-07', reportes: 45, cerrados: 38, promedio_dias: 4.2 },
  { mes: '2025-08', reportes: 52, cerrados: 47, promedio_dias: 5.1 },
  { mes: '2025-09', reportes: 67, cerrados: 58, promedio_dias: 4.8 }
]

// 3. Eficiencia por departamento
GET /api/analytics/departamentos?municipio={id}
Response: [
  { dept: 'obras_publicas', reportes: 320, cerrados: 280, tasa_cierre: 87.5%, promedio_dias: 4.5 },
  { dept: 'servicios_publicos', reportes: 180, cerrados: 165, tasa_cierre: 91.6%, promedio_dias: 3.2 }
]
```

**Pricing:** Included in base plan OR +$100 USD/month  
**Sales Hook:** "Demuestre transparencia con estadísticas públicas"

---

#### Analytics Tier 2: Comparative Benchmarking (Build when: 10+ paying clients)

**Prerequisites:**
- ✅ 10+ municipalities using system
- ✅ 6+ months of data across multiple cities
- ✅ 3+ clients ask "how do we compare to others?"
- ✅ MRR >$5K USD (justifies 1 week development)

**Features (1 week development):**
```javascript
// 4. Benchmark regional
GET /api/analytics/benchmark?municipio={id}
Response: {
  tu_municipio: {
    reportes_per_capita: 0.87,  // per 1K residents
    tiempo_cierre_promedio: 5.2,
    tasa_cierre: 82%
  },
  promedio_similar: {  // Same population range
    reportes_per_capita: 1.2,
    tiempo_cierre_promedio: 8.5,
    tasa_cierre: 65%
  },
  ranking: '2 de 15 municipios similares',  // Top performer
  insight: 'Su municipio cierra reportes 38% más rápido que el promedio'
}

// 5. Hotspots geográficos
GET /api/analytics/hotspots?municipio={id}&tipo=bache
Response: [
  { lat: 18.7, lng: -99.1, reportes: 23, colonia: 'Centro', radius: 500m },
  { lat: 18.72, lng: -99.15, reportes: 18, colonia: 'Norte', radius: 500m }
]
```

**Pricing:** +$200-300 USD/month (Premium tier)  
**Sales Hook:** "Compare su desempeño vs municipios vecinos"  
**Political Benefit:** Mayor can say "Somos #2 en eficiencia de la región"

---

#### Analytics Tier 3: Predictive Intelligence (Build when: 25+ clients, Year 2+)

**Prerequisites:**
- ✅ 25+ municipalities (network effects)
- ✅ 12+ months seasonal data
- ✅ Dedicated analytics budget ($2K+ USD/month revenue from this feature)
- ✅ Data scientist available (hire or outsource)

**Features (2-4 weeks development):**
```javascript
// 6. Predicción de demanda (Linear regression, not LLM)
GET /api/analytics/forecast?municipio={id}&tipo=bache&dias=30
Response: {
  prediccion: 78,  // Expected reports next 30 days
  confianza: 0.85,
  factores: [
    { factor: 'temporada_lluvias', impacto: +40% },
    { factor: 'trafico_alto', impacto: +15% },
    { factor: 'fin_de_año', impacto: -10% }
  ],
  recomendacion: 'Asignar 2 cuadrillas preventivas en Zona Norte'
}

// 7. Detección de anomalías
GET /api/analytics/anomalies?municipio={id}
Response: [
  {
    tipo: 'spike',
    descripcion: 'Reportes de alumbrado aumentaron 300% en Colonia Centro',
    fecha: '2025-10-05',
    posible_causa: 'Falla en subestación eléctrica',
    accion_sugerida: 'Coordinar con CFE'
  }
]
```

**Pricing:** +$500 USD/month (Enterprise tier)  
**Sales Hook:** "Mantenimiento preventivo en vez de reactivo"  
**ROI:** Reduce emergency repairs by 30%

---

#### AI Tier 4: Intelligent Automation (Build when: 50+ clients, Year 3+)

**Prerequisites:**
- ✅ 50+ paying clients
- ✅ >1,000 reports/month across network
- ✅ Budget for LLM APIs ($1K-3K USD/month)
- ✅ Proven ROI from Tier 3 features

**Features (1-2 months development + ongoing API costs):**
```javascript
// 8. Auto-clasificación con IA
POST /api/reportes
Body: {
  descripcion: "Hay un hueco muy grande en calle Juárez frente al mercado",
  foto: [base64_image]
}
// AI automatically detects:
Response: {
  tipo: 'bache',  // Classified from text + image
  prioridad: 'alta',  // Size detected from image
  departamento: 'obras_publicas',
  ubicacion_sugerida: { calle: 'Juárez', colonia: 'Centro' },  // From text
  confianza: 0.92
}

// 9. Chatbot ciudadano (RAG con historial de reportes)
POST /api/chatbot
Body: { query: "¿Cuándo arreglan los baches de mi colonia?" }
Response: {
  respuesta: "Tenemos 3 reportes activos de baches en Colonia Centro. 
             Promedio de atención: 5 días. 
             Obras Públicas tiene asignados 2 reportes, 1 en proceso de cierre.",
  reportes_relacionados: [123, 456, 789],
  siguiente_accion: "¿Desea reportar un bache nuevo?"
}

// 10. Generación automática de reporte mensual
GET /api/analytics/auto-report?municipio={id}&mes=2025-09
Response: {
  pdf_url: '/reports/citizen-reports-sep-2025.pdf',
  summary: "Septiembre 2025: 87 reportes recibidos (+12% vs ago), 
            78 cerrados (89.6% efectividad), 
            tiempo promedio 4.8 días (-0.3 vs agosto). 
            Obras Públicas mejoró 15% en velocidad de respuesta."
}
```

**Pricing:** +$800-1,000 USD/month (AI Premium)  
**Sales Hook:** "Sistema se administra solo con inteligencia artificial"  
**Cost:** OpenAI/Anthropic API ~$0.002/request (need scale to justify)

---

### Feature Unlock Decision Matrix

| Milestone | Analytics Tier | Est. Development | Monthly Pricing | Prerequisites |
|-----------|---------------|------------------|-----------------|---------------|
| **3 clients** | Tier 1 Basic | 2-3 days | Included / +$100 | 3+ months data |
| **10 clients** | Tier 2 Benchmark | 1 week | +$200-300 | Regional comparison viable |
| **25 clients** | Tier 3 Predictive | 2-4 weeks | +$500 | 12+ months seasonal data |
| **50 clients** | Tier 4 AI | 1-2 months + API costs | +$800-1,000 | Proven demand + budget |

**Agent Decision Rule:**
```
if (paying_clients < 3) {
  return "FOCUS ON SALES, NOT FEATURES";
}
if (client_requests < 3 && analytics_tier > 1) {
  return "WAIT FOR EXPLICIT DEMAND";
}
if (MRR < tier_cost * 10) {
  return "NOT FINANCIALLY VIABLE YET";
}
// Only then: BUILD
```

---

### Why This Approach Works (World-Class Examples)

**Stripe:** Basic analytics free → Advanced Sigma $900/mo (unlock: >$1M volume)  
**Intercom:** Basic chat free → Resolution Bot $99/mo (unlock: >1K conversations)  
**Salesforce:** Basic reports included → Einstein AI $50/user (unlock: Enterprise plan)

**Key Pattern:** Features unlock when:
1. Customer has proven value from base product
2. Data volume justifies feature (can't predict with 10 reports)
3. Revenue supports development investment
4. Explicit customer demand (not founder assumption)

---

## Competitive Landscape & Differentiation

### International Competitors (Why Mexican Municipalities Don't Use Them)

| Product | Price | Why It Fails in Mexico |
|---------|-------|------------------------|
| **SeeClickFix** (USA) | $5K-20K USD/month | Prohibitive price, English interface, doesn't understand Mexican municipal structure |
| **FixMyStreet** (UK) | $10K-30K USD/year | Requires dedicated IT team, complex deployment, no INEGI integration |
| **Mejora Tu Ciudad** (MX) | $3K-8K USD/month | Vendor lock-in (no export), requires extensive training, poor support |

### Your Competitive Advantages (Technical Implementation)

#### 1. **Disruptive Pricing (80% cheaper)**
**How to achieve technically:**
- SQLite instead of PostgreSQL (no managed DB costs)
- Single-process deployment (no orchestration needed)
- Zero DevOps (one command deploy: `./start-prod.ps1 -Build`)

**Feature Critical:** One-command deployment script

---

#### 2. **Zero Vendor Lock-in**
**How to achieve technically:**
- Unrestricted data export (CSV, GeoJSON, SQL dump)
- Open schema documentation
- Migration guides included

**Feature Critical:** Export button in admin panel

---

#### 3. **30-Minute Deploy (vs 3 Months)**
**How to achieve technically:**
- No Docker required (Node.js runs directly)
- Automatic SSL certificate generation
- Database initialization with one command

**Feature Critical:** Automated onboarding wizard

---

#### 4. **Works for Non-Technical Municipalities**
**How to achieve technically:**
- Auto-updates without downtime
- Health monitoring dashboard for mayor
- Self-healing error recovery

**Feature Critical:** System health panel visible to non-technical users

---

#### 5. **Optimized for Slow Connections (Rural Areas)**
**How to achieve technically:**
- PWA with aggressive caching
- Lazy-loaded images (<100KB per page)
- Bandwidth saver mode

**Feature Critical:** "Modo Ahorro de Datos" toggle

---

### Unique Value Props for LATAM Market

🇲🇽 **INEGI Integration** - Official neighborhood codes, postal codes  
🗺️ **CONABIO Base Maps** - No dependency on Google Maps  
📊 **Federal Report Formats** - Exports match Secretaría de la Función Pública  
🏛️ **NOM-035 Compliance** - Government transparency standards  
🔐 **National Territory Hosting** - LFPDPPP data protection compliance (when needed)

**Implementation Priority:**
1. INEGI colonias API integration (Tier 1 - Revenue Blocker)
2. Federal format exports (Tier 1 - Required for procurement)
3. CONABIO tiles (Tier 2 - Nice-to-have, fallback to OSM)

## Feature Prioritization Framework

**All new features MUST be evaluated against business impact:**

### Tier 1: Revenue Blockers (Build IMMEDIATELY)
Features without which sales cannot close:

- 🚨 **Full data export** - Eliminates vendor lock-in objection (40% of prospects)
- 🚨 **API REST documented** - Enables ERP integration objection (35% of prospects)
- 🚨 **ROI calculator** - Justifies price, eliminates budget objection (60% of prospects)
- 🚨 **Public heatmap** - Shows transparency (core political benefit)
- 🚨 **Mobile-responsive UI** - Staff uses phones in field (operational requirement)

**Agent Decision Rule:** If feature eliminates a sales objection or enables core political benefit, BUILD NOW.

---

### Tier 2: Expansion Revenue (Build for Upsell)
Features that generate additional monthly recurring revenue:

- 💰 **Advanced analytics** (+$300 USD/month) - Predictive maintenance, budget planning
- 💰 **Native mobile app** (+$200 USD/month) - Better offline experience than PWA
- 💰 **WhatsApp integration** (+$150 USD/month) - Automated citizen notifications
- 💰 **Custom branding** (+$500 one-time) - Municipal colors/logo/escudo

**Agent Decision Rule:** If feature can be sold as add-on module, BUILD when base features complete.

---

### Tier 3: Competitive Moats (Build for Defensibility)
Features that prevent churn and block competitor entry:

- 🏰 **Immutable audit trail** - Compliance requirement, hard to migrate away
- 🏰 **Deep INEGI integration** - Competitors can't easily replicate local data
- 🏰 **ML auto-categorization** - Improves with usage, creates data moat
- 🏰 **Municipality network** - Peer learning, sharing best practices across cities

**Agent Decision Rule:** If feature creates switching costs or network effects, BUILD after revenue blockers.

---

### Tier 4: Nice-to-Have (Build ONLY if resources allow)
Features that don't materially impact revenue or defensibility:

- 🎨 Custom color themes (beyond white-label)
- 🌐 Additional languages (Náhuatl, Maya) - market too small
- 📱 Website widgets for external embedding
- 🔔 Granular notification preferences

**Agent Decision Rule:** If feature doesn't appear in Tier 1-3, DEFER indefinitely unless customer pays for custom development.

---

### Decision Flowchart for AI Agents

```
New Feature Request
    ↓
Does it eliminate a sales objection? → YES → Tier 1 (Build Now)
    ↓ NO
Can we charge extra for it? → YES → Tier 2 (Build for Upsell)
    ↓ NO
Does it create switching costs? → YES → Tier 3 (Build for Moat)
    ↓ NO
Tier 4 (Defer) ← NO ← Does it impact revenue?
```

**Example Application:**

❌ **Bad Priority:** "Add dark mode because it looks cool"  
→ Tier 4 (doesn't impact revenue) → DEFER

✅ **Good Priority:** "Add offline queue because prospect said 'we have poor internet'"  
→ Tier 1 (eliminates objection #4) → BUILD NOW

## Technical Overview

Civic-tech full-stack application for municipal incident reporting: React+Leaflet SPA with Express+SQLite API for geo-referenced reports and heatmap visualization. Single-process deployment serves both API and static assets. **Includes complete authentication system** for municipal staff (funcionarios) with role-based access, report assignments, closure workflows, and audit trails.

**Core Technologies**: Node 20+, Express 4, SQLite3, React 18, Vite 5, Leaflet, Jest/Vitest/Playwright

**Deployment Strategy:** Zero-infrastructure start with SQLite (handles 10K-100K reports/month), migrate to PostgreSQL only when needed (500K+ reports). This keeps costs low for small municipalities while allowing scale for larger cities.

**Last Updated**: October 9, 2025 (includes recent bugfixes for admin panel token auth, tipos edición crashes, interdepartmental workflows, and supervisor visibility)

## Quick Start (Choose Your Task)

- **First time setup:** Run `.\start-dev.ps1` → Access http://localhost:5173
- **Run tests:** `npm run test:all` (from project root)
- **Add new endpoint:** See "Example: Adding a New Endpoint" section below
- **Fix bug:** Check `docs/BUGFIX_*.md` first, then follow TDD cycle
- **Database issue:** Run `npm run init` from `server/` directory
- **Stop servers:** Run `.\stop-servers.ps1` to gracefully shutdown

## Architecture & Structure

```
server/          # Express API + SQLite (single-process serves both API & SPA)
client/          # React SPA with Vite (proxies to server in dev)
tests/           # Jest (backend), Vitest (frontend), Playwright (e2e)
ai/              # Agent directives and governance rules
code_surgeon/    # Safe automated code editing toolkit
docs/            # ADRs, API specs, governance, operations guides
scripts/         # Maintenance, backups, tile monitoring
```

**Key architectural decisions:**

- Backend serves both API (Express routes) AND the built frontend (`client/dist/`) as static files in production. Dev mode runs two separate processes with Vite proxy.
- **Authentication system**: Token-based auth with bcrypt hashing, session management, role-based access (admin/supervisor/funcionario). **CRITICAL:** Token stored as `auth_token` (NOT `token`) in localStorage.
- **Multi-user workflows**: Report assignments (many-to-many), closure approvals with digital signatures, departmental routing
- **Dynamic categories/types**: All report types and categories managed in database (ADR-0009), NOT hardcoded. Use `/api/tipos` and `/api/categorias` endpoints.
- **Admin panel**: Separate routes for types, categories, users, and departments management. **CRITICAL:** Use correct token key and database column names (`tipo` NOT `slug`).

## Common Scenarios (Decision Trees)

### "I need to modify database schema"

1. ✅ Update `server/schema.sql` with new columns/tables
2. ✅ Run `npm run init` to apply changes (idempotent)
3. ✅ Update relevant tests in `tests/backend/`
4. ✅ Document in ADR if architectural change (see `docs/adr/`)
5. ❌ Never edit `data.db` directly with SQLite tools

### "I need to add authentication to an endpoint"

1. Import middleware: `import { requiereAuth, requiereRol } from './auth_middleware.js'`
2. Add to route: `app.get('/api/endpoint', requiereAuth, (req, res) => {...})`
3. For role check: Add `requiereRol(['admin', 'supervisor'])` before handler
4. Access user via `req.usuario` (populated by middleware)
5. Test with: `Authorization: Bearer <token>` header
6. **Frontend:** Use `localStorage.getItem('auth_token')` NOT `localStorage.getItem('token')`

### "I need to query reports by department"

1. ⚠️ Use `req.usuario.dependencia` NOT `reporte.dependencia`
2. For supervisors: Query ALL reports in department (no date filters)
3. For funcionarios: Query only assigned reports (`asignaciones` table)
4. Always log to `historial_cambios` for assignment changes

### "Tests are failing with database errors"

1. Check error message for "no such table" → Run `npm run init`
2. E2E tests failing → Run `cd client && npm run build` first
3. Backend tests → Verify `createApp()` is exported from `server/app.js`
4. Check `DB_PATH` env var → E2E uses `./e2e.db`, tests use temp DBs

## Critical Workflows

### Development Setup (Windows PowerShell)

**PREFERRED: Automated startup script:**

```powershell
.\start-dev.ps1      # Auto-installs deps, initializes DB, starts both servers in persistent windows
.\stop-servers.ps1   # Gracefully stops all citizen-reports processes
```

**Manual setup (alternative):**

```powershell
# Backend: Express API on :4000
cd server
npm install
npm run init      # Creates data.db with schema.sql (idempotent)
npm run dev       # Starts API with Morgan logging

# Frontend: Vite dev server on :5173 (proxies /api and /tiles to :4000)
cd ..\client
npm install
npm run dev
```

**Critical:** Always run `npm run init` before first dev/test run to create the database schema.

**Available PowerShell automation scripts:**

- `start-dev.ps1` - Auto-restart dev servers with dependency checks (opens persistent windows)
- `start-prod.ps1 -Build` - Production build + single-process deployment
- `stop-servers.ps1` - Safe shutdown of all citizen-reports processes (kills node processes by port)
- See `docs/SCRIPTS_SERVIDORES.md` for complete reference

### Testing & Quality Gates

```powershell
# Root-level commands (from monorepo root):
npm run test:all    # Lint + Jest + Vitest + Playwright (rebuilds SPA, resets e2e.db)
npm run test:unit   # Jest backend tests only
npm run test:front  # Vitest frontend tests only
npm run test:e2e    # Playwright with isolated e2e.db

# Pre-commit hook: Husky + lint-staged runs ESLint + Prettier automatically
```

**Coverage targets:** 90% backend (enforced), 80% frontend (goal).

### Production Build

```powershell
cd client && npm run build      # Outputs to client/dist/
cd server && npm start          # Serves API + static files from single process
```

**Environment variables:**

- `PORT` (default: 4000) - HTTP server port
- `DB_PATH` (default: `./data.db`) - SQLite database file path
- `TILE_PROXY_HOSTS` (default: OSM CDN) - Comma-separated tile server URLs
- `NODE_ENV` (production/development) - Affects logging verbosity

## Key Technical Patterns

### Database Access Layer

**CRITICAL:** All database operations MUST use `getDb()` wrapper:

```javascript
import { getDb } from './db.js';

const db = getDb();  // Returns configured sqlite3.Database instance
db.all('SELECT * FROM reportes WHERE tipo = ?', [tipo], (err, rows) => { ... });
```

- Uses SQLite3 with prepared statements (prevents SQL injection)
- **8 core tables**: `reportes`, `usuarios`, `sesiones`, `asignaciones`, `cierres_pendientes`, `categorias`, `tipos_reporte`, `historial_cambios`
- Schema is in `server/schema.sql` - initialized via `npm run init`
- Geo indexes on `reportes(lat, lng, tipo)`, auth indexes on `sesiones(token)`, assignment indexes on `asignaciones(reporte_id, usuario_id)`, category indexes on `tipos_reporte(categoria_id)`
- Foreign keys enabled with `PRAGMA foreign_keys = ON`
- `DB_PATH` env var allows testing isolation (`e2e.db` for Playwright)
- **ESM modules only** - all files use `import/export`, not `require()`
- **Report fields**: `tipo` (slug), `descripcion` (detailed), `descripcion_corta` (display-friendly), `dependencia`, `estado`, `prioridad`
- **Dynamic types/categories (ADR-0009)**: Types and categories stored in DB, NOT hardcoded - use `/api/tipos` and `/api/categorias` endpoints
- **Audit trail (ADR-0010)**: ALL assignment/reassignment operations MUST log to `historial_cambios` with `tipo_cambio`, `valor_anterior`, `valor_nuevo`, `razon`
- **CRITICAL Schema Fields:** `tipos_reporte` table uses column `tipo` NOT `slug` - admin routes MUST use correct column names

### API Validation

**Project-specific validation functions** (reuse these, don't reimplement):

```javascript
// Coordinate validation: lat ∈ [-90, 90], lng ∈ [-180, 180]
function validarCoordenadas(lat, lng) {
  const a = Number(lat),
    o = Number(lng);
  if (Number.isNaN(a) || Number.isNaN(o)) return false;
  if (a < -90 || a > 90) return false;
  if (o < -180 || o > 180) return false;
  return true;
}

// Type normalization (handles arrays or comma-separated strings)
function normalizeTipos(raw) {
  if (!raw) return [];
  const values = Array.isArray(raw) ? raw : String(raw).split(',');
  const unique = new Set();
  values.forEach((v) => {
    const trimmed = String(v).trim();
    if (trimmed) unique.add(trimmed);
  });
  return Array.from(unique);
}

// Date validation (ISO format YYYY-MM-DD)
function isIsoDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
```

- **Peso (weight)** defaults to 1, must be positive integer
- Express middleware: `helmet()`, `cors()`, `compression()`, `morgan()`
- JSON body limit: 1MB
- **Authentication**: Token-based via `requiereAuth()` middleware (checks `Authorization: Bearer <token>` header)
- **Authorization**: Role-based with `requiereRol()` and `requiereDependencia()` middleware
- **Client identification**: Use `obtenerIpCliente(req)` helper (handles X-Forwarded-For, X-Real-IP, socket addresses)
- Auto-assignment to departments via `DEPENDENCIA_POR_TIPO` mapping (baches→obras_publicas, alumbrado→servicios_publicos)
- **JSON body limit**: 5MB (increased from 1MB to support signatures + photo evidence in closure requests)

### Frontend State Management

**Vanilla React patterns** - no Redux, no Context API, no external state libs:

```javascript
// Hash-based routing in App.jsx
React.useEffect(() => {
  const handleHashChange = () => {
    if (window.location.hash === '#reportar') {
      setCurrentView('form');
    } else if (window.location.hash === '#panel') {
      setCurrentView('panel');
    } else {
      setCurrentView('map');
    }
  };
  window.addEventListener('hashchange', handleHashChange);
  return () => window.removeEventListener('hashchange', handleHashChange);
}, []);

// Leaflet map in useRef to prevent re-renders
const mapRef = useRef(null);
useEffect(() => {
  if (!mapRef.current) {
    mapRef.current = L.map('map').setView([lat, lng], zoom);
  }
}, []);
```

- Leaflet map instance stored in `useRef` (NOT state)
- Heat layer fetched on demand via `/api/reportes` or `/api/reportes/grid`
- Vite proxy handles `/api/*` and `/tiles/*` in dev (`vite.config.js`)
- Hash-based routing: `#reportar` (form), `#panel` (funcionario dashboard), `#admin` (user admin), `#reporte/{id}` (detail view)
- **Session management**: Token stored in `localStorage`, user object persisted, validated on mount with `/api/auth/me`
- **Protected routes**: Login modal shown for `#panel` and `#admin` if not authenticated

### Testing Isolation Strategy

**Three-tier test separation:**

1. **Backend (Jest + Supertest):** `tests/backend/reportes.test.js`
   - Uses in-memory temp SQLite DBs per test suite
   - Tests `server/app.js` exported `createApp()` function
   - Example: `const response = await request(app).post('/api/reportes').send({...})`

2. **Frontend (Vitest + Testing Library):** `tests/frontend/`
   - jsdom environment with mocked fetch
   - Tests React components in isolation
   - Example: `render(<App />); expect(screen.getByText('citizen-reports')).toBeInTheDocument()`

3. **E2E (Playwright):** `tests/e2e/heatmap.spec.ts`
   - Uses dedicated `e2e.db` (set via `DB_PATH` env var)
   - `pretest:e2e` script rebuilds SPA and resets database
   - Visual regression with screenshot comparisons
   - Playwright config: `playwright.config.ts` starts `node server/server.js` automatically

**Critical E2E setup:** `npm run test:e2e` does:

1. `cd client && npm run build` (fresh SPA build)
2. `DB_PATH=./e2e.db node server/server.js --init` (reset DB)
3. Playwright launches server with `e2e.db`

## Project-Specific Conventions

### File Routing (STRICTLY Enforced)

**NEVER cross these boundaries:**

```
server/**         → Backend only (Express, DB, validation)
client/**         → Frontend only (React, Leaflet, UI)
tests/backend/**  → Jest + Supertest tests
tests/frontend/** → Vitest + Testing Library tests
tests/e2e/**      → Playwright tests
ai/**             → Agent prompts and governance
code_surgeon/**   → Safe edit toolkit (see below)
scripts/**        → Operational tooling (backups, monitoring)
docs/**           → Architecture, ADRs, API specs
```

**Violation example:** Importing `server/db.js` into `client/src/App.jsx` ❌

### API Endpoints Pattern

**RESTful structure:**

```
POST   /api/reportes              Create report (tipo, descripcion, lat, lng, peso)
GET    /api/reportes              List with filters (?tipo=bache&latMin=18.5...)
GET    /api/reportes/tipos        DEPRECATED: use /api/tipos (ADR-0009)
GET    /api/reportes/geojson      Export as GeoJSON FeatureCollection
GET    /api/reportes/grid         Grid aggregation (?cellSize=0.01)
GET    /tiles/{z}/{x}/{y}.png     OSM tile proxy (CSP compliance)

# Dynamic Types & Categories (ADR-0009)
GET    /api/tipos                 List active report types with metadata
GET    /api/categorias            List categories with nested types

# Authentication & Authorization
POST   /api/auth/login            Login (email/password) → {token, usuario}
POST   /api/auth/logout           Invalidate session token
GET    /api/auth/me               Verify token and get current user

# User Management (admin only)
GET    /api/usuarios              List all users
POST   /api/usuarios              Create user
GET    /api/usuarios/:id          Get user details
PUT    /api/usuarios/:id          Update user
DELETE /api/usuarios/:id          Delete user

# Report Assignments (many-to-many, ADR-0010)
GET    /api/reportes/:id/asignaciones          List assigned funcionarios
POST   /api/reportes/:id/asignaciones          Assign funcionario (logs to historial_cambios)
DELETE /api/reportes/:id/asignaciones/:usuarioId  Remove assignment (logs to historial_cambios)

# Closure Workflow
POST   /api/reportes/:id/solicitar-cierre     Funcionario requests closure (with signature)
POST   /api/cierres/:id/aprobar                Supervisor approves closure
POST   /api/cierres/:id/rechazar               Supervisor rejects closure
```

**Tile proxy rationale:** CSP blocks external tile sources. Proxy cycles through OSM CDN (`a/b/c.tile.openstreetmap.org`) with base64 fallback tile when upstream fails.

### Code Surgery Workflow (Automated Edits)

**PREFERRED method for code changes** (safer than direct file manipulation):

```powershell
# 1. Create job file in surgery/jobs/
# Use prompts/JOB_TEMPLATE.json as template

# 2. Run VSCode task: "surgery: splice by markers"
# Or use CLI:
python code_surgeon/bin/code-surgeon.py --file server/app.js --mode regex-block --start "// START: validation" --end "// END: validation" --new-fragment surgery/fragments/new-validation.js

# 3. Watch mode (auto-apply jobs):
python scripts/surgery_watch.py
```

**Why use surgery:**

- Atomic rollback with SHA-256 audit trail
- Auto-detects and runs relevant tests (Jest/Vitest/pytest)
- Rollback if tests fail (Fail-Fast)
- Fragment-only approach: AI generates ONLY the replacement code

**See:** `code_surgeon/README.md` and `code_surgeon/BEST_PRACTICES.md`

### Quality Gates

**Pre-commit (Husky + lint-staged):**

- ESLint (no warnings tolerated) + Prettier auto-format
- Runs on staged files only

**Pre-merge (CI/manual):**

```powershell
npm run test:all  # Must pass 100%
```

**E2E visual regression:**

- Playwright captures screenshots in `tests/e2e/*.spec.ts`
- Compares against baseline in `tests/e2e/screenshots/`

## Integration Points

### Leaflet Configuration

**Heat layer setup (`client/src/MapView.jsx` pattern):**

```javascript
import L from 'leaflet';
import 'leaflet.heat';

const heat = L.heatLayer(
  reportes.map(r => [r.lat, r.lng, r.peso]),
  { radius: 25, blur: 15, maxZoom: 17, gradient: {...} }
).addTo(map);
```

- Tile proxy: `/tiles/{z}/{x}/{y}.png` (same-origin, CSP compliant)
- Fallback tile: Base64 1x1 PNG when OSM CDN fails (check `X-Fallback-Tile: 1` header)
- Configurable gradient via heat layer options

### Export Capabilities

**PNG Export:**

```javascript
import { toPng } from 'html-to-image';
toPng(document.getElementById('map')).then(dataUrl => { ... });
```

**GeoJSON Export:**

```
GET /api/reportes/geojson?tipo=bache&fechaInicio=2025-01-01
```

Returns RFC 7946 FeatureCollection for use in QGIS, ArcGIS, etc.

### Authentication System

**Test users** (password: `admin123` for all):

| Email                                | Role        | Departamento   |
| ------------------------------------ | ----------- | -------------- |
| `admin@jantetelco.gob.mx`            | admin       | administracion |
| `supervisor.obras@jantetelco.gob.mx` | supervisor  | obras_publicas |
| `func.obras1@jantetelco.gob.mx`      | funcionario | obras_publicas |

**Auth flow:**

1. Client sends POST `/api/auth/login` with `{email, password}`
2. Server validates credentials (bcrypt), creates session with expiring token
3. Token stored in `localStorage`, included in `Authorization: Bearer <token>` header
4. Middleware `requiereAuth()` validates token on protected routes
5. Role/department checks with `requiereRol(['admin'])` or `requiereDependencia()`

**Session table:** `sesiones(usuario_id, token, expira_en, ip, user_agent)` with CASCADE delete on user removal.

## Operational Scripts (Production)

**Database backups:**

```powershell
npm run backup:db              # Creates backups/data-TIMESTAMP.db
DB_PATH=./server/data.db BACKUP_DIR=./custom-backups npm run backup:db
```

**Tile health monitoring:**

```powershell
npm run smoke:tiles            # Probes /tiles/{z}/{x}/{y}.png endpoints
npm run smoke:tiles -- "https://tile.example.com/{z}/{x}/{y}.png"  # Custom URL
```

**Combined maintenance:**

```powershell
npm run maintenance            # Backup + smoke test + metrics export
node scripts/maintenance.js --retain-backups 7 --metrics-url http://pushgateway:9091
```

**Scheduled automation (Windows Task Scheduler):**

```powershell
powershell.exe -ExecutionPolicy Bypass -File scripts/backup-db.ps1 -DbPath C:\path\to\data.db
```

## AI Agent Governance

### Mandatory Principles

**From `ai/COPILOT/code_agent_directives.md`:**

1. **Privacy/Security/Legal/Resilience by Design** - never store PII, validate all inputs
2. **Fail-safe without placeholders** - code must be immediately runnable (no `// TODO: implement`)
3. **Lint-error free** - zero ESLint warnings before committing
4. **File routing compliance** - respect `server/` vs `client/` boundaries
5. **TDD workflow** - write test → implement → refactor (see `docs/tdd_philosophy.md`)

### Development Workflow

**TDD cycle (from `docs/tdd_philosophy.md`):**

1. **Red:** Write failing test describing desired behavior
2. **Green:** Implement minimum code to pass test
3. **Refactor:** Clean up while keeping tests green
4. **Validate:** `npm run test:all` before committing

**Architecture changes require ADRs:**

- Document in `docs/adr/ADR-NNNN-title.md`
- Follow ADR-0001-bootstrap.md format

### Common Pitfalls to Avoid

❌ **DON'T:**

- Mix server and client imports (`import { getDb } from '../../server/db.js'` in client code)
- Skip `npm run init` before testing (causes "no such table: reportes" errors)
- Run E2E tests without fresh build (`npm run build` in client/)
- Fetch external resources directly (violates CSP - use `/tiles/` proxy)
- Use `require()` syntax (project uses ESM `import/export` only)
- Manually edit files when `code_surgeon` workflow is available
- Use `reporte.dependencia` when you need `req.usuario.dependencia` (common interdepartmental bug)
- Apply temporal filters to supervisor's department view (supervisors see ALL reports, not just current month)
- Use `localStorage.getItem('token')` - correct key is `auth_token`
- Use `slug` column for tipos_reporte - correct column is `tipo`

✅ **DO:**

- Use `getDb()` for all database operations
- Run `npm run test:all` before considering work complete
- Add tests for new endpoints (unit + e2e if UI-facing)
- Document non-obvious patterns in this file or `docs/architecture.md`
- Use `validarCoordenadas()`, `normalizeTipos()` for consistency
- Check `docs/BUGFIX_*.md` files for recent fixes and patterns to avoid
- Verify supervisor queries use `req.usuario.dependencia` not `reporte.dependencia`
- Always verify localStorage token key is `auth_token`
- Check `server/schema.sql` for correct column names before writing SQL

### Recent Critical Bugfixes (Learn From These!)

**October 8, 2025 - Admin Panel Type Editing Crash** (`docs/BUGFIX_EDICION_TIPOS_CRASH_2025-10-08.md`):
- ❌ **Problem:** Admin panel crashed when editing report types
- 🔑 **Root Causes:**
  1. Frontend used `localStorage.getItem('token')` instead of `localStorage.getItem('auth_token')` → all admin requests failed with 401
  2. Backend used `slug` column name but schema defines `tipo` → SQL errors
  3. Wrong property mapping in forms: `tipo?.slug` instead of `tipo.tipo`
- ✅ **Lessons:** Always use `auth_token` key, check schema column names, verify object property paths

**October 5, 2025 - Interdepartmental Closure Bug** (`RESUMEN_FINAL_FIX_CIERRE_2025-10-05.md`):
- ❌ **Problem:** "No se encontró supervisor" error when funcionario requested closure on interdepartmental assignments
- 🔑 **Root Cause:** Code used `obtenerSupervisor(reporte.dependencia)` but should use `obtenerSupervisor(req.usuario.dependencia)` - funcionario notifies THEIR supervisor, not report's original department
- ✅ **Lesson:** Use `req.usuario.dependencia` NOT `reporte.dependencia` for interdepartmental queries

**October 4, 2025 - Payload Size Limit** (`FIX_PAYLOAD_SIZE_CIERRE_2025-10-04.md`):
- ❌ **Problem:** Closure requests with signatures + 3 photos failed (total ~960KB exceeded 1MB limit)
- 🔑 **Solution:** Increased Express JSON body limit from 1MB to 5MB
- ✅ **Lesson:** Consider real-world data sizes (signatures, photos, base64 encoding overhead)

### Common Errors & Solutions

| Error Message                                     | Root Cause                                                       | Solution                                                                                      |
| ------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `SQLITE_ERROR: no such table: reportes`           | Database not initialized                                         | Run `cd server && npm run init`                                                               |
| `Error: Cannot find module './db.js'`             | Wrong import in client code                                      | Move DB logic to `server/`, use API calls from client                                         |
| `401 Unauthorized` on admin endpoints             | Using wrong token key in localStorage                            | Use `localStorage.getItem('auth_token')` NOT `localStorage.getItem('token')`                  |
| `table tipos_reporte has no column named slug`    | Using wrong column name in SQL                                   | Use `tipo` column (check `server/schema.sql` for correct names)                               |
| `No se encontró supervisor para esta dependencia` | Using `reporte.dependencia` instead of `req.usuario.dependencia` | Use `req.usuario.dependencia` (see `docs/BUGFIX_SUPERVISOR_VER_TODOS_REPORTES_2025-10-05.md`) |
| E2E tests fail with stale UI                      | Frontend not rebuilt                                             | Run `cd client && npm run build` before E2E tests                                             |
| `Port 4000 already in use`                        | Server still running                                             | Run `.\stop-servers.ps1` to kill processes                                                    |
| `TypeError: map.setView is not a function`        | Leaflet map stored in state                                      | Use `useRef` for map instance, not `useState`                                                 |
| ESLint warnings on commit                         | Pre-commit hook active                                           | Fix warnings or run `npm run lint:fix`                                                        |

## Performance & Scalability Guidelines

### Database Optimization (SQLite Limits & Best Practices)

**CRITICAL for municipal scale:** SQLite is excellent for 10K-100K reports/month, but needs care:

- ✅ **Use indexes:** All WHERE/JOIN columns have indexes (see `server/schema.sql`)
- ✅ **Use prepared statements:** Always parameterize queries (prevents SQL injection + faster)
- ✅ **Batch operations:** For multiple inserts, use transactions (`BEGIN TRANSACTION ... COMMIT`)
- ❌ **Avoid `SELECT *`:** Specify only needed columns (lat, lng, tipo, descripcion_corta for map)
- ❌ **Avoid N+1 queries:** Use JOINs or batch queries instead of loops
- ⚠️ **SQLite concurrent writes:** Only ONE write at a time - use queue for high traffic
- 📊 **Growth planning:** At 500K+ reports, consider PostgreSQL migration (schema compatible)

**Municipal scale estimates:**
- Small municipality (10K residents): ~500-2K reports/month
- Medium municipality (50K residents): ~2K-10K reports/month  
- Large municipality (200K+ residents): Consider PostgreSQL from start

### API Response Size & Pagination

- **Body limit:** 5MB JSON (supports signatures + 3 photos in closure requests)
- **Large datasets:** ALWAYS use pagination (`?limit=50&offset=0`)
- **Heatmap data:** Use `/api/reportes/grid?cellSize=0.01` for aggregated data (reduces 10K points to ~100 cells)
- **GeoJSON export:** Expect responses up to 5MB for full dataset, add date filters
- **Tile proxy:** Cached tiles reduce bandwidth, use debouncing (300ms) on map interactions

**Performance targets:**
- `/api/reportes` with filters: <500ms for 10K records
- `/api/reportes/grid`: <200ms for 50K records
- Map load with 1K points: <2s initial render

### Frontend Rendering Best Practices

- **Leaflet map:** Store in `useRef`, NOT state (prevents unnecessary re-renders on filter changes)
- **Heat layer:** Update only on filter changes, memoize calculations with `useMemo`
- **Large lists:** Use virtualization for 100+ items (react-window or react-virtualized)
- **API calls:** Debounce search inputs (300ms), use `AbortController` for cancellation
- **Marker clustering:** For 500+ visible points, use Leaflet.markercluster plugin

**Frontend performance targets:**
- Time to Interactive (TTI): <3s on 4G connection
- Map pan/zoom: 60fps (16ms per frame)
- Filter application: <100ms perceived latency

## Security & Transparency Checklist (Government Context)

**CRITICAL:** This is a civic-tech transparency tool for municipal governments. Security AND public trust are paramount.

### Pre-Commit Security Checklist

- [ ] All database queries use prepared statements (no string concatenation)
- [ ] All user inputs validated (coordinates with `validarCoordenadas()`, dates with `isIsoDate()`)
- [ ] Authentication required for non-public endpoints (`requiereAuth` middleware)
- [ ] Authorization checked for sensitive operations (`requiereRol`, `requiereDependencia`)
- [ ] Passwords hashed with bcrypt (never store plaintext)
- [ ] Session tokens expire (24h default in `sesiones.expira_en`)
- [ ] CORS configured correctly (`cors({ origin: true, credentials: true })`)
- [ ] CSP headers set via Helmet (no inline scripts allowed)
- [ ] No PII in logs (check Morgan output, never log `password`, `token`, `firma_digital`)
- [ ] File uploads sanitized (if adding file upload features)
- [ ] Rate limiting considered (for public endpoints)

### Public Transparency Requirements

**What citizens SHOULD see (read-only, no auth):**
- ✅ Heatmap of all reports (anonymized locations via grid aggregation)
- ✅ Report counts by type and priority
- ✅ Report status (nuevo, en_proceso, cerrado, rechazado)
- ✅ Public GeoJSON export for third-party analysis
- ✅ Tile proxy for map rendering (CSP compliant)

**What citizens MUST NOT see:**
- ❌ Funcionario personal info (names, emails, phone numbers)
- ❌ IP addresses or device fingerprints of reporters
- ❌ Internal notes in `asignaciones.notas` or `cierres_pendientes.notas`
- ❌ Digital signatures or photo evidence (only funcionarios/supervisors)
- ❌ Audit trail details (`historial_cambios` table)

**What funcionarios see (authenticated):**
- 🔐 Only reports assigned to them OR in their department
- 🔐 Contact info of other funcionarios in same department
- 🔐 Closure workflow with signature capture
- 🔐 Reassignment requests with justification

**What supervisors see (authenticated + role):**
- 🔐 ALL reports in their department (no date filters)
- 🔐 Assignment/reassignment operations
- 🔐 Closure approval/rejection workflow
- 🔐 Departmental performance metrics

**What admins see (authenticated + admin role):**
- 🔐 Everything across all departments
- 🔐 User management (CRUD)
- 🔐 Type/category management
- 🔐 Full audit trail access

## File Location Guide

**Where to create new files:**

| Task               | Location             | Naming Convention          | Example                                 |
| ------------------ | -------------------- | -------------------------- | --------------------------------------- |
| New backend route  | `server/`            | `{resource}-routes.js`     | `tipos-routes.js`                       |
| Backend middleware | `server/`            | `{purpose}_middleware.js`  | `auth_middleware.js`                    |
| Backend test       | `tests/backend/`     | `{resource}.test.js`       | `tipos.test.js`                         |
| Frontend component | `client/src/`        | `PascalCase.jsx`           | `TiposSelector.jsx`                     |
| Frontend test      | `tests/frontend/`    | `{Component}.test.jsx`     | `TiposSelector.test.jsx`                |
| E2E test           | `tests/e2e/`         | `{feature}.spec.ts`        | `tipos-management.spec.ts`              |
| ADR                | `docs/adr/`          | `ADR-NNNN-{title}.md`      | `ADR-0011-tipos-selector.md`            |
| Bugfix doc         | `docs/`              | `BUGFIX_{ISSUE}_{DATE}.md` | `BUGFIX_TIPOS_DUPLICADOS_2025-10-05.md` |
| Maintenance script | `scripts/`           | `{action}-{resource}.js`   | `backup-db.js`                          |
| Surgery fragment   | `surgery/fragments/` | `{feature}.js`             | `new-validation.js`                     |

## Quick References

### Architecture & Design

- **Architecture:** `docs/architecture.md` - System design, scaling notes, deployment patterns
- **ADRs:** `docs/adr/ADR-NNNN-*.md` - Architectural decision records (start with ADR-0001)
- **TDD philosophy:** `docs/tdd_philosophy.md` - Test-first workflow, red-green-refactor cycle

### API & Database

- **API docs:** `docs/api/openapi.yaml` - OpenAPI 3.0 spec with all endpoints
- **Auth system:** `docs/SISTEMA_AUTENTICACION.md` - Workflows, roles, test users
- **Schema:** `server/schema.sql` - Database structure, indexes, foreign keys

### Operations & Maintenance

- **Operations:** `README.md` § "Operations & maintenance" - Backups, monitoring, maintenance
- **Scripts reference:** `docs/SCRIPTS_SERVIDORES.md` - PowerShell automation guide
- **Security/privacy:** `docs/security_privacy.md` - CSP, PII handling, compliance
- **Disaster recovery:** `docs/disaster_recovery.md` - Backup/restore procedures
- **Code surgery:** `code_surgeon/README.md` - Safe automated editing toolkit

### Recent Changes & Domain-Specific

- **Assignments (ADR-0006):** `docs/adr/ADR-0006-sistema-asignacion-reportes.md` - Many-to-many design
- **Dynamic types (ADR-0009):** `docs/adr/ADR-0009-gestion-tipos-categorias-dinamicas.md` - DB-driven categories
- **Audit trail (ADR-0010):** `docs/adr/ADR-0010-unificacion-asignaciones-audit-trail.md` - historial_cambios logging
- **Bugfixes:** `docs/BUGFIX_*.md` - Recent fixes and anti-patterns to avoid

## Example: Adding a New Endpoint

**Scenario:** Add a statistics endpoint that returns report counts by type.

**Why this order?** Following TDD ensures the endpoint works before merging, prevents regressions, and serves as living documentation.

### Step 1: Write Test First (Red Phase)

**File:** `tests/backend/reportes-stats.test.js`

```javascript
import request from 'supertest';
import { createApp } from '../../server/app.js';
import { getDb } from '../../server/db.js';

describe('GET /api/reportes/stats', () => {
  let app;
  let db;

  beforeEach(() => {
    app = createApp();
    db = getDb();
    // Seed test data
    db.run(
      "INSERT INTO reportes (tipo, lat, lng, descripcion) VALUES ('bache', 18.7, -99.1, 'Test')",
    );
    db.run(
      "INSERT INTO reportes (tipo, lat, lng, descripcion) VALUES ('bache', 18.8, -99.2, 'Test 2')",
    );
    db.run(
      "INSERT INTO reportes (tipo, lat, lng, descripcion) VALUES ('alumbrado', 18.9, -99.3, 'Test 3')",
    );
  });

  it('returns report count by type', async () => {
    const response = await request(app).get('/api/reportes/stats');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ bache: 2, alumbrado: 1 });
  });

  it('requires authentication for protected stats', async () => {
    const response = await request(app).get('/api/reportes/stats/detailed');
    expect(response.status).toBe(401);
  });
});
```

**Run test (should FAIL):**

```powershell
npm run test:unit -- reportes-stats.test.js
# Expected: 404 Not Found (endpoint doesn't exist yet)
```

### Step 2: Implement Minimum Code (Green Phase)

**File:** `server/app.js`

```javascript
// Add after other /api/reportes routes
app.get('/api/reportes/stats', (req, res) => {
  const db = getDb();
  db.all(
    'SELECT tipo, COUNT(*) as count FROM reportes GROUP BY tipo ORDER BY count DESC',
    (err, rows) => {
      if (err) {
        console.error('Stats query error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      const stats = Object.fromEntries(rows.map((r) => [r.tipo, r.count]));
      res.json(stats);
    },
  );
});

// If authentication needed:
app.get(
  '/api/reportes/stats/detailed',
  requiereAuth,
  requiereRol(['admin']),
  (req, res) => {
    const db = getDb();
    db.all(
      `SELECT tipo, COUNT(*) as count, AVG(peso) as avg_peso,
            dependencia, COUNT(DISTINCT dependencia) as dept_count
     FROM reportes
     GROUP BY tipo
     ORDER BY count DESC`,
      (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
      },
    );
  },
);
```

**Run test (should PASS):**

```powershell
npm run test:unit -- reportes-stats.test.js
# Expected: All tests pass ✓
```

### Step 3: Refactor (Clean Up)

**Improvements:**

- Extract query to a helper function if complex
- Add input validation if query params needed
- Add JSDoc comments
- Consider caching if endpoint is called frequently

```javascript
/**
 * GET /api/reportes/stats
 * Returns report counts grouped by type
 * @returns {Object} { tipo: count, ... }
 */
app.get('/api/reportes/stats', (req, res) => {
  // Implementation stays same but now documented
});
```

### Step 4: Validate Everything

```powershell
# Run all tests
npm run test:all

# Check for lint errors
npm run lint

# Manual test
curl http://localhost:4000/api/reportes/stats
```

### Step 5: Document

1. **API Spec:** Add to `docs/api/openapi.yaml`:

```yaml
/api/reportes/stats:
  get:
    summary: Get report statistics by type
    responses:
      '200':
        description: Statistics object
        content:
          application/json:
            schema:
              type: object
              additionalProperties:
                type: integer
```

2. **Changelog:** Update `docs/changelog.md`:

```markdown
## [Unreleased]

### Added

- `/api/reportes/stats` endpoint for report type statistics
```

### When to Use `async/await` vs Callbacks

- **Use callbacks (current style):** For simple SQLite queries (consistent with codebase)
- **Use async/await:** For complex flows with multiple queries, external API calls
- **Convert example to async/await:**

```javascript
import { promisify } from 'util';

app.get('/api/reportes/stats', async (req, res) => {
  try {
    const db = getDb();
    const allAsync = promisify(db.all.bind(db));
    const rows = await allAsync(
      'SELECT tipo, COUNT(*) as count FROM reportes GROUP BY tipo',
    );
    const stats = Object.fromEntries(rows.map((r) => [r.tipo, r.count]));
    res.json(stats);
  } catch (err) {
    console.error('Stats query error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});
```

**Key Takeaway:** Always follow TDD (Test → Implement → Refactor → Validate → Document) to maintain code quality and prevent regressions.
