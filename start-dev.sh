#!/bin/bash

# SocialTweebs Development Server Startup Script
# This script starts both the backend (NestJS) and frontend (React + Vite) servers

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

echo ""
echo "✨ Starting backend and frontend servers..."
echo ""
echo "📍 Backend will run on: http://localhost:3000"
echo "📍 Frontend will run on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Run both servers concurrently
npm run dev
