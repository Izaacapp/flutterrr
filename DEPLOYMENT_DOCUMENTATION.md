# MERN & Flutter Deployment Documentation

## Date: July 20, 2025

## Overview
This document covers the deployment process, fixes applied, and known issues for the Passport Buddy application (MERN stack with Flutter mobile app).

## Production Environment
- **Server IP**: 138.197.72.196
- **Domain**: https://www.xbullet.me
- **Server Provider**: DigitalOcean
- **CI/CD**: Jenkins (currently down)
- **Container Registry**: Docker Hub (timesnotrelative)

## Major Issues Fixed

### 1. Flutter Mobile App Connection Issue
**Problem**: Flutter app showed error "API_URL must be provided via dart-define for physical devices"
**Solution**: 
- Updated Makefile to include dart-define flags for API URLs
- Added proper environment variables for mobile development
```makefile
run-flutter-android:
    cd mobile && flutter run --dart-define=API_URL=$(MOBILE_API_URL) --dart-define=GRAPHQL_URL=$(MOBILE_GRAPHQL_URL)
```

### 2. Frontend Environment Variables Showing as Undefined
**Problem**: Frontend was showing "undefined" in API URLs instead of actual values
**Solution**: 
- Fixed `frontend/vite.config.ts` to properly inject environment variables
- Changed from `__API_URL__` to `import.meta.env.VITE_API_URL`
- Rebuilt frontend with v2 tag to ensure fresh deployment

### 3. Docker Build Context Issues
**Problem**: Backend Dockerfile couldn't find package-lock.json
**Solution**: 
- Changed build context from `./backend` to `.` in Makefile
- Updated all Docker build commands to use root context

### 4. TypeScript Compilation Errors
**Problem**: Test files causing build failures in production
**Solution**: 
- Created `tsconfig.prod.json` excluding test files
- Added `build:prod` script to package.json

### 5. Mailtrap Email Service Integration
**Problem**: Email service not using existing mailtrap configuration
**Solution**: 
- Updated `backend/src/services/email.service.ts` to use existing mailtrap modules
- Added fallback for development mode when Mailtrap fails
- Modified mailtrap/emails.js to handle development mode gracefully

### 6. Backend Container Health Check Failures
**Problem**: Backend container failing with MODULE_NOT_FOUND error for mailtrap config
**Root Cause**: JavaScript files in src/mailtrap/ not being copied to dist/ during TypeScript build
**Solution**: 
- Modified backend/package.json to add copy-files script:
```json
"build": "tsc && npm run copy-files",
"build:prod": "tsc -p tsconfig.prod.json && npm run copy-files",
"copy-files": "mkdir -p dist/mailtrap && cp -r src/mailtrap/*.js dist/mailtrap/ 2>/dev/null || true"
```
- Manually deployed version 67 with the fix

### 7. Port Conflicts and Nginx Configuration
**Problem**: Multiple conflicting nginx configurations on server
**Solution**: 
- Removed conflicting server blocks
- Created unified nginx configuration for passport-buddy
- Changed frontend port to 3001 to avoid conflicts

### 8. MongoDB Authentication Issues
**Problem**: MongoDB connection failures due to auth mismatches
**Solution**: 
- Simplified MongoDB setup without authentication for now
- Updated connection strings in docker-compose files

## Current Architecture

### Docker Services
1. **Backend (API)**: Node.js/Express/GraphQL on port 3000
2. **Frontend (Web)**: React/Vite on port 3001  
3. **MongoDB**: Database on port 27017
4. **Nginx**: Reverse proxy on port 80/443

### Environment Variables Structure
```env
# Backend
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb://mongodb:27017/passport_buddy_prod
JWT_SECRET=[configured]
MAILTRAP_TOKEN=[configured]
MAILTRAP_ENDPOINT=https://send.api.mailtrap.io

# Frontend
VITE_API_URL=https://www.xbullet.me
VITE_GRAPHQL_URL=https://www.xbullet.me/graphql
VITE_WS_URL=wss://www.xbullet.me/graphql
```

## Known Issues and TODOs

### Critical Issues
1. **Jenkins is Down**: 
   - Currently returning 502 Bad Gateway
   - Manual deployments required until fixed
   - Check Jenkins service status on server

2. **Invalid Mailtrap Token**:
   - Current token (59406d5785ac01dc13eed94c3ec47dcb) returns 401 Unauthorized
   - Email service falls back to console logging in development
   - Need valid Mailtrap API token for production emails

### Medium Priority Issues
3. **MongoDB Security**:
   - Currently running without authentication
   - Should re-enable auth with proper user/password setup

4. **SSL Certificate**:
   - Need to verify SSL cert is properly configured for https://www.xbullet.me
   - Currently using self-signed or expired certificate

5. **GraphQL Mutations**:
   - User registration not available through GraphQL
   - Only REST endpoints work for auth operations

### Low Priority Issues
6. **Git Repository Sync**:
   - Local changes need to be pushed to GitHub
   - User prefers to push manually

7. **Test Coverage**:
   - Test files excluded from production build
   - Need to set up proper test environment

8. **Email Templates**:
   - Existing templates in mailtrap/emailTemplate.js
   - Not fully integrated with all email types

## Deployment Commands

### Manual Deployment (when Jenkins is down)
```bash
# SSH to server
ssh root@138.197.72.196

# Navigate to app directory
cd /app

# Pull latest code
git pull origin main

# Build and deploy
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker logs app-api-1 --tail 50
```

### Local Development
```bash
# Start all services
make dev

# Run Flutter app
make run-flutter-android

# Build for production
make build-prod
```

## API Endpoints

### Health Check
- **URL**: https://www.xbullet.me/api/health
- **Response**: Shows status of all services (api, database, email, storage)

### Authentication
- **Signup**: POST /api/auth/signup
  - Required: fullName, email, password, username
- **Login**: POST /api/auth/login
- **Verify Account**: POST /api/auth/verify-account
- **Logout**: POST /api/auth/logout

### Test Endpoints
- **Test Email**: POST /api/test-email
  - Body: { "to": "email@example.com", "testOtp": "123456" }

## File Structure Notes

### Important Files Modified
1. `/backend/package.json` - Added copy-files script
2. `/frontend/vite.config.ts` - Fixed env variable injection
3. `/Makefile` - Updated build contexts and mobile commands
4. `/backend/src/services/email.service.ts` - Integrated with existing mailtrap
5. `/backend/src/mailtrap/emails.js` - Added dev mode fallback
6. `/Jenkinsfile` - Updated health check endpoints

### Configuration Files
- Development: `config/.env.dev`
- Production: `config/.env.prod`
- Docker Compose Dev: `docker-compose.yml`
- Docker Compose Prod: `docker-compose.prod.yml`

## Security Considerations
1. Never commit .env files with real credentials
2. Mailtrap token needs to be kept secure
3. MongoDB should have authentication enabled
4. SSL certificates should be valid and up-to-date
5. Jenkins credentials should be rotated regularly

## Next Steps
1. Fix Jenkins service on production server
2. Obtain valid Mailtrap API token
3. Re-enable MongoDB authentication
4. Set up proper SSL certificates
5. Add GraphQL mutations for auth operations
6. Implement comprehensive error logging
7. Set up monitoring for production services

## Contact for Issues
- GitHub Repository: https://github.com/Izaacapp/flutterrr
- Server Access: root@138.197.72.196 (password in secure storage)

---
End of Documentation - Last Updated: July 20, 2025