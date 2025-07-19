#!/bin/bash
# mobile/run-dev.sh
# Development script that handles both containers and Flutter

echo "🚀 Flutter Development Runner"
echo "============================"

# Get local IP
HOST_IP=$(ipconfig getifaddr en0)
echo "🌐 Your local IP: $HOST_IP"

# Check if Docker containers are running
if ! docker ps | grep -q "mern_flutter_api"; then
    echo ""
    echo "⚠️  API container not running!"
    echo "Starting containers..."
    cd .. && make dev
    cd mobile
    
    # Wait for API to be ready
    echo "⏳ Waiting for API to start..."
    sleep 5
    
    # Check API health
    until curl -s http://localhost:3000/health > /dev/null 2>&1; do
        echo "Waiting for API..."
        sleep 2
    done
    echo "✅ API is ready!"
else
    echo "✅ Containers are running"
fi

# Detect connected devices
echo ""
echo "🔍 Detecting connected devices..."

IOS_PHYSICAL=$(flutter devices | grep -i "iphone\|ipad" | grep -v "simulator" | head -1)
ANDROID_PHYSICAL=$(flutter devices | grep -i "android" | grep -v "emulator" | head -1)
IOS_SIM=$(flutter devices | grep -i "simulator" | head -1)
ANDROID_EMU=$(flutter devices | grep -i "emulator" | head -1)

# Auto-detect and run
if [ -n "$IOS_PHYSICAL" ] || [ -n "$ANDROID_PHYSICAL" ]; then
    echo "📱 Physical device detected"
    echo "🔗 Using IP: $HOST_IP"
    flutter run --dart-define=API_URL=http://$HOST_IP:3000/graphql
elif [ -n "$IOS_SIM" ]; then
    echo "📱 iOS Simulator detected"
    echo "🔗 Using localhost"
    flutter run --dart-define=API_URL=http://localhost:3000/graphql
elif [ -n "$ANDROID_EMU" ]; then
    echo "📱 Android Emulator detected"
    echo "🔗 Using 10.0.2.2"
    flutter run --dart-define=API_URL=http://10.0.2.2:3000/graphql
else
    # No device detected, let user choose
    echo ""
    echo "No device detected. Choose your target:"
    echo "1) iOS Simulator (localhost)"
    echo "2) Android Emulator (10.0.2.2)"
    echo "3) Physical Device (IP: $HOST_IP)"
    echo "4) Production API (138.197.72.196)"
    
    read -p "Enter choice (1-4): " choice
    
    case $choice in
        1)
            flutter run --dart-define=API_URL=http://localhost:3000/graphql
            ;;
        2)
            flutter run --dart-define=API_URL=http://10.0.2.2:3000/graphql
            ;;
        3)
            flutter run --dart-define=API_URL=http://$HOST_IP:3000/graphql
            ;;
        4)
            flutter run --dart-define=API_URL=http://138.197.72.196:3000/graphql
            ;;
    esac
fi