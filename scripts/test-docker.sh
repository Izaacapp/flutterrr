#!/bin/bash

echo "🧪 Running tests in Docker environment..."

# Check if containers are running
if ! docker-compose ps | grep -q "mongodb.*Up"; then
    echo "⚠️  MongoDB container not running. Starting services..."
    docker-compose up -d mongodb
    sleep 5
fi

# Run API tests in Docker
echo ""
echo "📦 Running API tests..."
docker-compose exec -T api npm test -- --passWithNoTests

# Run Web tests locally (they don't need DB)
echo ""
echo "🌐 Running Web tests..."
cd web && npm test -- --run

echo ""
echo "✅ Test run complete!"