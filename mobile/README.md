# Passport Buddy Mobile App

A cross-platform Flutter application for the Passport Buddy social travel platform, supporting iOS, Android, and web platforms.

## 🚀 Quick Start

```bash
# From the root directory
make mobile                    # Auto-detect device and run

# Or from mobile directory
cd mobile
flutter run --dart-define=API_URL=http://YOUR_IP:3000/graphql
```

## 📱 Features

### Core Functionality
- **User Authentication**: Login with email/username
- **Social Feed**: Browse and interact with travel posts
- **Create Posts**: Share travel experiences with images
- **User Profiles**: View and edit profile information
- **Comments**: Engage with other travelers
- **Real-time Updates**: Live feed updates via GraphQL subscriptions

### Platform Support
- ✅ iOS (iPhone & iPad)
- ✅ Android (Phones & Tablets)
- ✅ Web Browser
- ✅ macOS Desktop
- ✅ Windows Desktop
- ✅ Linux Desktop

## 🛠️ Development Setup

### Prerequisites

1. **Flutter SDK**: Version 3.0 or higher
   ```bash
   flutter --version
   ```

2. **Platform-specific requirements**:
   - **iOS**: Xcode 13+ (macOS only)
   - **Android**: Android Studio or Android SDK
   - **Web**: Chrome browser

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mern&flutter/mobile

# Get dependencies
flutter pub get

# Check Flutter setup
flutter doctor
```

## 🏃 Running the App

### Using Make Commands (Recommended)

From the project root directory:

```bash
# Auto-detect device
make mobile

# Specific platforms
make mobile-ios-simulator      # iOS Simulator
make mobile-ios-physical        # Physical iPhone
make mobile-android-emulator    # Android Emulator
make mobile-android-physical    # Physical Android
make mobile-browser             # Web browser
make mobile-macos               # macOS app
```

### Manual Flutter Commands

```bash
# List available devices
flutter devices

# Run on specific device
flutter run -d <device-id>

# With API configuration
flutter run --dart-define=API_URL=http://192.168.1.100:3000/graphql
```

### API URL Configuration

The app automatically configures API URLs based on the platform:

| Platform | Default API URL | Notes |
|----------|----------------|-------|
| iOS Simulator | `http://localhost:3000/graphql` | Uses localhost |
| Android Emulator | `http://10.0.2.2:3000/graphql` | Special Android IP |
| Physical Device | `http://YOUR_IP:3000/graphql` | Auto-detected |
| Web | `http://localhost:3000/graphql` | Uses localhost |

## 📁 Project Structure

```
mobile/
├── lib/
│   ├── main.dart                 # App entry point
│   ├── core/                     # Core utilities
│   │   ├── api/                  # API configuration
│   │   ├── config/               # App configuration
│   │   ├── theme/                # Theme definitions
│   │   └── utils/                # Utility functions
│   ├── features/                 # Feature modules
│   │   ├── auth/                 # Authentication
│   │   ├── feed/                 # Social feed
│   │   ├── posts/                # Post creation
│   │   └── profile/              # User profiles
│   ├── providers/                # State management
│   ├── services/                 # API services
│   └── widgets/                  # Shared widgets
├── assets/                       # Images, fonts, etc.
├── test/                         # Unit tests
├── android/                      # Android-specific code
├── ios/                          # iOS-specific code
├── web/                          # Web-specific code
└── pubspec.yaml                  # Dependencies
```

## 🔧 Configuration

### Environment Variables

Configure via `--dart-define`:

```bash
# Development
flutter run --dart-define=API_URL=http://localhost:3000/graphql

# Production
flutter build apk --dart-define=API_URL=https://api.passportbuddy.com/graphql
```

### Available Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | GraphQL endpoint | Platform-specific |
| `ENABLE_SIGNUP` | Enable registration | `true` |
| `ENABLE_EMAIL_VERIFICATION` | Require email verification | `true` |
| `APP_NAME` | Application name | `Passport Buddy` |

## 🏗️ Building for Release

### Android

```bash
# APK (for direct installation)
flutter build apk --release \
  --dart-define=API_URL=https://api.passportbuddy.com/graphql

# App Bundle (for Play Store)
flutter build appbundle --release \
  --dart-define=API_URL=https://api.passportbuddy.com/graphql
```

### iOS

```bash
# Build for App Store
flutter build ios --release \
  --dart-define=API_URL=https://api.passportbuddy.com/graphql

# Then open in Xcode
open ios/Runner.xcworkspace
```

### Web

```bash
# Build web app
flutter build web --release \
  --dart-define=API_URL=https://api.passportbuddy.com/graphql
```

## 🧪 Testing

### Run Tests

```bash
# All tests
flutter test

# With coverage
flutter test --coverage

# Specific test file
flutter test test/auth_test.dart
```

### Integration Tests

```bash
# Run integration tests
flutter test integration_test/app_test.dart
```

## 🐛 Troubleshooting

### Common Issues

**Connection Refused**
- Ensure backend is running: `make dev`
- Check your IP address: `make info`
- Verify firewall settings allow port 3000

**Build Errors**
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

**iOS Signing Issues**
- Open `ios/Runner.xcworkspace` in Xcode
- Select your development team
- Or use simulator: `make mobile-ios-simulator`

**Android NDK Issues**
```bash
# Update build.gradle.kts
android {
    ndkVersion = "27.0.12077973"
}
```

### Debug Tools

```bash
# Flutter doctor
flutter doctor -v

# Clean build cache
make mobile-clean

# Reset dependencies
make mobile-reset

# View device logs
flutter logs
```

## 📱 State Management

The app uses Provider for state management:

- **AuthProvider**: User authentication state
- **FeedProvider**: Social feed and posts
- **ProfileProvider**: User profile data

Example usage:
```dart
// Access auth state
final auth = context.watch<AuthProvider>();

// Call actions
await context.read<AuthProvider>().login(email, password);
```

## 🎨 Theming

The app supports light and dark themes:

```dart
// Theme is automatically applied based on system settings
ThemeData lightTheme = AppTheme.lightTheme;
ThemeData darkTheme = AppTheme.darkTheme;
```

## 🔗 API Integration

### GraphQL Queries
- User authentication
- Feed posts
- User profiles
- Comments

### REST Endpoints
- Image upload
- User registration
- Password reset

### Real-time Subscriptions
- Live feed updates
- New comments
- User status changes

## 🚀 Performance Tips

1. **Image Optimization**: Images are automatically compressed before upload
2. **Lazy Loading**: Feed implements infinite scroll
3. **Caching**: API responses are cached for offline support
4. **State Persistence**: User session persists across app restarts

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Run tests: `flutter test`
4. Submit a pull request

## 📚 Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Provider Package](https://pub.dev/packages/provider)
- [GraphQL Flutter](https://pub.dev/packages/graphql_flutter)
- [Main Project README](../README.md)