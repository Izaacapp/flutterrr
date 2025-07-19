#!/bin/bash
# setup-mobile-dev.sh
# Smart setup script that configures based on developer's platform

echo "🔍 Detecting development environment..."

# Detect OS
OS="Unknown"
PLATFORM="Unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
    PLATFORM="ios"
    echo "✅ Detected macOS - Configuring for iOS development"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
    PLATFORM="android"
    echo "✅ Detected Linux - Configuring for Android development"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="Windows"
    PLATFORM="android"
    echo "✅ Detected Windows - Configuring for Android development"
fi

# Check what's actually installed
HAS_XCODE=false
HAS_ANDROID_SDK=false
HAS_FLUTTER=false

if command -v flutter &> /dev/null; then
    HAS_FLUTTER=true
    FLUTTER_VERSION=$(flutter --version | grep "Flutter" | awk '{print $2}')
    echo "📦 Flutter $FLUTTER_VERSION found"
fi

if command -v xcodebuild &> /dev/null; then
    HAS_XCODE=true
    XCODE_VERSION=$(xcodebuild -version | head -1)
    echo "📦 $XCODE_VERSION found"
fi

if [ -n "$ANDROID_HOME" ] || [ -n "$ANDROID_SDK_ROOT" ]; then
    HAS_ANDROID_SDK=true
    echo "📦 Android SDK found"
fi

# Configure Flutter based on what's available
echo ""
echo "🔧 Configuring Flutter for your environment..."

cd mobile 2>/dev/null || { echo "❌ mobile directory not found"; exit 1; }

if [ "$HAS_FLUTTER" = true ]; then
    # Platform-specific Flutter configuration
    if [ "$OS" = "macOS" ] && [ "$HAS_XCODE" = true ]; then
        echo "Configuring Flutter for iOS development..."
        flutter config --enable-ios
        flutter config --enable-macos-desktop
        
        # Only disable Android if no SDK found
        if [ "$HAS_ANDROID_SDK" = false ]; then
            flutter config --no-enable-android
        fi
    elif [ "$HAS_ANDROID_SDK" = true ]; then
        echo "Configuring Flutter for Android development..."
        flutter config --enable-android
        flutter config --no-enable-ios
    fi
    
    # Disable unused platforms
    flutter config --no-enable-web
    flutter config --no-enable-linux-desktop
    flutter config --no-enable-windows-desktop
    flutter config --no-enable-fuchsia
    
    # Run doctor to verify
    flutter doctor -v
else
    echo "⚠️ Flutter not found. Please install Flutter first."
    echo "Visit: https://flutter.dev/docs/get-started/install"
    exit 1
fi

# Create platform-specific test structure
echo ""
echo "📁 Setting up platform-specific test structure..."

# Common directories
mkdir -p test/unit
mkdir -p test/widgets
mkdir -p integration_test
mkdir -p lib/config

# Platform-specific directories
if [ "$PLATFORM" = "ios" ]; then
    mkdir -p test/ios_widgets
    mkdir -p ios/Tests
    
    # Create iOS test template
    cat > test/ios_widgets/cupertino_test.dart << 'EOF'
@Tags(['ios'])
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/cupertino.dart';

void main() {
  group('iOS Widget Tests', () {
    testWidgets('CupertinoApp renders', (WidgetTester tester) async {
      await tester.pumpWidget(const CupertinoApp(
        home: CupertinoPageScaffold(
          child: Center(child: Text('iOS Test')),
        ),
      ));
      
      expect(find.text('iOS Test'), findsOneWidget);
    });
  });
}
EOF

elif [ "$PLATFORM" = "android" ]; then
    mkdir -p test/android_widgets
    mkdir -p android/app/src/test
    
    # Create Android test template
    cat > test/android_widgets/material_test.dart << 'EOF'
@Tags(['android'])
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';

void main() {
  group('Android Widget Tests', () {
    testWidgets('MaterialApp renders', (WidgetTester tester) async {
      await tester.pumpWidget(const MaterialApp(
        home: Scaffold(
          body: Center(child: Text('Android Test')),
        ),
      ));
      
      expect(find.text('Android Test'), findsOneWidget);
    });
  });
}
EOF
fi

# Create environment config
cat > lib/config/environment.dart << 'EOF'
class Environment {
  static const String platform = String.fromEnvironment(
    'BUILD_TYPE',
    defaultValue: 'development',
  );
  
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:5000/api',
  );
  
  static const String jenkinsUrl = 'http://138.197.72.196:8080';
  static const String webUrl = 'http://138.197.72.196:8080';
  
  static bool get isIOS => platform.contains('ios');
  static bool get isAndroid => platform.contains('android');
  static bool get isDevelopment => platform.contains('dev');
}
EOF

# Create git hooks
echo ""
echo "🪝 Installing git hooks..."

# Platform-aware pre-commit hook
cat > ../.git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Running pre-commit checks..."

# Detect which platform files changed
ios_changes=$(git diff --cached --name-only | grep -E "(ios/|\.swift$|\.m$)" || true)
android_changes=$(git diff --cached --name-only | grep -E "(android/|\.java$|\.kt$|gradle)" || true)
dart_changes=$(git diff --cached --name-only | grep "\.dart$" || true)

if [ -n "$dart_changes" ]; then
    echo "📱 Flutter changes detected..."
    cd mobile
    
    # Format check
    flutter format --set-exit-if-changed .
    if [ $? -ne 0 ]; then
        echo "❌ Fix formatting with: flutter format ."
        exit 1
    fi
    
    # Analyze
    flutter analyze --no-fatal-infos
    if [ $? -ne 0 ]; then
        echo "❌ Fix analysis issues"
        exit 1
    fi
    
    # Run platform-specific tests
    if [ -n "$ios_changes" ]; then
        echo "Running iOS tests..."
        flutter test --tags=ios
    fi
    
    if [ -n "$android_changes" ]; then
        echo "Running Android tests..."
        flutter test --tags=android
    fi
    
    cd ..
fi

echo "✅ Pre-commit checks passed!"
EOF

chmod +x ../.git/hooks/pre-commit

# Create local development helper
cat > ../dev.sh << 'EOF'
#!/bin/bash
# Development helper script

case "$1" in
    test-ios)
        cd mobile && flutter test --tags=ios
        ;;
    test-android)
        cd mobile && flutter test --tags=android
        ;;
    test-all)
        cd mobile && flutter test
        ;;
    build-ios)
        cd mobile && flutter build ios --release --no-codesign
        ;;
    build-android)
        cd mobile && flutter build apk --release
        ;;
    check-api)
        curl -s http://138.197.72.196:5000/api/health || echo "API is down"
        ;;
    *)
        echo "Usage: ./dev.sh {test-ios|test-android|test-all|build-ios|build-android|check-api}"
        ;;
esac
EOF

chmod +x ../dev.sh

# Final summary
echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Your configuration:"
echo "  Platform: $PLATFORM"
echo "  OS: $OS"
[ "$HAS_XCODE" = true ] && echo "  Xcode: ✓"
[ "$HAS_ANDROID_SDK" = true ] && echo "  Android SDK: ✓"
echo ""
echo "🚀 Quick commands:"
echo "  ./dev.sh test-$PLATFORM    - Run platform tests"
echo "  ./dev.sh build-$PLATFORM   - Build for your platform"
echo "  ./dev.sh check-api         - Check if Jenkins API is up"
echo ""
echo "📝 GitHub Actions will:"
echo "  - Only build iOS when iOS files change (on macOS runners)"
echo "  - Only build Android when Android files change (on Linux runners)"
echo "  - Run shared tests for all Dart changes"
echo "  - Check against your Jenkins API at 138.197.72.196"