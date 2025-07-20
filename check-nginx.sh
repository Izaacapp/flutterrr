#!/bin/bash

echo "# Check nginx sites:"
ls -la /etc/nginx/sites-enabled/
echo ""
echo "# Check if xbullet.me config exists:"
ls -la /etc/nginx/sites-enabled/ | grep xbullet
echo ""
echo "# Show current nginx config for xbullet.me:"
cat /etc/nginx/sites-enabled/xbullet.me 2>/dev/null || cat /etc/nginx/sites-enabled/default