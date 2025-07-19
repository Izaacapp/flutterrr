# Environment Variables Configuration

Complete reference for all environment variables used in the Passport Buddy application.

## 🚀 Quick Start

```bash
# Copy environment templates
cp .env.example .env.dev
cp .env.example .env.prod

# Edit with your values
nano .env.dev
```

## 📋 Environment Files Overview

| File | Purpose | Location |
|------|---------|----------|
| `.env.dev` | Development configuration | Root directory |
| `.env.prod` | Production configuration | Root directory |
| `.env.test` | Test configuration | Root directory |
| `.env.local` | Local overrides (gitignored) | Root directory |

## 🔧 Backend Environment Variables

### Required Variables

```env
# Server Configuration
NODE_ENV=development              # Environment: development|production|test
PORT=3000                        # Server port
API_HOST=localhost               # API hostname

# Database
MONGO_URI=mongodb://root:pass@mongodb:27017/devdb?authSource=admin
MONGO_DB_NAME=devdb              # Database name

# Authentication
JWT_SECRET=your-jwt-secret-key   # REQUIRED: Change in production!
JWT_EXPIRES_IN=7d                # Token expiration
```

### Optional Variables

```env
# Email Service (Mailtrap)
MAILTRAP_TOKEN=                  # Your Mailtrap API token
MAILTRAP_ENDPOINT=https://send.api.mailtrap.io
EMAIL_FROM=noreply@passportbuddy.com
EMAIL_FROM_NAME=Passport Buddy

# File Upload
STORAGE_TYPE=local               # Storage type: local|s3|cloudinary
UPLOAD_DIR=./uploads             # Local upload directory
UPLOAD_URL=/uploads              # Public URL for uploads
MAX_FILE_SIZE=5242880           # Max file size in bytes (5MB)
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Security
BCRYPT_ROUNDS=10                # Password hashing rounds
SESSION_SECRET=                  # Session secret (if using sessions)
RATE_LIMIT_WINDOW=15            # Rate limit window in minutes
RATE_LIMIT_MAX=100              # Max requests per window

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
CORS_CREDENTIALS=true

# Features
ENABLE_SIGNUP=true              # Enable user registration
ENABLE_EMAIL_VERIFICATION=true  # Require email verification
ENABLE_GRAPHQL_PLAYGROUND=true  # GraphQL playground (disable in prod)

# OTP/Verification
OTP_EXPIRY_MINUTES=5           # OTP code expiration
ACCOUNT_DELETION_DAYS=30       # Delete unverified accounts after
```

## 🎨 Frontend Environment Variables

All frontend variables must be prefixed with `VITE_`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_GRAPHQL_URL=http://localhost:3000/graphql
VITE_WS_URL=ws://localhost:3000/graphql

# App Configuration
VITE_APP_NAME=Passport Buddy
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Social Travel Platform

# Feature Flags
VITE_ENABLE_SIGNUP=true
VITE_ENABLE_SOCIAL_AUTH=false
VITE_ENABLE_PWA=true

# Analytics (Optional)
VITE_GA_TRACKING_ID=
VITE_SENTRY_DSN=

# Development
VITE_PORT=3001
VITE_HOST=localhost
```

## 📱 Mobile Environment Variables

Configure via `--dart-define` when building/running:

```bash
# Development
flutter run \
  --dart-define=API_URL=http://localhost:3000/graphql \
  --dart-define=WS_URL=ws://localhost:3000/graphql

# Production
flutter build apk \
  --dart-define=API_URL=https://api.passportbuddy.com/graphql \
  --dart-define=WS_URL=wss://api.passportbuddy.com/graphql \
  --dart-define=PROD_API_URL=https://api.passportbuddy.com \
  --dart-define=ENABLE_CRASHLYTICS=true
```

### Available Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | GraphQL endpoint | Platform-specific |
| `WS_URL` | WebSocket endpoint | Auto-derived from API_URL |
| `PROD_API_URL` | Production API base | None |
| `ENABLE_SIGNUP` | Enable registration | true |
| `ENABLE_EMAIL_VERIFICATION` | Require verification | true |
| `APP_NAME` | Application name | Passport Buddy |
| `ENABLE_CRASHLYTICS` | Enable crash reporting | false |

## 🐳 Docker Environment Variables

### Docker Compose Variables

```env
# MongoDB
MONGO_ROOT_USERNAME=root
MONGO_ROOT_PASSWORD=pass
MONGO_DB_NAME=devdb

# Container Configuration
BACKEND_PORT=3000
FRONTEND_PORT=3001
MONGO_PORT=27017

# Volumes
UPLOADS_VOLUME=./uploads
MONGO_DATA_VOLUME=./data/mongodb

# Network
NETWORK_NAME=passport_buddy_network
```

### Building Images

```env
# Build Arguments
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD)
VERSION=1.0.0

# Registry
DOCKER_REGISTRY=docker.io
DOCKER_NAMESPACE=passportbuddy
```

## 🚀 Production Configuration

### Backend Production

```env
# Server
NODE_ENV=production
PORT=3000
API_HOST=api.passportbuddy.com

# Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/passport_buddy?retryWrites=true&w=majority

# Security
JWT_SECRET=<generate-strong-secret>
SESSION_SECRET=<generate-strong-secret>
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=https://passportbuddy.com,https://www.passportbuddy.com

# Features (Production)
ENABLE_GRAPHQL_PLAYGROUND=false
ENABLE_SIGNUP=true

# Email (Production)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=<your-sendgrid-key>

# Storage (S3)
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_S3_BUCKET=passport-buddy-uploads
AWS_REGION=us-east-1

# Monitoring
SENTRY_DSN=<your-sentry-dsn>
LOG_LEVEL=error
```

### Frontend Production

```env
# API
VITE_API_URL=https://api.passportbuddy.com
VITE_GRAPHQL_URL=https://api.passportbuddy.com/graphql
VITE_WS_URL=wss://api.passportbuddy.com/graphql

# Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Features
VITE_ENABLE_SIGNUP=true
VITE_ENABLE_PWA=true
```

## 🔐 Security Best Practices

### 1. Secret Generation

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate secure password
openssl rand -base64 16
```

### 2. Environment Security

- ✅ Never commit `.env` files
- ✅ Use `.env.example` as templates
- ✅ Rotate secrets regularly
- ✅ Use different secrets per environment
- ✅ Store production secrets in secure vaults
- ✅ Limit access to production configs

### 3. Secret Management Tools

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Google Secret Manager**
- **Kubernetes Secrets**
- **Docker Secrets**

## 📝 Example Files

### `.env.example` (Root)

```env
# Copy this file to .env.dev or .env.prod and fill in values

# MongoDB
MONGO_URI=mongodb://root:pass@mongodb:27017/devdb?authSource=admin
MONGO_ROOT_USERNAME=root
MONGO_ROOT_PASSWORD=changeme

# Backend
PORT=3000
JWT_SECRET=changeme
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3000
VITE_GRAPHQL_URL=http://localhost:3000/graphql

# Email (Optional)
MAILTRAP_TOKEN=
```

### `.env.dev` (Development)

```env
# Development configuration
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://root:pass@mongodb:27017/devdb?authSource=admin
JWT_SECRET=dev-secret-key-not-for-production
ENABLE_GRAPHQL_PLAYGROUND=true
```

### `.env.prod` (Production)

```env
# Production configuration
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://prod-user:secure-pass@cluster.mongodb.net/passport_buddy
JWT_SECRET=${JWT_SECRET_FROM_VAULT}
ENABLE_GRAPHQL_PLAYGROUND=false
```

## 🚨 Troubleshooting

### Environment Variables Not Loading

```bash
# Check current environment
echo $NODE_ENV

# Verify .env file exists
ls -la .env*

# Test loading with dotenv-cli
npx dotenv-cli -e .env.dev -- node -e "console.log(process.env)"
```

### Docker Environment Issues

```bash
# Check Docker environment
docker-compose config

# Override with specific env file
docker-compose --env-file .env.prod up

# Inspect running container
docker exec <container> printenv
```

### Mobile Build Issues

```bash
# Verify dart-define is working
flutter run --dart-define=TEST=hello
# In app: print(const String.fromEnvironment('TEST'));

# Check generated files
cat ios/Flutter/Generated.xcconfig
cat android/local.properties
```

## 📚 References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker Environment Files](https://docs.docker.com/compose/environment-variables/)
- [Flutter Environment Variables](https://flutter.dev/docs/development/flavors)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices#configuration)