#!/bin/bash

# AIRI Complete - Development Startup Script
# Starts all development servers concurrently

set -e

echo "🚀 Starting AIRI Complete Development Environment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please run ./scripts/setup.sh first"
    exit 1
fi

# Check if API keys are configured
if grep -q "your_.*_api_key_here" .env; then
    print_error "Please configure your API keys in .env file"
    exit 1
fi

# Function to kill background processes on exit
cleanup() {
    print_status "Shutting down development servers..."
    jobs -p | xargs -r kill
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend server
print_status "Starting Node.js backend server..."
cd backend
node airi-backend-server.cjs &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! curl -s http://localhost:6121/health > /dev/null; then
    print_error "Backend server failed to start"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

print_success "Backend server started on http://localhost:6121"

# Start frontend development server
print_status "Starting React frontend server..."
cd frontend
npm run dev -- --host &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 5

print_success "Frontend server started on http://localhost:5175"

echo ""
echo "🎉 AIRI Complete Development Environment Ready!"
echo "=============================================="
echo ""
echo "📍 Access Points:"
echo "   🌐 Frontend:  http://localhost:5175"
echo "   🔧 Backend:   http://localhost:6121"
echo "   ❤️  Health:   http://localhost:6121/health"
echo ""
echo "🔧 Development Tools:"
echo "   📊 WebSocket: ws://localhost:6121/ws"
echo "   🎤 Voice API: http://localhost:6121/api/tts"
echo "   🧠 Memory:    http://localhost:6121/api/memory"
echo ""
echo "📋 Quick Commands:"
echo "   Test WebSocket: wscat -c ws://localhost:6121/ws"
echo "   Check Health:   curl http://localhost:6121/health"
echo "   View Logs:      tail -f logs/airi.log"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"
echo ""

# Keep script running and show logs
print_status "Monitoring servers... (Press Ctrl+C to stop)"

# Wait for background processes
wait

