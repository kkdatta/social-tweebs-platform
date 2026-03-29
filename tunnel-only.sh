#!/bin/bash

# Start Cloudflare Tunnels only (assumes servers are already running)

echo "🌐 Starting Cloudflare Tunnels..."
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed!"
    echo ""
    echo "📥 To install cloudflared:"
    echo ""
    echo "macOS:"
    echo "  brew install cloudflared"
    echo ""
    echo "Linux:"
    echo "  wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
    echo "  sudo dpkg -i cloudflared-linux-amd64.deb"
    echo ""
    echo "Windows:"
    echo "  Download from: https://github.com/cloudflare/cloudflared/releases/latest"
    echo ""
    exit 1
fi

# Check if services are running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Warning: Backend (port 3000) doesn't appear to be running"
    echo "   Start it with: npm run start:dev"
    echo ""
fi

if ! lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Warning: Frontend (port 5173) doesn't appear to be running"
    echo "   Start it with: cd frontend && npm run dev"
    echo ""
fi

echo "📍 Creating public tunnels for:"
echo "   Backend API: http://localhost:3000"
echo "   Frontend:    http://localhost:5173"
echo ""

# Start tunnels and capture output
TUNNEL_LOG="/tmp/tunnel-urls-only.log"
rm -f $TUNNEL_LOG

echo "⏳ Establishing tunnels (this may take 5-10 seconds)..."
echo ""

# Start backend tunnel
cloudflared tunnel --url http://localhost:3000 > /tmp/tunnel-backend-only.log 2>&1 &
TUNNEL_BACKEND_PID=$!

# Start frontend tunnel  
cloudflared tunnel --url http://localhost:5173 > /tmp/tunnel-frontend-only.log 2>&1 &
TUNNEL_FRONTEND_PID=$!

# Wait for tunnel URLs to be generated
sleep 8

# Extract tunnel URLs
BACKEND_TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel-backend-only.log | head -1)
FRONTEND_TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel-frontend-only.log | head -1)

if [ -z "$BACKEND_TUNNEL_URL" ] || [ -z "$FRONTEND_TUNNEL_URL" ]; then
    echo "⏳ Waiting a bit more for tunnels..."
    sleep 5
    BACKEND_TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel-backend-only.log | head -1)
    FRONTEND_TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel-frontend-only.log | head -1)
fi

echo "═══════════════════════════════════════════════════════════════"
echo "✅ Cloudflare Tunnels Active!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🌐 PUBLIC URLS:"
echo "   Backend:  $BACKEND_TUNNEL_URL"
echo "   Frontend: $FRONTEND_TUNNEL_URL"
echo ""
echo "⚠️  IMPORTANT: To make your frontend use the backend tunnel:"
echo ""
echo "   1. Update frontend/.env:"
echo "      VITE_API_URL=$BACKEND_TUNNEL_URL"
echo ""
echo "   2. Restart the frontend:"
echo "      cd frontend && npm run dev"
echo ""
echo "💡 TIP: Use './start-dev-with-tunnel.sh' to automate this!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📝 Tunnel URLs saved to: $TUNNEL_LOG"
echo "$BACKEND_TUNNEL_URL" > $TUNNEL_LOG
echo "$FRONTEND_TUNNEL_URL" >> $TUNNEL_LOG
echo ""
echo "Press Ctrl+C to stop tunnels"
echo ""

# Tail logs to show tunnel activity
tail -f /tmp/tunnel-backend-only.log /tmp/tunnel-frontend-only.log
