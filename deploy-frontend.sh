#!/bin/bash

echo "Deploying updated frontend to production..."

ssh root@138.197.72.196 << 'EOF'
cd /app

# Pull the latest frontend image
docker pull timesnotrelative/passport-buddy-frontend:latest

# Restart just the frontend container
docker-compose -f docker-compose.prod.yml up -d web

# Check logs
docker logs app-web-1 --tail=20

echo "Frontend deployment complete!"
EOF