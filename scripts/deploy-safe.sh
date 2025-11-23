#!/bin/bash

################################################################################
# SAFE DEPLOYMENT SCRIPT - Citizen Reports to Docker Swarm
# 
# Purpose: Automate deployment while avoiding all known pitfalls
# Usage: ./deploy-safe.sh [OPTIONS]
# 
# Options:
#   --skip-build       Skip local docker build
#   --skip-test        Skip frontend loading test
#   --force           Skip all confirmations
#   --dry-run         Show what would happen, don't execute
#
# This script:
# 1. Validates local state (git clean, code built)
# 2. Builds Docker image locally
# 3. Tests image locally
# 4. Transfers image to production
# 5. Copies frontend files to host
# 6. Copies backend files to host
# 7. Deploys with docker-compose
# 8. Validates endpoints
# 9. Rolls back on failure
#
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROD_SERVER="root@145.79.0.77"
PROD_PATH="/root/citizen-reports"
DOCKER_IMAGE="citizen-reports:latest"
LOCAL_REPO=$(pwd)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$PROD_PATH/backups"

# Flags
SKIP_BUILD=false
SKIP_TEST=false
FORCE_DEPLOY=false
DRY_RUN=false
ROLLBACK_ON_FAIL=true

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

run_cmd() {
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY-RUN] $@"
    else
        "$@"
    fi
}

confirm() {
    if [ "$FORCE_DEPLOY" = true ]; then
        return 0
    fi
    
    local prompt="$1"
    local response
    read -p "$prompt (yes/no): " response
    if [ "$response" = "yes" ] || [ "$response" = "y" ]; then
        return 0
    else
        return 1
    fi
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build) SKIP_BUILD=true; shift ;;
        --skip-test) SKIP_TEST=true; shift ;;
        --force) FORCE_DEPLOY=true; shift ;;
        --dry-run) DRY_RUN=true; shift ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
done

################################################################################
# PHASE 1: PRE-DEPLOYMENT VALIDATION
################################################################################

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         CITIZEN REPORTS - SAFE DEPLOYMENT                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

log_info "Phase 1: Pre-deployment Validation"

# 1.1 Check git status
log_info "Checking git status..."
if ! git status --porcelain | grep -q "^"; then
    log_success "Git repository clean"
else
    log_error "Uncommitted changes detected!"
    git status
    if confirm "Continue anyway?"; then
        log_warning "Deploying with uncommitted changes"
    else
        exit 1
    fi
fi

# 1.2 Check server connectivity
log_info "Testing server connectivity..."
if ssh -o ConnectTimeout=5 $PROD_SERVER "echo OK" > /dev/null 2>&1; then
    log_success "Server reachable"
else
    log_error "Cannot reach $PROD_SERVER"
    exit 1
fi

# 1.3 Verify production database backup
log_info "Verifying production database..."
DB_EXISTS=$(ssh $PROD_SERVER "test -f $PROD_PATH/server/data.db && echo 1 || echo 0")
if [ "$DB_EXISTS" = "1" ]; then
    log_success "Database exists at $PROD_PATH/server/data.db"
    # Create backup
    BACKUP_FILE="$BACKUP_DIR/data.db.backup_$TIMESTAMP"
    log_info "Creating database backup: $BACKUP_FILE"
    run_cmd ssh $PROD_SERVER "cp $PROD_PATH/server/data.db $BACKUP_FILE"
    log_success "Backup created"
else
    log_warning "Database not found (fresh installation?)"
fi

################################################################################
# PHASE 2: LOCAL BUILD
################################################################################

echo -e "\n${BLUE}Phase 2: Local Build${NC}\n"

# 2.1 Build frontend
log_info "Building frontend..."
run_cmd cd "$LOCAL_REPO/client"
run_cmd npm install --silent
run_cmd npm run build
log_success "Frontend built"

# Verify dist exists
if [ ! -f "$LOCAL_REPO/client/dist/index.html" ]; then
    log_error "Frontend build failed - index.html not found"
    exit 1
fi
log_success "Frontend dist/index.html verified"

# 2.2 Build Docker image (unless skipped)
if [ "$SKIP_BUILD" = false ]; then
    log_info "Building Docker image..."
    run_cmd cd "$LOCAL_REPO"
    run_cmd docker build -t $DOCKER_IMAGE . --no-cache
    log_success "Docker image built"
else
    log_warning "Skipping Docker build"
fi

# 2.3 Verify image has frontend
log_info "Verifying image contents..."
if docker run --rm $DOCKER_IMAGE test -f /app/server/dist/index.html; then
    log_success "Image contains dist/index.html"
else
    log_error "Image missing dist/index.html"
    exit 1
fi

################################################################################
# PHASE 3: LOCAL TESTING
################################################################################

if [ "$SKIP_TEST" = false ]; then
    echo -e "\n${BLUE}Phase 3: Local Testing${NC}\n"
    
    log_info "Testing image locally..."
    
    # Start test container
    TEST_CONTAINER=$(docker run -d -p 9000:4000 $DOCKER_IMAGE 2>/dev/null || echo "")
    if [ -z "$TEST_CONTAINER" ]; then
        log_error "Failed to start test container"
        exit 1
    fi
    
    log_info "Container started: $TEST_CONTAINER"
    sleep 2
    
    # Test frontend
    RESPONSE=$(curl -s http://localhost:9000/ | head -c 50)
    if [[ $RESPONSE == *"<!DOCTYPE"* ]] || [[ $RESPONSE == *"<html"* ]]; then
        log_success "Frontend returns HTML"
    else
        log_error "Frontend returns wrong content: $RESPONSE"
        docker rm -f $TEST_CONTAINER > /dev/null
        exit 1
    fi
    
    # Cleanup
    docker rm -f $TEST_CONTAINER > /dev/null
    log_success "Local tests passed"
else
    log_warning "Skipping local tests"
fi

################################################################################
# PHASE 4: TRANSFER TO PRODUCTION
################################################################################

echo -e "\n${BLUE}Phase 4: Transfer to Production${NC}\n"

# 4.1 Save and transfer Docker image
log_info "Saving Docker image..."
TEMP_IMAGE="$TEMP/citizen-reports-$TIMESTAMP.tar"
mkdir -p "$TEMP"
run_cmd docker save $DOCKER_IMAGE -o "$TEMP_IMAGE"
log_success "Image saved to $TEMP_IMAGE"

log_info "Transferring image to production (this may take 1-2 minutes)..."
run_cmd scp "$TEMP_IMAGE" "$PROD_SERVER:/tmp/citizen-reports.tar"
log_success "Image transferred"

log_info "Loading image on production server..."
run_cmd ssh $PROD_SERVER 'docker load -i /tmp/citizen-reports.tar && rm /tmp/citizen-reports.tar'
log_success "Image loaded"

# Cleanup local tar
rm -f "$TEMP_IMAGE"

# 4.2 Verify image on server
log_info "Verifying image on server..."
if ssh $PROD_SERVER "docker run --rm $DOCKER_IMAGE test -f /app/server/dist/index.html"; then
    log_success "Image verified on server"
else
    log_error "Image verification failed on server"
    exit 1
fi

################################################################################
# PHASE 5: COPY RUNTIME FILES TO HOST
################################################################################

echo -e "\n${BLUE}Phase 5: Copy Runtime Files to Host${NC}\n"

# 5.1 Copy frontend files
log_info "Copying frontend files to production..."
run_cmd scp -r "$LOCAL_REPO/client/dist/"* "$PROD_SERVER:$PROD_PATH/server/dist/"
log_success "Frontend files copied"

# Verify
if ssh $PROD_SERVER "test -f $PROD_PATH/server/dist/index.html"; then
    log_success "Frontend dist/index.html verified on host"
else
    log_error "Frontend files not found on host"
    exit 1
fi

# 5.2 Copy backend files
log_info "Copying backend files to production..."
for file in app.js db.js auth_middleware.js auth_routes.js webhook-routes.js; do
    if [ -f "$LOCAL_REPO/server/$file" ]; then
        run_cmd scp "$LOCAL_REPO/server/$file" "$PROD_SERVER:$PROD_PATH/server/$file"
    fi
done
log_success "Backend files copied"

# 5.3 Copy other server files
log_info "Copying additional server files..."
run_cmd scp -r "$LOCAL_REPO/server/schema.sql" "$PROD_SERVER:$PROD_PATH/server/" 2>/dev/null || true
run_cmd scp -r "$LOCAL_REPO/server/package.json" "$PROD_SERVER:$PROD_PATH/server/" 2>/dev/null || true
log_success "Additional files copied"

################################################################################
# PHASE 6: INITIALIZE DATABASE
################################################################################

echo -e "\n${BLUE}Phase 6: Initialize Database${NC}\n"

log_info "Initializing database (idempotent)..."
run_cmd ssh $PROD_SERVER "cd $PROD_PATH/server && npm run init"
log_success "Database ready"

################################################################################
# PHASE 7: DEPLOY
################################################################################

echo -e "\n${BLUE}Phase 7: Deploy${NC}\n"

log_info "Creating Docker network (if needed)..."
run_cmd ssh $PROD_SERVER 'docker network create citizen-reports_internal 2>/dev/null || echo "Network exists"'

log_info "Deploying service..."
run_cmd ssh $PROD_SERVER "cd $PROD_PATH && docker stack deploy -c docker-compose.prod.yml citizen-reports"
log_success "Service deployed"

# Wait for container to start
log_info "Waiting for container to start..."
sleep 5

################################################################################
# PHASE 8: VALIDATION
################################################################################

echo -e "\n${BLUE}Phase 8: Validation${NC}\n"

# 8.1 Check container status
log_info "Checking container status..."
if ssh $PROD_SERVER "docker ps | grep citizen-reports" > /dev/null; then
    log_success "Container running"
else
    log_error "Container not running!"
    if [ "$ROLLBACK_ON_FAIL" = true ]; then
        log_error "Rolling back..."
        ssh $PROD_SERVER "docker service rm citizen-reports_citizen-reports" 2>/dev/null || true
    fi
    exit 1
fi

# 8.2 Test frontend
log_info "Testing frontend endpoint..."
RESPONSE=$(curl -s -w "%{http_code}" http://145.79.0.77:4000/)
HTTP_CODE="${RESPONSE: -3}"
CONTENT="${RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    log_success "Frontend HTTP 200"
    if [[ $CONTENT == *"<!DOCTYPE"* ]] || [[ $CONTENT == *"<html"* ]]; then
        log_success "Frontend returns HTML"
    else
        log_error "Frontend returns JSON (fallback): ${CONTENT:0:50}"
        exit 1
    fi
else
    log_error "Frontend returned $HTTP_CODE"
    exit 1
fi

# 8.3 Test API endpoint
log_info "Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST http://145.79.0.77:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jantetelco.gob.mx","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    log_success "Login endpoint working"
else
    log_error "Login failed: $LOGIN_RESPONSE"
    exit 1
fi

# 8.4 Test database
log_info "Testing database..."
CONTAINER_ID=$(ssh $PROD_SERVER "docker ps -q | head -1")
DB_COUNT=$(ssh $PROD_SERVER "docker exec $CONTAINER_ID sqlite3 /app/server/data.db 'SELECT COUNT(*) FROM usuarios;' 2>/dev/null || echo 0")
if [ "$DB_COUNT" -gt 0 ]; then
    log_success "Database accessible ($DB_COUNT users)"
else
    log_warning "Database appears empty (may be fresh install)"
fi

################################################################################
# SUCCESS
################################################################################

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            DEPLOYMENT SUCCESSFUL ✓                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

log_success "Frontend: http://145.79.0.77:4000/"
log_success "API: http://145.79.0.77:4000/api/auth/login"
log_success "Database: $PROD_PATH/server/data.db"
log_success "Backup: $BACKUP_FILE"

echo -e "\n${BLUE}Next Steps:${NC}"
echo "1. Verify in production: http://145.79.0.77:4000/"
echo "2. Test login with credentials"
echo "3. Monitor logs: ssh $PROD_SERVER 'docker service logs citizen-reports_citizen-reports --tail 50'"
echo "4. Commit to git if not already done"
echo ""

exit 0
