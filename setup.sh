#!/bin/bash

set -e

echo "🚀 DentiCloud Setup Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Start database services
echo ""
echo "📦 Starting database services..."
docker-compose up -d

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if PostgreSQL is ready
until docker exec dentista-postgres pg_isready -U dentista > /dev/null 2>&1; do
    echo "⏳ Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready"

# Navigate to backend directory
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Copy .env.example to .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npm run prisma:generate

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
npm run prisma:migrate

# Seed database
echo ""
echo "🌱 Seeding database..."
npm run prisma:seed

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "📝 Test Credentials:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Super Admin:"
echo "  Email: admin@dentista.com"
echo "  Password: Admin123!"
echo ""
echo "Dentist:"
echo "  Email: dentist@dentista.com"
echo "  Password: Dentist123!"
echo ""
echo "Patient:"
echo "  Email: patient@dentista.com"
echo "  Password: Patient123!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 To start the development server:"
echo "   cd backend && npm run start:dev"
echo ""
echo "📚 API Documentation will be available at:"
echo "   http://localhost:3000/api/docs"
echo ""
