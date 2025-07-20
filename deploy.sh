#!/bin/bash

# SSH to server and redeploy
ssh root@138.197.72.196 << 'EOF'
cd /root/passport-buddy
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs backend
EOF