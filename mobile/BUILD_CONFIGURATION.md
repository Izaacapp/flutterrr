# Mobile App Build Configuration

This document explains how to build and run the Passport Buddy mobile app with proper environment configuration.

## Development Builds

### Running on iOS Simulator
```bash
flutter run --dart-define=API_URL=http://localhost:3000
```

### Running on Android Emulator
```bash
flutter run --dart-define=API_URL=http://10.0.2.2:3000
```

### Running on Physical Device
Find your computer's IP address on your local network:
- macOS: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig | findstr IPv4`
- Linux: `ip addr show | grep "inet " | grep -v 127.0.0.1`

Then run:
```bash
flutter run --dart-define=API_URL=http://YOUR_IP:3000
```

## Production Builds

### Android APK
```bash
flutter build apk \
  --dart-define=API_URL=https://api.yourdomain.com \
  --dart-define=PROD_API_URL=https://api.yourdomain.com \
  --release
```

### Android App Bundle (for Play Store)
```bash
flutter build appbundle \
  --dart-define=API_URL=https://api.yourdomain.com \
  --dart-define=PROD_API_URL=https://api.yourdomain.com \
  --release
```

### iOS Build (for App Store)
```bash
flutter build ios \
  --dart-define=API_URL=https://api.yourdomain.com \
  --dart-define=PROD_API_URL=https://api.yourdomain.com \
  --release
```

## Environment Variables

The app supports the following dart-define variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_URL` | Base API URL | None | Yes (for physical devices) |
| `GRAPHQL_URL` | GraphQL endpoint | `${API_URL}/graphql` | No |
| `WS_URL` | WebSocket endpoint | Auto-detected from GRAPHQL_URL | No |
| `PROD_API_URL` | Production API URL | None | No |
| `WEB_API_URL` | Web platform API URL | `http://localhost:3000/graphql` | No |
| `ANDROID_EMULATOR_API_URL` | Android emulator API URL | None | No |
| `IOS_SIMULATOR_API_URL` | iOS simulator API URL | None | No |
| `ENABLE_SIGNUP` | Enable signup feature | `true` | No |
| `ENABLE_EMAIL_VERIFICATION` | Enable email verification | `true` | No |
| `APP_NAME` | Application name | `Passport Buddy` | No |
| `API_TIMEOUT_SECONDS` | API timeout in seconds | `30` | No |
| `CONNECTION_TIMEOUT_SECONDS` | Connection timeout | `10` | No |

## Build Scripts

Create these helper scripts for common build scenarios:

### `scripts/run-dev-ios.sh`
```bash
#!/bin/bash
flutter run --dart-define=API_URL=http://localhost:3000
```

### `scripts/run-dev-android.sh`
```bash
#!/bin/bash
flutter run --dart-define=API_URL=http://10.0.2.2:3000
```

### `scripts/run-physical.sh`
```bash
#!/bin/bash
# Get local IP
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "Using IP: $IP"
flutter run --dart-define=API_URL=http://$IP:3000
```

### `scripts/build-production.sh`
```bash
#!/bin/bash
if [ -z "$PROD_API_URL" ]; then
  echo "Error: PROD_API_URL environment variable not set"
  exit 1
fi

echo "Building for production with API: $PROD_API_URL"

# Build Android APK
flutter build apk \
  --dart-define=API_URL=$PROD_API_URL \
  --dart-define=PROD_API_URL=$PROD_API_URL \
  --release

# Build iOS
flutter build ios \
  --dart-define=API_URL=$PROD_API_URL \
  --dart-define=PROD_API_URL=$PROD_API_URL \
  --release
```

## CI/CD Integration

For automated builds, set environment variables in your CI/CD pipeline:

### GitHub Actions Example
```yaml
- name: Build APK
  env:
    PROD_API_URL: ${{ secrets.PROD_API_URL }}
  run: |
    flutter build apk \
      --dart-define=API_URL=$PROD_API_URL \
      --dart-define=PROD_API_URL=$PROD_API_URL \
      --release
```

### Jenkins Example
```groovy
stage('Build Mobile App') {
    environment {
        PROD_API_URL = credentials('prod-api-url')
    }
    steps {
        sh '''
            flutter build apk \
              --dart-define=API_URL=$PROD_API_URL \
              --dart-define=PROD_API_URL=$PROD_API_URL \
              --release
        '''
    }
}
```

## Troubleshooting

### "API_URL must be provided" Error
This error occurs when running on a physical device without specifying the API URL. Always provide the API URL via dart-define.

### Connection Refused Errors
- Ensure your API server is running and accessible
- Check firewall settings allow connections on port 3000
- For physical devices, ensure your device and computer are on the same network

### SSL/HTTPS Issues in Development
If testing with a local HTTPS server with self-signed certificates:
1. Use HTTP for local development
2. Or configure your device to trust the certificate
3. Or use a tool like ngrok to create a secure tunnel

## Security Notes

- Never hardcode production API URLs in the source code
- Use environment variables or dart-define for all configuration
- Store sensitive values (API keys, secrets) in your CI/CD secrets manager
- Always use HTTPS in production builds