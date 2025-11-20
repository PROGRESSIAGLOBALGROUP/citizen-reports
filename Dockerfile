# Multi-stage Dockerfile para Citizen Reports Platform
# Optimizado para producción con mejores prácticas clase mundial
# Soporta: SQLite, health checks, zero-downtime, resource limits

# ============================================================================
# STAGE 1: Build Frontend (Client SPA)
# ============================================================================
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copiar solo package files primero (layer caching)
COPY client/package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copiar código fuente
COPY client/ ./

# Build optimizado para producción
RUN npm run build

# ============================================================================
# STAGE 2: Prepare Backend Dependencies
# ============================================================================
FROM node:20-alpine AS server-builder

WORKDIR /app

# Instalar herramientas de sistema necesarias
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

# Copiar package files del root
COPY package*.json ./

# Disable husky para builds Docker
RUN npm set-script prepare "" || true

# Instalar dependencias (incluye build de sqlite3 nativo)
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# ============================================================================
# STAGE 3: Production Runtime
# ============================================================================
FROM node:20-alpine AS production

LABEL maintainer="PROGRESSIA Global Group"
LABEL app="citizen-reports"
LABEL version="1.0.0"

# Variables de entorno por defecto
ENV NODE_ENV=production \
    PORT=4000 \
    DB_PATH=/app/server/data.db \
    NODE_OPTIONS="--max-old-space-size=256"

WORKDIR /app

# Instalar solo herramientas runtime (curl para healthcheck, dumb-init para señales)
RUN apk add --no-cache \
    curl \
    dumb-init \
    sqlite && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar dependencias desde builder
COPY --from=server-builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=server-builder --chown=nodejs:nodejs /app/package*.json ./

# Copiar código backend
COPY --chown=nodejs:nodejs server/ ./server/

# Copiar frontend compilado desde builder
COPY --from=client-builder --chown=nodejs:nodejs /app/client/dist ./server/dist

# Crear directorios para datos persistentes
RUN mkdir -p /app/server/backups && \
    chown -R nodejs:nodejs /app/server

# Health check integrado
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD curl -f -s http://localhost:${PORT}/api/reportes?limit=1 > /dev/null || exit 1

# Exponer puerto
EXPOSE ${PORT}

# Cambiar a usuario no-root (seguridad)
USER nodejs

# Usar dumb-init para manejo correcto de señales (graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]

# Comando por defecto
CMD ["node", "server/server.js"]

# ============================================================================
# STAGE 4: Development (opcional, para desarrollo local con hot-reload)
# ============================================================================
FROM node:20-alpine AS development

WORKDIR /app

# Instalar dependencias de desarrollo
RUN apk add --no-cache curl dumb-init

# Copiar package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Instalar TODAS las dependencias (incluyendo devDependencies)
RUN npm install --legacy-peer-deps

# Copiar código fuente completo
COPY . .

# Exponer puertos (backend + vite dev server)
EXPOSE 4000 5173

# Comando de desarrollo con hot-reload
CMD ["npm", "run", "dev"]
