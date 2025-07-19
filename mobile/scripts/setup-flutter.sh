#!/bin/bash
# Flutter Setup Script for Development

echo "🚀 Setting up Flutter for development..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get host IP
if [[ "$OSTYPE" == "darwin"* ]]; then
    HOST_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo "localhost")
else
    HOST_IP=$(hostname -I | awk '{print $1}' || echo "localhost")
fi

echo -e "${YELLOW}Host IP detected: $HOST_IP${NC}"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
flutter clean
rm -rf ios/Pods
rm -rf ios/Podfile.lock

# Get dependencies
echo "📦 Getting dependencies..."
flutter pub get

# iOS specific setup
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Setting up iOS..."
    cd ios
    pod install
    cd ..
    
    # Update Info.plist to allow local network connections
    echo "📝 Configuring iOS for local development..."
    /usr/libexec/PlistBuddy -c "Set :NSAppTransportSecurity:NSAllowsArbitraryLoads true" ios/Runner/Info.plist 2>/dev/null || true
fi

# Create launch configuration
echo "📝 Creating launch configuration..."
cat > lib/config/app_config.dart << EOF
class AppConfig {
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:3000/graphql',
  );
  
  static void printConfig() {
    print('🔧 App Configuration:');
    print('API URL: \$apiUrl');
  }
}
EOF

echo -e "${GREEN}✅ Flutter setup complete!${NC}"
echo ""
echo "To run the app:"
echo "  • iOS Simulator:    flutter run --dart-define=API_URL=http://localhost:3000/graphql"
echo "  • Physical iPhone:  flutter run --dart-define=API_URL=http://$HOST_IP:3000/graphql"
echo "  • Android Emulator: flutter run --dart-define=API_URL=http://10.0.2.2:3000/graphql"
echo "  • Physical Android: flutter run --dart-define=API_URL=http://$HOST_IP:3000/graphql"
echo ""
echo "Or use the convenience scripts:"
echo "  • ./scripts/run-ios.sh"
echo "  • ./scripts/run-android.sh"