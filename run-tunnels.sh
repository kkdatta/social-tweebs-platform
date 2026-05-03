#!/bin/bash
# Resilient Cloudflare tunnel runner with auto-restart and auto-config

FRONTEND_PORT=5173
BACKEND_PORT=3100
FRONTEND_LOG=/private/tmp/tunnel-frontend.log
BACKEND_LOG=/private/tmp/tunnel-backend.log
CHECK_INTERVAL=15
FRONTEND_ENV="/Users/kalyankumardatta/Documents/Projects/empty/frontend/.env"

cleanup() {
  echo "[tunnels] Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID $MONITOR_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

start_backend_tunnel() {
  rm -f "$BACKEND_LOG"
  cloudflared tunnel --url "http://localhost:$BACKEND_PORT" > "$BACKEND_LOG" 2>&1 &
  BACKEND_PID=$!
  echo "[tunnels] Backend tunnel started (PID $BACKEND_PID)"
  sleep 6
  BACKEND_URL=$(grep -o 'https://[a-z-]*\.trycloudflare\.com' "$BACKEND_LOG" | head -1)
  if [ -n "$BACKEND_URL" ]; then
    echo "[tunnels] Backend URL: $BACKEND_URL"
    if [ -f "$FRONTEND_ENV" ]; then
      sed -i '' "s|^PROXY_TARGET=.*|PROXY_TARGET=$BACKEND_URL|" "$FRONTEND_ENV"
      echo "[tunnels] Updated PROXY_TARGET in frontend/.env"
    fi
  else
    echo "[tunnels] WARNING: Could not extract backend URL"
  fi
}

start_frontend_tunnel() {
  rm -f "$FRONTEND_LOG"
  cloudflared tunnel --url "http://localhost:$FRONTEND_PORT" > "$FRONTEND_LOG" 2>&1 &
  FRONTEND_PID=$!
  echo "[tunnels] Frontend tunnel started (PID $FRONTEND_PID)"
  sleep 6
  FRONTEND_URL=$(grep -o 'https://[a-z-]*\.trycloudflare\.com' "$FRONTEND_LOG" | head -1)
  if [ -n "$FRONTEND_URL" ]; then
    echo "[tunnels] Frontend URL: $FRONTEND_URL"
  else
    echo "[tunnels] WARNING: Could not extract frontend URL"
  fi
}

check_tunnel() {
  local url=$1
  local name=$2
  if [ -z "$url" ]; then return 1; fi
  local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url/" 2>/dev/null)
  if [ "$status" = "000" ] || [ "$status" = "530" ] || [ "$status" = "502" ] || [ "$status" = "503" ]; then
    echo "[tunnels] $name tunnel DOWN (HTTP $status)"
    return 1
  fi
  return 0
}

monitor() {
  while true; do
    sleep $CHECK_INTERVAL

    BACKEND_URL=$(grep -o 'https://[a-z-]*\.trycloudflare\.com' "$BACKEND_LOG" 2>/dev/null | head -1)
    FRONTEND_URL=$(grep -o 'https://[a-z-]*\.trycloudflare\.com' "$FRONTEND_LOG" 2>/dev/null | head -1)

    if ! kill -0 $BACKEND_PID 2>/dev/null || ! check_tunnel "$BACKEND_URL" "Backend"; then
      echo "[tunnels] Restarting backend tunnel..."
      kill $BACKEND_PID 2>/dev/null
      sleep 1
      start_backend_tunnel
      # Restart Vite to pick up new PROXY_TARGET
      VITE_PID=$(lsof -ti:$FRONTEND_PORT 2>/dev/null)
      if [ -n "$VITE_PID" ]; then
        kill $VITE_PID 2>/dev/null
        sleep 1
        cd /Users/kalyankumardatta/Documents/Projects/empty/frontend
        nohup npx vite --host 0.0.0.0 --port $FRONTEND_PORT > /dev/null 2>&1 &
        echo "[tunnels] Vite restarted"
        sleep 3
      fi
    fi

    if ! kill -0 $FRONTEND_PID 2>/dev/null || ! check_tunnel "$FRONTEND_URL" "Frontend"; then
      echo "[tunnels] Restarting frontend tunnel..."
      kill $FRONTEND_PID 2>/dev/null
      sleep 1
      start_frontend_tunnel
    fi
  done
}

echo "[tunnels] Starting resilient Cloudflare tunnels..."
echo "[tunnels] Backend → localhost:$BACKEND_PORT | Frontend → localhost:$FRONTEND_PORT"
echo ""

start_backend_tunnel
start_frontend_tunnel

BACKEND_URL=$(grep -o 'https://[a-z-]*\.trycloudflare\.com' "$BACKEND_LOG" 2>/dev/null | head -1)
FRONTEND_URL=$(grep -o 'https://[a-z-]*\.trycloudflare\.com' "$FRONTEND_LOG" 2>/dev/null | head -1)

echo ""
echo "============================================"
echo "  Frontend UI: $FRONTEND_URL"
echo "  Backend API: $BACKEND_URL"
echo "  Monitor interval: ${CHECK_INTERVAL}s"
echo "============================================"
echo ""
echo "[tunnels] Monitoring tunnels (Ctrl+C to stop)..."

monitor &
MONITOR_PID=$!
wait
