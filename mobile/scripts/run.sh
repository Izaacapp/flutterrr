#!/bin/bash
# mobile/run.sh
# Simple script to run Flutter with correct API endpoint

# Get local IP dynamically
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}')

echo "🚀 Flutter Smart Runner"
echo "======================"
echo ""

# Check if containers are running
if ! docker ps | grep -q "mern_flutter_api"; then
    echo "⚠️  Backend not running. Start with: make dev"
    echo ""
fi

# Detect device type
if flutter devices | grep -qi "simulator"; then
    echo "📱 iOS Simulator detected"
    echo "🔗 Using: http://localhost:3000/graphql"
    flutter run --dart-define=API_URL=http://localhost:3000/graphql
elif flutter devices | grep -qi "emulator"; then
    echo "📱 Android Emulator detected"
    echo "🔗 Using: http://10.0.2.2:3000/graphql"
    flutter run --dart-define=API_URL=http://10.0.2.2:3000/graphql
elif flutter devices | grep -qi "iphone\|ipad\|android" | grep -v "simulator\|emulator"; then
    echo "📱 Physical device detected"
    echo "🔗 Using: http://$LOCAL_IP:3000/graphql"
    flutter run --dart-define=API_URL=http://$LOCAL_IP:3000/graphql
else
    echo "No device detected. Options:"
    echo "1) iOS Simulator"
    echo "2) Android Emulator"
    echo "3) Physical Device (IP: $LOCAL_IP)"
    echo "4) Production API"
    
    read -p "Choose (1-4): " choice
    
    case $choice in
        1) flutter run --dart-define=API_URL=http://localhost:3000/graphql ;;
        2) flutter run --dart-define=API_URL=http://10.0.2.2:3000/graphql ;;
        3) flutter run --dart-define=API_URL=http://$LOCAL_IP:3000/graphql ;;
        4) flutter run --dart-define=API_URL=http://138.197.72.196:3000/graphql ;;
    esac
fi