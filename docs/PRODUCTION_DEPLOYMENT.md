# Production Deployment Guide

This guide covers deploying Passport Buddy to production on DigitalOcean using Jenkins CI/CD.

## 🚀 Quick Deploy

```bash
# Check everything is ready
make deploy-check

# Deploy to production (pushes to Git → Jenkins → Server)
make deploy-prod
```

## 📋 Production Architecture

### Server Configuration
- **Provider**: DigitalOcean Droplet
- **IP**: 138.197.72.196
- **Domain**: https://www.xbullet.me
- **OS**: Ubuntu (Voyr hostname)

### Services & Ports
| Service | Port | Access |
|---------|------|--------|
| Nginx | 80, 443 | Public (HTTPS) |
| Frontend | 8080 | Internal only |
| Backend API | 3000 | Internal only |
| MongoDB | 27017 | Internal only |
| Jenkins | 8081 | http://138.197.72.196:8081 |
| Mongo Express | 8082 | Optional |

### Docker Images
- Backend: `timesnotrelative/passport-buddy-backend`
- Frontend: `timesnotrelative/passport-buddy-frontend`

## 🔧 Initial Setup

### 1. Server Prerequisites

SSH to server and ensure these are installed:
```bash
ssh root@138.197.72.196

# Check installations
docker --version
docker-compose --version
nginx -v
java -version  # For Jenkins
```

### 2. SSL Certificate Setup

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d xbullet.me -d www.xbullet.me

# Auto-renewal
sudo certbot renew --dry-run
```

### 3. Nginx Configuration

Copy nginx config to server:
```bash
# From local machine
scp config/nginx/xbullet.conf root@138.197.72.196:/etc/nginx/sites-available/xbullet

# On server
ln -s /etc/nginx/sites-available/xbullet /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 4. Jenkins Configuration

Jenkins credentials needed:
- `docker-creds`: Docker Hub login
- `do-ssh-key`: SSH key for server access
- `mongo-prod-user`: MongoDB username
- `mongo-prod-pass`: MongoDB password
- `github-creds`: GitHub access (if private repo)

## 🚢 Deployment Process

### Automated via Jenkins

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Deploy: your changes"
   git push origin main
   ```

2. **Jenkins automatically**:
   - Builds Docker images
   - Pushes to Docker Hub
   - SSHs to server
   - Deploys new containers

3. **Monitor deployment**:
   - Jenkins: http://138.197.72.196:8081
   - Logs: `make prod-logs`

### Manual Deployment

If Jenkins is down:
```bash
# 1. Build images locally
make build-prod

# 2. Push to registry
docker login
make push-prod

# 3. Deploy on server
ssh root@138.197.72.196
cd /app
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Production Commands

### Monitoring
```bash
# Check status
make prod-status

# View logs
make prod-logs

# SSH to server
make prod-shell
```

### Maintenance
```bash
# Restart services
make prod-restart

# Pull latest images
make prod-pull

# Backup database
make prod-backup
```

### Troubleshooting
```bash
# Check specific container
ssh root@138.197.72.196
docker logs passport-buddy-backend
docker logs passport-buddy-frontend

# Check nginx logs
tail -f /var/log/nginx/xbullet.error.log

# Restart everything
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## 🔐 Environment Variables

Production uses `.env.prod` with these key variables:

```env
# Database (from Jenkins secrets)
MONGO_ROOT_USERNAME=${MONGO_PROD_USER}
MONGO_ROOT_PASSWORD=${MONGO_PROD_PASS}

# Security (MUST CHANGE!)
JWT_SECRET=<generate-strong-secret>
SESSION_SECRET=<generate-strong-secret>

# URLs
ALLOWED_ORIGINS=https://www.xbullet.me,https://xbullet.me
VITE_API_URL=https://www.xbullet.me
```

## 🚨 Production Checklist

Before deploying:
- [ ] Run tests: `make test`
- [ ] Check env vars in `.env.prod`
- [ ] Verify JWT_SECRET is changed
- [ ] Test build locally: `make build-prod`
- [ ] Check disk space on server
- [ ] Backup database: `make prod-backup`

## 🔄 Rollback Process

If deployment fails:

1. **Quick rollback**:
   ```bash
   ssh root@138.197.72.196
   cd /app
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d --force-recreate
   ```

2. **Rollback to specific version**:
   ```bash
   export TAG=<previous-build-number>
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 📱 Mobile App Production

Update mobile app for production:
```bash
# Build APK
flutter build apk \
  --dart-define=API_URL=https://www.xbullet.me/graphql \
  --dart-define=PROD_API_URL=https://www.xbullet.me

# Build iOS
flutter build ios \
  --dart-define=API_URL=https://www.xbullet.me/graphql \
  --dart-define=PROD_API_URL=https://www.xbullet.me
```

## 🛡️ Security Recommendations

1. **Change default secrets**:
   ```bash
   # Generate secure secrets
   openssl rand -base64 32  # For JWT_SECRET
   openssl rand -base64 32  # For SESSION_SECRET
   ```

2. **Firewall rules**:
   ```bash
   ufw allow 22/tcp    # SSH
   ufw allow 80/tcp    # HTTP
   ufw allow 443/tcp   # HTTPS
   ufw allow 8081/tcp  # Jenkins (restrict to your IP)
   ufw enable
   ```

3. **MongoDB security**:
   - Use strong passwords
   - Enable authentication
   - Restrict network access

4. **Regular updates**:
   ```bash
   apt update && apt upgrade
   docker system prune -a
   ```

## 📞 Support

- **Server issues**: Check DigitalOcean dashboard
- **Jenkins issues**: http://138.197.72.196:8081
- **App issues**: Check logs with `make prod-logs`
- **Domain issues**: Check DNS and nginx config

---

**Remember**: Always test in development first! Use `make dev` locally before deploying.