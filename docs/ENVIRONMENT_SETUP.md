# Environment Setup Guide

This comprehensive guide covers setting up the Passport Buddy development environment from scratch.

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd mern&flutter

# 2. Run initial setup
make setup

# 3. Start development environment
make dev

# 4. Run mobile app
make mobile
```

## 📋 Prerequisites

### Required Software

| Software | Version | Check Command | Installation |
|----------|---------|---------------|--------------|
| **Docker** | 20.10+ | `docker --version` | [Get Docker](https://docs.docker.com/get-docker/) |
| **Docker Compose** | 2.0+ | `docker-compose --version` | Included with Docker Desktop |
| **Node.js** | 18+ | `node --version` | [Node.js](https://nodejs.org/) |
| **npm** | 8+ | `npm --version` | Comes with Node.js |
| **Flutter** | 3.0+ | `flutter --version` | [Flutter Install](https://flutter.dev/docs/get-started/install) |
| **Make** | Any | `make --version` | Pre-installed on macOS/Linux |

### Optional Tools
- **MongoDB Compass** - GUI for MongoDB
- **Postman/Insomnia** - API testing
- **VS Code** - Recommended IDE with extensions

## 🔧 Initial Setup

### 1. Environment Configuration

Create environment files in the root directory:

```bash
# Development environment
cat > .env.dev << EOF
# MongoDB
MONGO_URI=mongodb://root:pass@mongodb:27017/devdb?authSource=admin
MONGO_ROOT_USERNAME=root
MONGO_ROOT_PASSWORD=pass
MONGO_DB_NAME=devdb

# Backend
PORT=3000
JWT_SECRET=your-dev-jwt-secret-change-this
NODE_ENV=development

# Frontend URLs
VITE_API_URL=http://localhost:3000
VITE_GRAPHQL_URL=http://localhost:3000/graphql
VITE_WS_URL=ws://localhost:3000/graphql

# Email (Optional - get token from Mailtrap)
MAILTRAP_TOKEN=
MAILTRAP_ENDPOINT=https://send.api.mailtrap.io

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
UPLOAD_DIR=./uploads
EOF
```

### 2. Install Dependencies

```bash
# Run the setup command
make setup

# This will:
# - Install backend dependencies
# - Install frontend dependencies  
# - Install shared package dependencies
# - Create necessary directories
```

### 3. Flutter Setup

```bash
# Check Flutter installation
flutter doctor

# Get Flutter dependencies
cd mobile && flutter pub get

# Return to root
cd ..
```

## 🐳 Docker Development

### Starting Services

```bash
# Start all services (frontend, backend, database)
make dev

# Start in background
make dev-d

# Check service status
make status

# View logs
make logs
```

### Service URLs

After running `make dev`, services are available at:

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **GraphQL Playground**: http://localhost:3000/graphql
- **MongoDB**: mongodb://localhost:27017

## 📱 Mobile Development Setup

### iOS Setup (macOS only)

1. Install Xcode from App Store
2. Install iOS simulators:
   ```bash
   xcodebuild -downloadPlatform iOS
   ```
3. Run on iOS Simulator:
   ```bash
   make mobile-ios-simulator
   ```

### Android Setup

1. Install Android Studio
2. Install Android SDK and emulators via Android Studio
3. Add to PATH:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
4. Run on Android Emulator:
   ```bash
   make mobile-android-emulator
   ```

### Physical Device Setup

**iOS Device**:
1. Connect iPhone via USB
2. Trust the computer on your device
3. Run: `make mobile-ios-physical`

**Android Device**:
1. Enable Developer Mode (tap Build Number 7 times)
2. Enable USB Debugging
3. Connect via USB
4. Run: `make mobile-android-physical`

## 🗄️ Database Setup

### Seed Test Data

```bash
# Seed database with test users
make seed

# Reset and seed fresh
make seed-fresh

# View test users
make test-users
```

### Access MongoDB

```bash
# MongoDB shell
make db-shell

# MongoDB Compass GUI
# Connect to: mongodb://root:pass@localhost:27017/devdb?authSource=admin
```

## 🔐 Environment Variables Reference

### Backend Variables

```env
# Server
NODE_ENV=development|production|test
PORT=3000
API_HOST=localhost

# Database
MONGO_URI=mongodb://user:pass@host:port/db
MONGO_DB_NAME=devdb

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# Email Service
MAILTRAP_TOKEN=your-mailtrap-token
MAILTRAP_ENDPOINT=https://send.api.mailtrap.io
EMAIL_FROM=noreply@passportbuddy.com
EMAIL_FROM_NAME=Passport Buddy

# File Upload
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
UPLOAD_URL=/uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
```

### Frontend Variables

```env
# API URLs
VITE_API_URL=http://localhost:3000
VITE_GRAPHQL_URL=http://localhost:3000/graphql
VITE_WS_URL=ws://localhost:3000/graphql

# App Config
VITE_APP_NAME=Passport Buddy
VITE_APP_VERSION=1.0.0
```

### Mobile Variables (via dart-define)

```bash
# Development
flutter run --dart-define=API_URL=http://localhost:3000/graphql

# Production
flutter build apk --dart-define=API_URL=https://api.passportbuddy.com/graphql
```

## 🧪 Testing Setup

### Running Tests

```bash
# All tests
make test

# Backend tests
make test-backend

# Frontend tests  
make test-frontend

# Mobile tests
make test-mobile

# With coverage
make test-coverage
```

### E2E Testing

1. Ensure services are running: `make dev`
2. Run E2E tests: `make test-e2e`

## 🚨 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change ports in docker-compose.yml
```

**Docker Issues**
```bash
# Reset Docker
make clean
make setup
make dev

# Rebuild containers
make rebuild
```

**Mobile Connection Issues**
```bash
# Get your local IP
make info

# Ensure backend is accessible
curl http://YOUR_IP:3000/health

# Check firewall settings
# macOS: System Preferences > Security & Privacy > Firewall
# Windows: Windows Defender Firewall
# Linux: ufw/iptables
```

**Flutter Issues**
```bash
# Clean Flutter
make mobile-clean

# Reset Flutter
make mobile-reset

# Check Flutter setup
flutter doctor -v
```

### Debug Commands

```bash
# Check all services
make status

# View specific logs
make logs-backend
make logs-frontend
make logs-db

# Environment check
make env-check

# Database shell
make db-shell
```

## 🔒 Security Notes

1. **Never commit .env files** - They contain secrets
2. **Change default passwords** - Especially for production
3. **Use strong JWT secrets** - Generate with: `openssl rand -base64 32`
4. **Enable HTTPS in production** - Use proper SSL certificates
5. **Restrict MongoDB access** - Use authentication in production

## 📚 Next Steps

1. **Explore the codebase**:
   - Backend: `/backend` - GraphQL API and REST endpoints
   - Frontend: `/frontend` - React application
   - Mobile: `/mobile` - Flutter application

2. **Make your first change**:
   - Pick a test user: `make test-users`
   - Login at http://localhost:3001
   - Create a post
   - See it appear in mobile app

3. **Read additional docs**:
   - [API Documentation](../backend/README.md)
   - [Frontend Guide](../frontend/README.md)
   - [Mobile Guide](../mobile/README.md)
   - [Testing Guide](TEST_REPORT.md)

## 🆘 Getting Help

- Run `make help` to see all available commands
- Check logs with `make logs`
- Open an issue on GitHub for bugs
- Join our Discord for community support

---

**Happy coding!** 🚀 Welcome to the Passport Buddy development team!