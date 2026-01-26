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
echo "⏳ Public URLs will be displayed below..."
echo ""
echo "Press Ctrl+C to stop tunnels"
echo ""

# Start tunnels
npx concurrently \
  --names "tunnel-api,tunnel-web" \
  --prefix-colors "yellow,magenta" \
  "cloudflared tunnel --url http://localhost:3000" \
  "cloudflared tunnel --url http://localhost:5173"
