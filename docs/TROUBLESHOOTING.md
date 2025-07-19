# Production Troubleshooting Guide

## Quick Fixes Applied

### 1. Email Verification Not Sending ✅

**Problem**: Emails show as sent in logs but aren't received.

**Solution Applied**:
- Fixed Mailtrap API v2 format in `email.service.ts`
- Added proper headers and payload structure
- Created test endpoint: `POST /api/test-email`

**To Test**:
```bash
make test-email
# Or manually:
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

### 2. MongoDB Verbose Logging ✅

**Problem**: MongoDB logs cluttering output with COMMAND, NETWORK, ACCESS messages.

**Solution Applied**:
- Created `docker-compose.override.yml` with quiet mode
- Added `--quiet --logLevel 0` flags to MongoDB
- Created `make logs-clean` command for filtered logs

**To Use**:
```bash
# Restart with quiet MongoDB
docker-compose down
docker-compose up -d

# View clean logs
make logs-clean
```

### 3. Raspberry Pi Network Issues ✅

**Problem**: Pi can't connect to services on the network.

**Solution Applied**:
- Created network test script: `scripts/network-test.sh`
- Added `make test-network` command
- Auto-detects host IP for network devices

**To Test**:
```bash
# On your main machine
make test-network

# On Raspberry Pi
curl http://<host-ip>:3000/api/health
```

### 4. Robust Testing ✅

**Features Added**:
- Retry logic for flaky operations
- Email integration tests
- Health check endpoints
- Network connectivity tests

## Common Issues & Solutions

### Email Not Sending

1. **Check Configuration**:
   ```bash
   curl http://localhost:3000/api/email-config
   ```

2. **Verify Mailtrap Token**:
   - Check `.env` has `MAILTRAP_TOKEN` and `MAILTRAP_ENDPOINT`
   - Token should be from Mailtrap API, not SMTP

3. **Test Manually**:
   ```bash
   make test-email your-email@example.com
   ```

### Network Access from Pi/Mobile

1. **Find Host IP**:
   ```bash
   # macOS
   ipconfig getifaddr en0
   
   # Linux/Pi
   hostname -I
   ```

2. **Update Firewall**:
   ```bash
   # Allow ports
   sudo ufw allow 3000/tcp
   sudo ufw allow 3001/tcp
   sudo ufw allow 27017/tcp
   ```

3. **Test Connection**:
   ```bash
   # From Pi/Device
   curl http://<host-ip>:3000/api/health
   ```

### MongoDB Connection Issues

1. **Check Status**:
   ```bash
   docker-compose ps
   make health
   ```

2. **View Logs**:
   ```bash
   docker-compose logs mongodb
   ```

3. **Reset Database**:
   ```bash
   make db-reset
   make seed
   ```

## Quick Commands

```bash
# Full deployment check
make deploy-check

# Test everything
make test
make test-email
make test-network

# View clean logs
make logs-clean

# Check service health
make health

# Restart everything
make restart
```

## Environment Variables

Required for production:
- `MAILTRAP_TOKEN` - For email delivery
- `JWT_SECRET` - For authentication
- `MONGO_URI` - Database connection

Optional:
- `LOG_LEVEL` - Set to 'error' for less verbose logs
- `NODE_ENV` - Set to 'production'

## Mobile/Pi Connection

For devices on your network:
1. Use host machine's IP (not localhost)
2. Ensure ports 3000, 3001 are accessible
3. For Flutter: `http://<host-ip>:3000/graphql`

## Monitoring

- Health: `http://localhost:3000/api/health`
- Email Config: `http://localhost:3000/api/email-config`
- Logs: `make logs-clean`

## Still Having Issues?

1. Run full diagnostic:
   ```bash
   make deploy-check
   ```

2. Check Docker status:
   ```bash
   docker-compose ps
   docker-compose logs
   ```

3. Test individual services:
   ```bash
   make test-network
   make test-email
   ```

---
## Docker-Specific Issues

### Container Not Updating Code

1. **Force Rebuild**:
   ```bash
   docker-compose down
   docker-compose up -d --build --force-recreate
   ```

2. **Copy Files Directly** (Quick fix):
   ```bash
   # For backend
   docker cp backend/src/. passport-backend:/app/src/
   
   # For frontend
   docker cp frontend/src/. passport-frontend:/app/src/
   ```

3. **Check Volume Mounts**:
   ```bash
   docker-compose config
   # Verify volumes are correctly mapped
   ```

### Flutter Mobile Connection

1. **Physical Device Setup**:
   ```bash
   # Find your IP
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Run Flutter with IP
   flutter run --dart-define=API_URL=http://YOUR_IP:3000/graphql
   ```

2. **API Discovery Issues**:
   - Check `/mobile/lib/core/api/api_config.dart`
   - Ensure API URL is correctly passed via dart-define
   - Verify backend is accessible from device network

### GraphQL Issues

1. **Schema Not Loading**:
   ```bash
   # Check GraphQL endpoint
   curl -X POST http://localhost:3000/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"{ __schema { types { name } } }"}'
   ```

2. **Resolver Errors**:
   - Check `/backend/src/routes/graphql/resolvers/`
   - Ensure all fields return proper values
   - Verify authentication headers are passed

## Production Deployment

### DigitalOcean Setup

1. **Environment Variables**:
   ```bash
   # Set production variables
   export NODE_ENV=production
   export JWT_SECRET=your-secret-key
   export MONGO_URI=mongodb://mongo:27017/passport-buddy
   ```

2. **Firewall Configuration**:
   ```bash
   # Allow necessary ports
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw allow 22/tcp
   ```

3. **Docker Production**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

---
*Last updated: 2025-07-19*