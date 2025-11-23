#!/bin/bash
#
# Deploy Script para Citizen Reports Platform
# Uso: ./deploy-prod.sh [TAG] [REGISTRY_USER] [REGISTRY_PASS]
# Ejemplo: ./deploy-prod.sh "2025-11-22" "username" "password"
#

set -e

# Configuración
TAG="${1:-latest}"
REGISTRY_USER="${2:-progressiaglobalgroup}"
REGISTRY_PASS="${3}"
REGISTRY="docker.io"
IMAGE_NAME="citizen-reports"
FULL_IMAGE="${REGISTRY}/${REGISTRY_USER}/${IMAGE_NAME}:${TAG}"
LATEST_IMAGE="${REGISTRY}/${REGISTRY_USER}/${IMAGE_NAME}:latest"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Citizen Reports - Deploy Script${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""
echo "Configuración:"
echo "  Registry: $REGISTRY"
echo "  Usuario: $REGISTRY_USER"
echo "  Imagen base: $IMAGE_NAME"
echo "  Tag: $TAG"
echo "  Full image: $FULL_IMAGE"
echo ""

# 1. Verificar que Docker está disponible
echo -e "${YELLOW}[1/5] Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker disponible${NC}"

# 2. Build de la imagen (production target)
echo -e "${YELLOW}[2/5] Construyendo imagen Docker (production target)...${NC}"
docker build \
    -t "${IMAGE_NAME}:${TAG}" \
    -t "${IMAGE_NAME}:latest" \
    --target production \
    -f Dockerfile \
    . || {
    echo -e "${RED}❌ Build falló${NC}"
    exit 1
}
echo -e "${GREEN}✅ Build completado${NC}"

# 3. Verificar imagen
echo -e "${YELLOW}[3/5] Verificando imagen...${NC}"
docker image inspect "${IMAGE_NAME}:${TAG}" > /dev/null || {
    echo -e "${RED}❌ Imagen no encontrada${NC}"
    exit 1
}
SIZE=$(docker image inspect "${IMAGE_NAME}:${TAG}" --format='{{.Size}}')
SIZE_MB=$(echo "scale=2; $SIZE / 1024 / 1024" | bc)
echo -e "${GREEN}✅ Imagen verificada (tamaño: ${SIZE_MB}MB)${NC}"

# 4. Login a Registry (si se proporcionan credenciales)
if [ -n "$REGISTRY_PASS" ]; then
    echo -e "${YELLOW}[4/5] Autenticando en Docker Registry...${NC}"
    echo "$REGISTRY_PASS" | docker login -u "$REGISTRY_USER" --password-stdin "$REGISTRY" > /dev/null 2>&1 || {
        echo -e "${RED}❌ Autenticación fallida${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Autenticación exitosa${NC}"
    
    # 5. Push a registry
    echo -e "${YELLOW}[5/5] Subiendo imagen a Docker Registry...${NC}"
    
    # Tag con full image name
    docker tag "${IMAGE_NAME}:${TAG}" "${FULL_IMAGE}"
    docker tag "${IMAGE_NAME}:latest" "${LATEST_IMAGE}"
    
    # Push ambos tags
    docker push "${FULL_IMAGE}" || {
        echo -e "${RED}❌ Push de versión falló${NC}"
        exit 1
    }
    docker push "${LATEST_IMAGE}" || {
        echo -e "${RED}❌ Push de latest falló${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Imagen subida exitosamente${NC}"
    
    # Logout
    docker logout "$REGISTRY" > /dev/null 2>&1
else
    echo -e "${YELLOW}[4/5] Saltando autenticación (credenciales no proporcionadas)${NC}"
    echo -e "${YELLOW}[5/5] Saltando push a registry${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ DEPLOY COMPLETADO${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Próximos pasos en el servidor:"
echo "  1. Conectar al servidor: ssh root@145.79.0.77"
echo "  2. Descargar imagen: docker pull ${FULL_IMAGE}"
echo "  3. Detener contenedor viejo: docker-compose down"
echo "  4. Actualizar docker-compose.yml con nueva versión"
echo "  5. Iniciar: docker-compose up -d"
echo ""
echo "Información de la imagen:"
echo "  Nombre: ${IMAGE_NAME}:${TAG}"
echo "  Tamaño: ${SIZE_MB}MB"
echo "  Stages: client-builder → server-builder → production"
echo "  Incluye: Backend (Express/SQLite) + Frontend (Vite SPA compilado)"
echo ""
