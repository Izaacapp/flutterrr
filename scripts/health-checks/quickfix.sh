#!/bin/bash
# quickfix.sh - Fix immediate issues without major reorganization

echo "🔧 Quick Fixes for MERN & Flutter Monorepo"
echo "========================================="

# Fix 1: Update mobile GraphQL client to use correct endpoints
echo "1️⃣ Fixing mobile GraphQL endpoints..."
cat > mobile/lib/config/api_endpoints.dart << 'EOF'
class ApiEndpoints {
  // Production endpoint
  static const String production = 'http://138.197.72.196:3000/graphql';
  
  // Development endpoints by platform
  static const String webLocal = 'http://localhost:3000/graphql';
  static const String androidEmulator = 'http://10.0.2.2:3000/graphql';
  static const String iosSimulator = 'http://localhost:3000/graphql';
  
  // Get your local IP for physical devices
  static String getPhysicalDeviceUrl(String localIp) {
    return 'http://$localIp:3000/graphql';
  }
}
EOF

# Fix 2: Create a simple environment switcher for mobile
echo "2️⃣ Creating mobile environment config..."
cat > mobile/run-dev.sh << 'EOF'
#!/bin/bash
# Quick script to run mobile with correct API endpoint

echo "Select your development environment:"
echo "1) iOS Simulator"
echo "2) Android Emulator"  
echo "3) Physical Device"
echo "4) Production API"

read -p "Enter choice (1-4): " choice

case $choice in
  1)
    echo "Running for iOS Simulator..."
    flutter run --dart-define=API_URL=http://localhost:3000/graphql
    ;;
  2)
    echo "Running for Android Emulator..."
    flutter run --dart-define=API_URL=http://10.0.2.2:3000/graphql
    ;;
  3)
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}')
    echo "Running for physical device (IP: $LOCAL_IP)..."
    flutter run --dart-define=API_URL=http://$LOCAL_IP:3000/graphql
    ;;
  4)
    echo "Running with production API..."
    flutter run --dart-define=API_URL=http://138.197.72.196:3000/graphql
    ;;
esac
EOF
chmod +x mobile/run-dev.sh

# Fix 3: Add health check to API
echo "3️⃣ Adding health endpoint to API..."
echo "Add this to your API server.js or app.js:"
echo ""
cat << 'EOF'
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
EOF

# Fix 4: Create a status checker
echo "4️⃣ Creating status checker..."
cat > check-status.sh << 'EOF'
#!/bin/bash
echo "🏥 Checking Service Health..."
echo ""

# Local services
echo "LOCAL ENVIRONMENT:"
curl -s http://localhost:3000/health >/dev/null 2>&1 && echo "✅ API: Running" || echo "❌ API: Not running"
curl -s http://localhost:3001 >/dev/null 2>&1 && echo "✅ Web: Running" || echo "❌ Web: Not running"
nc -zv localhost 27017 >/dev/null 2>&1 && echo "✅ MongoDB: Running" || echo "❌ MongoDB: Not running"

echo ""
echo "PRODUCTION ENVIRONMENT:"
curl -s http://138.197.72.196:3000/health >/dev/null 2>&1 && echo "✅ API: Running" || echo "❌ API: Not running"
curl -s http://138.197.72.196:8080 >/dev/null 2>&1 && echo "✅ Web: Running" || echo "❌ Web: Not running"

echo ""
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}')
echo "📱 Your local IP for mobile testing: $LOCAL_IP"
EOF
chmod +x check-status.sh

# Fix 5: Update docker-compose for better networking
echo "5️⃣ Improving Docker networking..."
echo "Adding this to your docker-compose.yml will help:"
cat << 'EOF'

# Add this to the bottom of docker-compose.yml:
networks:
  default:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

# This gives predictable IPs to your services
EOF

# Fix 6: Quick command aliases
echo "6️⃣ Creating helpful aliases..."
cat > dev-commands.sh << 'EOF'
#!/bin/bash

# Source this file: source dev-commands.sh

# Docker shortcuts
alias dc='docker-compose'
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dclogs='docker-compose logs -f'
alias dcps='docker-compose ps'

# Quick service access
alias api-logs='docker-compose logs -f api'
alias web-logs='docker-compose logs -f web'
alias db-shell='docker-compose exec mongodb mongosh -u root -p pass'

# Mobile shortcuts
alias mobile-ios='cd mobile && flutter run --dart-define=API_URL=http://localhost:3000/graphql'
alias mobile-android='cd mobile && flutter run --dart-define=API_URL=http://10.0.2.2:3000/graphql'

# Status check
alias check='./check-status.sh'

echo "✅ Dev commands loaded!"
EOF

# Summary
echo ""
echo "✅ Quick fixes applied!"
echo ""
echo "🎯 What we fixed:"
echo "1. Mobile GraphQL endpoints - use mobile/run-dev.sh"
echo "2. Health check endpoints - add to your API"
echo "3. Status checker - run ./check-status.sh"
echo "4. Dev commands - source dev-commands.sh"
echo ""
echo "📱 To run mobile app:"
echo "   cd mobile && ./run-dev.sh"
echo ""
echo "🏥 To check status:"
echo "   ./check-status.sh"
echo ""
echo "⚡ For quick commands:"
echo "   source dev-commands.sh"
echo "   Then use: dcup, dclogs, check, etc."