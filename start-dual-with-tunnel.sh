#!/bin/bash

# SocialTweebs Dual Mode (Dev + Prod) with Cloudflare Tunnels
# Starts both development and production stacks with 4 public tunnel URLs

set -e

echo "🚀 Starting SocialTweebs DUAL MODE with Cloudflare Tunnels..."
echo "   Dev:  backend :3000 + frontend :5173"
echo "   Prod: backend :3100 + frontend :5174"
echo ""

if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed!"
    echo "   macOS:  brew install cloudflared"
    echo "   Linux:  wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared-linux-amd64.deb"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Save original frontend .env files for cleanup
cp frontend/.env frontend/.env.backup 2>/dev/null || true
cp frontend/.env.production frontend/.env.production.backup 2>/dev/null || true

cleanup() {
    echo ""
    echo "🧹 Cleaning up and restoring localhost configuration..."

    if [ -f "frontend/.env.backup" ]; then
        cp frontend/.env.backup frontend/.env
        rm -f frontend/.env.backup
    fi
    if [ -f "frontend/.env.production.backup" ]; then
        cp frontend/.env.production.backup frontend/.env.production
        rm -f frontend/.env.production.backup
    fi

    echo "✅ Configuration restored to localhost"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# ============ STEP 1: Start both backends ============
echo "📍 Step 1: Starting backends..."

npm run start:dev > /tmp/dev-backend.log 2>&1 &
DEV_BE_PID=$!

npm run start:prod-mode > /tmp/prod-backend.log 2>&1 &
PROD_BE_PID=$!

echo "⏳ Waiting for dev backend (port 3000)..."
for i in {1..45}; do
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ Dev backend ready on http://localhost:3000"
        break
    fi
    if [ $i -eq 45 ]; then
        echo "❌ Dev backend failed. Check /tmp/dev-backend.log"
        kill $DEV_BE_PID $PROD_BE_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo "⏳ Waiting for prod backend (port 3100)..."
for i in {1..45}; do
    if lsof -Pi :3100 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ Prod backend ready on http://localhost:3100"
        break
    fi
    if [ $i -eq 45 ]; then
        echo "❌ Prod backend failed. Check /tmp/prod-backend.log"
        kill $DEV_BE_PID $PROD_BE_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# ============ STEP 2: Start 4 Cloudflare tunnels ============
echo ""
echo "📍 Step 2: Starting Cloudflare Tunnels (4 tunnels)..."

rm -f /tmp/tunnel-dev-be.log /tmp/tunnel-dev-fe.log /tmp/tunnel-prod-be.log /tmp/tunnel-prod-fe.log

cloudflared tunnel --url http://localhost:3000 > /tmp/tunnel-dev-be.log 2>&1 &
T_DEV_BE_PID=$!

cloudflared tunnel --url http://localhost:5173 > /tmp/tunnel-dev-fe.log 2>&1 &
T_DEV_FE_PID=$!

cloudflared tunnel --url http://localhost:3100 > /tmp/tunnel-prod-be.log 2>&1 &
T_PROD_BE_PID=$!

cloudflared tunnel --url http://localhost:5174 > /tmp/tunnel-prod-fe.log 2>&1 &
T_PROD_FE_PID=$!

echo "⏳ Waiting for tunnel URLs (10-15 seconds)..."
sleep 12

extract_tunnel_url() {
    local logfile=$1
    local url=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$logfile" 2>/dev/null | head -1)
    if [ -z "$url" ]; then
        sleep 5
        url=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$logfile" 2>/dev/null | head -1)
    fi
    echo "$url"
}

DEV_BE_TUNNEL=$(extract_tunnel_url /tmp/tunnel-dev-be.log)
DEV_FE_TUNNEL=$(extract_tunnel_url /tmp/tunnel-dev-fe.log)
PROD_BE_TUNNEL=$(extract_tunnel_url /tmp/tunnel-prod-be.log)
PROD_FE_TUNNEL=$(extract_tunnel_url /tmp/tunnel-prod-fe.log)

if [ -z "$DEV_BE_TUNNEL" ] || [ -z "$DEV_FE_TUNNEL" ] || [ -z "$PROD_BE_TUNNEL" ] || [ -z "$PROD_FE_TUNNEL" ]; then
    echo "❌ Some tunnels failed to establish."
    [ -z "$DEV_BE_TUNNEL" ] && echo "   MISSING: Dev backend tunnel (check /tmp/tunnel-dev-be.log)"
    [ -z "$DEV_FE_TUNNEL" ] && echo "   MISSING: Dev frontend tunnel (check /tmp/tunnel-dev-fe.log)"
    [ -z "$PROD_BE_TUNNEL" ] && echo "   MISSING: Prod backend tunnel (check /tmp/tunnel-prod-be.log)"
    [ -z "$PROD_FE_TUNNEL" ] && echo "   MISSING: Prod frontend tunnel (check /tmp/tunnel-prod-fe.log)"
    kill $DEV_BE_PID $PROD_BE_PID $T_DEV_BE_PID $T_DEV_FE_PID $T_PROD_BE_PID $T_PROD_FE_PID 2>/dev/null || true
    exit 1
fi

echo "✅ All 4 tunnels established!"

# ============ STEP 3: Configure frontends to use tunnel backend URLs ============
echo ""
echo "📍 Step 3: Configuring frontends to use tunnel backend URLs..."

# Dev frontend -> dev backend tunnel
sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=$DEV_BE_TUNNEL|g" frontend/.env
rm -f frontend/.env.bak
echo "   Dev frontend  -> $DEV_BE_TUNNEL"

# Prod frontend -> prod backend tunnel
sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=$PROD_BE_TUNNEL|g" frontend/.env.production
rm -f frontend/.env.production.bak
echo "   Prod frontend -> $PROD_BE_TUNNEL"

# ============ STEP 4: Start both frontends ============
echo ""
echo "📍 Step 4: Starting frontends..."

cd frontend
npm run dev &
DEV_FE_PID=$!
cd ..

cd frontend
npx vite --mode production --port 5174 &
PROD_FE_PID=$!
cd ..

echo "⏳ Waiting for dev frontend (port 5173)..."
for i in {1..30}; do
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ Dev frontend ready on http://localhost:5173"
        break
    fi
    [ $i -eq 30 ] && echo "⚠️  Dev frontend may still be starting..."
    sleep 1
done

echo "⏳ Waiting for prod frontend (port 5174)..."
for i in {1..30}; do
    if lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ Prod frontend ready on http://localhost:5174"
        break
    fi
    [ $i -eq 30 ] && echo "⚠️  Prod frontend may still be starting..."
    sleep 1
done

# ============ DONE ============
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🎉 All services are running in DUAL MODE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📍 LOCAL ACCESS:"
echo "   ┌─────────────────────────────────────────────────────┐"
echo "   │ DEVELOPMENT (Modash disabled, local data)           │"
echo "   │   Frontend:  http://localhost:5173                  │"
echo "   │   Backend:   http://localhost:3000                  │"
echo "   │   API Docs:  http://localhost:3000/docs             │"
echo "   ├─────────────────────────────────────────────────────┤"
echo "   │ PRODUCTION (Modash live API)                        │"
echo "   │   Frontend:  http://localhost:5174                  │"
echo "   │   Backend:   http://localhost:3100                  │"
echo "   │   API Docs:  http://localhost:3100/docs             │"
echo "   └─────────────────────────────────────────────────────┘"
echo ""
echo "🌐 PUBLIC ACCESS (share these URLs):"
echo "   ┌─────────────────────────────────────────────────────┐"
echo "   │ DEVELOPMENT                                         │"
echo "   │   Frontend:  $DEV_FE_TUNNEL"
echo "   │   Backend:   $DEV_BE_TUNNEL"
echo "   ├─────────────────────────────────────────────────────┤"
echo "   │ PRODUCTION                                          │"
echo "   │   Frontend:  $PROD_FE_TUNNEL"
echo "   │   Backend:   $PROD_BE_TUNNEL"
echo "   └─────────────────────────────────────────────────────┘"
echo ""
echo "💡 NOTES:"
echo "   • Dev uses local/dummy data, Prod hits live Modash API"
echo "   • Same DB, same JWT - login works on both"
echo "   • URLs change on restart (Cloudflare quick tunnels)"
echo "   • On Ctrl+C, frontend .env files are restored to localhost"
echo ""
echo "═══════════════════════════════════════════════════════════════"

TUNNEL_LOG="/tmp/tunnel-urls-dual.log"
cat > $TUNNEL_LOG <<EOF
DEV_BACKEND=$DEV_BE_TUNNEL
DEV_FRONTEND=$DEV_FE_TUNNEL
PROD_BACKEND=$PROD_BE_TUNNEL
PROD_FRONTEND=$PROD_FE_TUNNEL
EOF
echo "📝 Tunnel URLs saved to: $TUNNEL_LOG"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

wait
