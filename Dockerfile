FROM node:20

WORKDIR /app

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

# Comando por defecto
CMD ["node", "server/server.js"]
