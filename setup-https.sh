#!/bin/bash

echo "Setting up HTTPS for xbullet.me"
echo "================================"

# Install certbot if not already installed
echo "Installing certbot..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Stop nginx temporarily to get certificates
echo "Stopping nginx..."
sudo systemctl stop nginx

# Get SSL certificates for all domains
echo "Getting SSL certificates..."
sudo certbot certonly --standalone \
  -d xbullet.me \
  -d www.xbullet.me \
  -d api.xbullet.me \
  --non-interactive \
  --agree-tos \
  --email noreply@xbullet.me \
  --no-eff-email

# Update nginx configuration with SSL
echo "Updating nginx configuration..."
sudo tee /etc/nginx/sites-available/xbullet.me > /dev/null << 'EOF'
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name www.xbullet.me xbullet.me api.xbullet.me;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name www.xbullet.me xbullet.me api.xbullet.me;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/xbullet.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/xbullet.me/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # GraphQL endpoint
    location /graphql {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads directory
    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend (all other routes)
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # Logs
    access_log /var/log/nginx/xbullet.me.access.log;
    error_log /var/log/nginx/xbullet.me.error.log;
}
EOF

# Start nginx
echo "Starting nginx..."
sudo systemctl start nginx

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

# Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx

# Set up auto-renewal
echo "Setting up auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test HTTPS endpoints
echo ""
echo "Testing HTTPS endpoints..."
echo "=========================="
curl -s -I https://www.xbullet.me/api/health
echo ""
curl -s -I https://www.xbullet.me/
echo ""
curl -s -I https://www.xbullet.me/graphql

echo ""
echo "HTTPS setup complete!"
echo "Your site is now accessible at:"
echo "  - https://www.xbullet.me"
echo "  - https://api.xbullet.me"
echo ""
echo "SSL certificates will auto-renew via certbot timer."