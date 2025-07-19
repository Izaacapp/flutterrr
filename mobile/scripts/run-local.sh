#!/bin/bash
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}')
echo "🚀 Starting Flutter with API at $LOCAL_IP:3000"
flutter run --dart-define=API_URL=http://$LOCAL_IP:3000/graphql
