#!/bin/bash

# SocialTweebs Development Server with Cloudflare Tunnel Startup Script
# This script starts both servers and creates public URLs via Cloudflare Tunnel

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

echo ""
echo "✨ Starting servers with Cloudflare Tunnel..."
echo ""
echo "📍 Backend (local): http://localhost:3000"
echo "📍 Frontend (local): http://localhost:5173"
echo ""
echo "⏳ Public URLs will be displayed below once tunnels are established..."
echo "   (This may take a few seconds)"
echo ""
echo "💡 Tip: Save the public URLs to access your app from anywhere!"
echo ""
echo "Press Ctrl+C to stop all servers and tunnels"
echo ""

# Start all services using concurrently
npx concurrently \
  --names "backend,frontend,tunnel-api,tunnel-web" \
  --prefix-colors "blue,green,yellow,magenta" \
  "npm run start:dev" \
  "cd frontend && npm run dev" \
  "cloudflared tunnel --url http://localhost:3000" \
  "cloudflared tunnel --url http://localhost:5173"
