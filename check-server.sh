#!/bin/bash

echo "Checking server configuration..."
echo ""
echo "1. Docker containers:"
docker ps
echo ""
echo "2. Nginx sites enabled:"
ls -la /etc/nginx/sites-enabled/
echo ""
echo "3. API container logs:"
docker logs app-api-1 --tail=20
echo ""
echo "4. Testing internal API health:"
curl -v http://localhost:3000/api/health
echo ""
echo "5. Testing external API health through nginx:"
curl -v https://www.xbullet.me/api/health
echo ""
echo "6. Nginx config for xbullet.me:"
cat /etc/nginx/sites-enabled/xbullet.me