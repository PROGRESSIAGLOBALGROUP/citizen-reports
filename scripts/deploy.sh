#!/bin/bash
# Deploy script for citizen-reports
# Called by GitHub webhook via Node.js handler

PROJECT_PATH="/home/jantetelco/jantetelco"
LOG_FILE="$PROJECT_PATH/logs/deploy.log"
COMMIT_HASH=$(git -C "$PROJECT_PATH" rev-parse --short HEAD)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] ========================================" >> "$LOG_FILE"
echo "[$TIMESTAMP] DEPLOYMENT START" >> "$LOG_FILE"
echo "[$TIMESTAMP] Commit: $COMMIT_HASH" >> "$LOG_FILE"

cd "$PROJECT_PATH" || exit 1

# Step 1: Fetch latest
echo "[$TIMESTAMP] Step 1: Fetching from GitHub..." >> "$LOG_FILE"
git fetch origin main >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
  echo "[$TIMESTAMP] ❌ Git fetch failed" >> "$LOG_FILE"
  exit 1
fi

# Step 2: Reset to latest
echo "[$TIMESTAMP] Step 2: Resetting to origin/main..." >> "$LOG_FILE"
git reset --hard origin/main >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
  echo "[$TIMESTAMP] ❌ Git reset failed" >> "$LOG_FILE"
  exit 1
fi

# Step 3: Install dependencies
echo "[$TIMESTAMP] Step 3: Installing dependencies..." >> "$LOG_FILE"
npm install --production >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
  echo "[$TIMESTAMP] ❌ npm install failed" >> "$LOG_FILE"
  exit 1
fi

# Step 4: Build frontend
echo "[$TIMESTAMP] Step 4: Building frontend..." >> "$LOG_FILE"
cd client && npm run build >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
  echo "[$TIMESTAMP] ❌ Frontend build failed" >> "$LOG_FILE"
  cd "$PROJECT_PATH"
  exit 1
fi
cd "$PROJECT_PATH"

# Step 5: Kill old process
echo "[$TIMESTAMP] Step 5: Stopping old server..." >> "$LOG_FILE"
PID=$(lsof -i :4000 -t)
if [ -n "$PID" ]; then
  kill -9 "$PID" >> "$LOG_FILE" 2>&1
  sleep 2
fi

# Step 6: Start new server (detached)
echo "[$TIMESTAMP] Step 6: Starting new server..." >> "$LOG_FILE"
nohup node server/server.js > "$PROJECT_PATH/logs/server.log" 2>&1 &
sleep 3

# Verify server started
if lsof -i :4000 > /dev/null; then
  echo "[$TIMESTAMP] ✅ DEPLOYMENT SUCCESSFUL" >> "$LOG_FILE"
  echo "[$TIMESTAMP] Server restarted successfully" >> "$LOG_FILE"
  exit 0
else
  echo "[$TIMESTAMP] ❌ Server failed to start" >> "$LOG_FILE"
  exit 1
fi
