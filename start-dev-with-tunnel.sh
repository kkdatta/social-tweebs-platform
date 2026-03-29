#!/bin/bash

# SocialTweebs Development Server with Cloudflare Tunnel Startup Script
# This script starts both servers and creates public URLs via Cloudflare Tunnel

set -e  # Exit on error

echo "🚀 Starting SocialTweebs Development Servers with Cloudflare Tunnel..."
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

# Check if node_modules exists in root
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Check if node_modules exists in frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Cleanup function to restore localhost on exit
cleanup() {
    echo ""
    echo "🧹 Cleaning up and restoring localhost configuration..."
    
    # Restore localhost in frontend .env
    if [ -f "frontend/.env" ]; then
        sed -i.bak 's|VITE_API_URL=https://.*trycloudflare.com|VITE_API_URL=http://localhost:3000|g' frontend/.env
        rm -f frontend/.env.bak
    fi
    
    echo "✅ Configuration restored to localhost"
    exit 0
}

# Register cleanup on exit
trap cleanup SIGINT SIGTERM EXIT

echo ""
echo "📍 Step 1: Starting Backend..."
echo ""

# Start backend in background
npm run start:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ Backend is ready on http://localhost:3000"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start. Check /tmp/backend.log for errors."
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo ""
echo "📍 Step 2: Starting Cloudflare Tunnels..."
echo ""

# Start tunnels and capture output
TUNNEL_LOG="/tmp/tunnel-urls.log"
rm -f $TUNNEL_LOG

# Start backend tunnel
cloudflared tunnel --url http://localhost:3000 > /tmp/tunnel-backend.log 2>&1 &
TUNNEL_BACKEND_PID=$!

# Start frontend tunnel  
cloudflared tunnel --url http://localhost:5173 > /tmp/tunnel-frontend.log 2>&1 &
TUNNEL_FRONTEND_PID=$!

# Wait for tunnel URLs to be generated
echo "⏳ Waiting for tunnel URLs (this may take 5-10 seconds)..."
sleep 8

# Extract backend tunnel URL
BACKEND_TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel-backend.log | head -1)
FRONTEND_TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel-frontend.log | head -1)

if [ -z "$BACKEND_TUNNEL_URL" ] || [ -z "$FRONTEND_TUNNEL_URL" ]; then
    echo "❌ Failed to get tunnel URLs. Retrying..."
    sleep 5
    BACKEND_TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel-backend.log | head -1)
    FRONTEND_TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel-frontend.log | head -1)
fi

if [ -z "$BACKEND_TUNNEL_URL" ] || [ -z "$FRONTEND_TUNNEL_URL" ]; then
    echo "❌ Failed to establish tunnels. Check logs:"
    echo "   Backend tunnel log: /tmp/tunnel-backend.log"
    echo "   Frontend tunnel log: /tmp/tunnel-frontend.log"
    kill $BACKEND_PID $TUNNEL_BACKEND_PID $TUNNEL_FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Tunnels established!"
echo ""
echo "📍 Backend Tunnel:  $BACKEND_TUNNEL_URL"
echo "📍 Frontend Tunnel: $FRONTEND_TUNNEL_URL"
echo ""

echo "📍 Step 3: Configuring Frontend to use Backend Tunnel..."
echo ""

# Update frontend .env with backend tunnel URL
if [ -f "frontend/.env" ]; then
    # Create backup
    cp frontend/.env frontend/.env.backup
    
    # Update the API URL
    sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=$BACKEND_TUNNEL_URL|g" frontend/.env
    rm -f frontend/.env.bak
    
    echo "✅ Frontend configured to use: $BACKEND_TUNNEL_URL"
else
    echo "# API Configuration" > frontend/.env
    echo "VITE_API_URL=$BACKEND_TUNNEL_URL" >> frontend/.env
    echo "✅ Created frontend/.env with tunnel URL"
fi

echo ""
echo "📍 Step 4: Starting Frontend..."
echo ""

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to start..."
for i in {1..30}; do
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ Frontend is ready on http://localhost:5173"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Frontend failed to start."
        kill $BACKEND_PID $TUNNEL_BACKEND_PID $TUNNEL_FRONTEND_PID $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🎉 All services are running!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📍 LOCAL ACCESS:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:3000"
echo "   API Docs:  http://localhost:3000/docs"
echo ""
echo "🌐 PUBLIC ACCESS (share these URLs):"
echo "   Frontend:  $FRONTEND_TUNNEL_URL"
echo "   Backend:   $BACKEND_TUNNEL_URL"
echo ""
echo "💡 IMPORTANT NOTES:"
echo "   • These public URLs will work from anywhere in the world"
echo "   • The frontend is configured to use the public backend URL"
echo "   • URLs will change when you restart (use named tunnels for persistence)"
echo "   • When you stop (Ctrl+C), .env will be restored to localhost"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📝 Tunnel URLs saved to: $TUNNEL_LOG"
echo "$BACKEND_TUNNEL_URL" > $TUNNEL_LOG
echo "$FRONTEND_TUNNEL_URL" >> $TUNNEL_LOG
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
wait
