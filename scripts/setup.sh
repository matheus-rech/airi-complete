#!/bin/bash

# AIRI Complete - Comprehensive Setup Script
# This script sets up the complete AIRI development environment

set -e  # Exit on any error

echo "🤖 AIRI Complete - Setup Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running from project root
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the AIRI Complete project root directory"
    exit 1
fi

print_status "Starting AIRI Complete setup..."

# Check system requirements
print_status "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js $(node --version) ✓"

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8+ from https://python.org/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
print_success "Python $(python3 --version) ✓"

# Check npm/pnpm
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
    print_success "pnpm $(pnpm --version) ✓"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    print_success "npm $(npm --version) ✓"
else
    print_error "Neither npm nor pnpm is available"
    exit 1
fi

# Environment setup
print_status "Setting up environment configuration..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "Created .env file from template"
    print_warning "Please edit .env file with your API keys before running the application"
else
    print_warning ".env file already exists, skipping creation"
fi

# Frontend setup
print_status "Setting up frontend (React)..."
cd frontend

if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    $PACKAGE_MANAGER install
    print_success "Frontend dependencies installed"
else
    print_warning "Frontend dependencies already installed"
fi

# Build frontend for production
print_status "Building frontend for production..."
$PACKAGE_MANAGER run build
print_success "Frontend built successfully"

cd ..

# Backend setup
print_status "Setting up backend..."
cd backend

# Node.js backend setup
if [ -f "package.json" ]; then
    print_status "Installing Node.js backend dependencies..."
    if [ ! -d "node_modules" ]; then
        $PACKAGE_MANAGER install
        print_success "Node.js backend dependencies installed"
    else
        print_warning "Node.js backend dependencies already installed"
    fi
fi

# Python backend setup
if [ -f "requirements.txt" ]; then
    print_status "Setting up Python virtual environment..."
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Python virtual environment created"
    else
        print_warning "Python virtual environment already exists"
    fi
    
    print_status "Activating virtual environment and installing dependencies..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    print_success "Python dependencies installed"
    
    # Generate updated requirements.txt
    pip freeze > requirements.txt
    print_success "Updated requirements.txt"
fi

cd ..

# Database setup
print_status "Setting up database..."
mkdir -p database
mkdir -p logs

if [ ! -f "database/airi.db" ]; then
    print_status "Creating SQLite database..."
    touch database/airi.db
    print_success "SQLite database created"
else
    print_warning "Database already exists"
fi

# Create additional directories
print_status "Creating additional directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p cache
print_success "Additional directories created"

# Make scripts executable
print_status "Making scripts executable..."
chmod +x scripts/*.sh
print_success "Scripts made executable"

# Final setup verification
print_status "Verifying setup..."

# Check if all required files exist
REQUIRED_FILES=(".env" "frontend/dist/index.html" "backend/requirements.txt")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file ✓"
    else
        print_error "$file ✗"
    fi
done

# Setup completion
echo ""
echo "🎉 AIRI Complete setup finished!"
echo "================================"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your API keys:"
echo "   - OPENAI_API_KEY (required)"
echo "   - GEMINI_API_KEY (optional)"
echo ""
echo "2. Start development servers:"
echo "   ./scripts/start-dev.sh"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:5175"
echo "   - Backend: http://localhost:6121"
echo "   - Health: http://localhost:6121/health"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Complete project documentation"
echo "   - docs/API.md - API reference"
echo "   - docs/DEPLOYMENT.md - Deployment guide"
echo ""
echo "🤖 Happy coding with AIRI!"

# Check for API keys
if grep -q "your_.*_api_key_here" .env; then
    echo ""
    print_warning "⚠️  Remember to add your API keys to .env file!"
    print_warning "   The application won't work without proper API keys."
fi

