FROM node:20-alpine

WORKDIR /app

# Instalar curl para healthchecks
RUN apk add --no-cache curl

# Copiar package.json
COPY package*.json ./

# Disable husky prepare hook for Docker builds
RUN npm set-script prepare "" || true

# Instalar dependencias del root (con build de sqlite3)
RUN npm install --legacy-peer-deps

# Copiar código server
COPY server ./server

# Copiar client prebuild
COPY client/dist ./client/dist
COPY client/package*.json ./client/

# Si no existe data.db en el volumen, crear uno nuevo
RUN [ ! -f server/data.db ] && echo "DB will be initialized on first run" || echo "DB already exists"

# Exponer puerto
EXPOSE 4000

# Health check integrado en Dockerfile (respaldo)
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD curl -f -s http://localhost:4000/api/reportes?limit=1 || exit 1

# Comando por defecto con gestión de memoria
CMD ["node", "--max-old-space-size=256", "server/server.js"]
