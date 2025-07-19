# Mobile Testing Guide

## Overview
This guide provides comprehensive instructions for testing the application across different mobile devices and platforms.

## Testing Environments

### 1. Mobile Web (Browser)
- **Chrome DevTools Device Mode**
- **Safari Responsive Design Mode**
- **Firefox Responsive Design Mode**

### 2. Physical Devices
- **iPhone** (iOS Safari)
- **Android** (Chrome Mobile)
- **Raspberry Pi** (Chromium)

## Quick Start

### Web Responsive Testing
```bash
# Start the web development server
cd web && npm run dev

# Run the responsive testing helper
node scripts/test-responsive.js
```

### Mobile App Testing
```bash
# iOS (iPhone)
cd mobile
flutter run -d iphone

# Android
flutter run -d android

# List available devices
flutter devices
```

## Device-Specific Testing

### iPhone Testing
1. **Connect iPhone via USB**
2. **Enable Developer Mode** (Settings > Privacy & Security > Developer Mode)
3. **Trust Computer** when prompted
4. **Run Flutter app**: `flutter run -d iphone`

### Android Testing
1. **Enable Developer Options** (Settings > About > Tap Build Number 7 times)
2. **Enable USB Debugging** (Developer Options > USB Debugging)
3. **Connect via USB**
4. **Run Flutter app**: `flutter run -d android`

### Raspberry Pi Testing
1. **Install Chromium**: `sudo apt install chromium-browser`
2. **Access web app**: Open `http://[your-local-ip]:5173`
3. **Test touch interactions** if touchscreen available

## Test Cases

### Critical User Flows
- [ ] User Registration
- [ ] Email Verification
- [ ] Login/Logout
- [ ] Create Post (with images)
- [ ] View Feed
- [ ] Like/Unlike Posts
- [ ] View Profile
- [ ] Edit Profile
- [ ] Search Users

### Responsive Design Checklist
- [ ] Navigation menu collapses properly
- [ ] Forms adapt to screen size
- [ ] Images scale without distortion
- [ ] Text remains readable
- [ ] No horizontal scrolling
- [ ] Touch targets ≥ 44x44px
- [ ] Modals fit viewport
- [ ] Keyboard doesn't cover inputs

### Performance Testing
- [ ] Page load time < 3s on 3G
- [ ] Smooth scrolling (60 fps)
- [ ] Images lazy load
- [ ] Minimal layout shifts
- [ ] Offline functionality

## Common Viewport Sizes

| Device | Width | Height |
|--------|-------|--------|
| iPhone SE | 375px | 667px |
| iPhone 12/13/14 | 390px | 844px |
| iPhone 14 Plus | 428px | 926px |
| Samsung Galaxy S21 | 360px | 800px |
| iPad Mini | 768px | 1024px |
| iPad Pro 11" | 834px | 1194px |

## Debugging Tips

### Chrome DevTools
1. Open DevTools (F12)
2. Toggle device mode (Ctrl+Shift+M)
3. Select device preset or custom size
4. Test touch events and gestures
5. Throttle network to test slow connections

### Safari Web Inspector
1. Enable Develop menu (Preferences > Advanced)
2. Connect iPhone
3. Develop > [Your iPhone] > [Website]
4. Debug directly on device

### Flutter Inspector
```bash
# Run with Flutter DevTools
flutter run --debug
# Press 'v' to open DevTools in browser
```

## Automated Testing

### Web E2E Tests
```bash
# Run Cypress tests with mobile viewports
cd web
npm run test:e2e:mobile
```

### Flutter Integration Tests
```bash
cd mobile
flutter test integration_test/app_test.dart
```

## Performance Benchmarks

### Target Metrics
- First Contentful Paint: < 1.8s
- Time to Interactive: < 3.9s
- Cumulative Layout Shift: < 0.1
- Largest Contentful Paint: < 2.5s

### Testing Tools
- Lighthouse (Chrome DevTools)
- WebPageTest
- Flutter Performance Profiler

## Troubleshooting

### Common Issues

**iPhone Won't Connect**
- Update to latest iOS
- Update Xcode
- Reset Location & Privacy settings
- Try different USB cable/port

**Android Debugging Not Working**
- Install Google USB Driver
- Enable Stay Awake in Developer Options
- Try `adb kill-server && adb start-server`

**Flutter Hot Reload Issues**
- Clean build: `flutter clean`
- Delete `.dart_tool` folder
- Restart IDE and devices

## CI/CD Integration

The Jenkins pipeline includes mobile testing stages:
1. Unit tests (Jest, Flutter test)
2. Integration tests
3. Build APK/IPA
4. Deploy to test devices
5. Run automated UI tests

See `Jenkinsfile` for full configuration.