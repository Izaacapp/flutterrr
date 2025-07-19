#!/bin/bash  
apt update  
apt install -y docker-compose nginx ufw  
ufw allow 80  
ufw allow 443  
ufw allow 22  
ufw enable  
mkdir -p /app/{certs,scripts}  
systemctl restart nginx  