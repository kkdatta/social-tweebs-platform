#!/bin/bash

# SocialTweebs Development Server Startup Script (Local Only)
# This script starts both backend and frontend for local development

echo "🚀 Starting SocialTweebs Development Servers..."
echo ""

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

# Ensure frontend .env uses localhost
if [ -f "frontend/.env" ]; then
    # Check if it's pointing to a tunnel URL and change it to localhost
    if grep -q "trycloudflare.com" frontend/.env; then
        echo "🔧 Resetting frontend to use localhost..."
        sed -i.bak 's|VITE_API_URL=https://.*trycloudflare.com|VITE_API_URL=http://localhost:3000|g' frontend/.env
        rm -f frontend/.env.bak
    fi
fi

echo ""
echo "✨ Starting backend and frontend servers..."
echo ""
echo "📍 Backend will run on: http://localhost:3000"
echo "📍 Frontend will run on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both services using concurrently
npm run dev
