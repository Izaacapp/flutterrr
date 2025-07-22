// lib/core/api/api_config.dart
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

class ApiConfig {
  static String get prodApi =>
      dotenv.env['PROD_API_URL'] ??
      const String.fromEnvironment('PROD_API_URL', defaultValue: '');
  static const Duration timeout = Duration(seconds: 2);

  // Cache the discovered endpoint
  static String? _cachedEndpoint;
  static DateTime? _cacheTime;
  static const Duration _cacheValidity = Duration(minutes: 5);

  // Check if we're on a simulator
  static bool get isSimulator {
    if (kIsWeb) return false;

    // Check for iOS simulator
    if (Platform.isIOS) {
      final isSimulator =
          Platform.environment['SIMULATOR_DEVICE_NAME'] != null ||
              Platform.environment['SIMULATOR_RUNTIME'] != null;
      return isSimulator;
    }

    // Check for Android emulator
    if (Platform.isAndroid) {
      return Platform.environment['ANDROID_EMULATOR'] != null;
    }

    return false;
  }

  // Try to find the API endpoint
  static Future<String> discoverEndpoint() async {
    // Check cache first
    if (_cachedEndpoint != null &&
        _cacheTime != null &&
        DateTime.now().difference(_cacheTime!) < _cacheValidity) {
      print('📱 Using cached endpoint: $_cachedEndpoint');
      return _cachedEndpoint!;
    }

    // 1. Check for dart-define override (THIS IS HOW WE PASS THE IP!)
    const String dartDefineUrl =
        String.fromEnvironment('API_URL', defaultValue: '');
    if (dartDefineUrl.isNotEmpty) {
      print('🔗 Using dart-define API: $dartDefineUrl');
      _cacheEndpoint(dartDefineUrl);
      return dartDefineUrl;
    }

    // 2. If in release mode, use production
    if (!kDebugMode) {
      print('🚀 Release mode - using production API');
      final prodUrl = '$prodApi/graphql';
      _cacheEndpoint(prodUrl);
      return prodUrl;
    }

    // 3. For web/simulator/emulator, use platform-specific localhost
    if (kIsWeb) {
      print('🌐 Web platform - using localhost');
      const webUrl = String.fromEnvironment('WEB_API_URL',
          defaultValue: 'http://localhost:3000/graphql');
      _cacheEndpoint(webUrl);
      return webUrl;
    }

    if (isSimulator) {
      String localUrl;
      if (Platform.isAndroid) {
        // Android emulator special IP
        localUrl = dotenv.env['ANDROID_EMULATOR_API_URL'] ??
            const String.fromEnvironment('ANDROID_EMULATOR_API_URL',
                defaultValue: '');
      } else {
        // iOS simulator can use localhost
        localUrl = dotenv.env['IOS_SIMULATOR_API_URL'] ??
            const String.fromEnvironment('IOS_SIMULATOR_API_URL',
                defaultValue: '');
      }

      print('📱 Simulator/Emulator detected - using $localUrl');
      _cacheEndpoint(localUrl);
      return localUrl;
    }

    // 4. For physical devices, we REQUIRE dart-define
    // No hardcoded IPs, no network scanning
    print('📱 Physical device detected');
    print('⚠️  No API_URL provided via dart-define');
    print(
        '💡 Run with: flutter run --dart-define=API_URL=http://YOUR_IP:3000/graphql');

    // If PROD_API_URL is set, use it
    if (prodApi.isNotEmpty) {
      print('📡 Using production API');
      final prodUrl = '$prodApi/graphql';
      _cacheEndpoint(prodUrl);
      return prodUrl;
    }

    // Otherwise throw error
    throw Exception(
        'API_URL must be provided via dart-define for physical devices');
  }

  // Test if an endpoint is reachable
  static Future<bool> _testEndpoint(String url) async {
    try {
      print('🔍 Testing $url...');
      final response = await http.get(Uri.parse(url)).timeout(timeout);
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Cache the discovered endpoint
  static void _cacheEndpoint(String endpoint) {
    _cachedEndpoint = endpoint;
    _cacheTime = DateTime.now();
  }

  // Get base API URL (without /graphql)
  static Future<String> getBaseApiUrl() async {
    final graphqlEndpoint = await discoverEndpoint();
    // Remove /graphql suffix if present
    if (graphqlEndpoint.endsWith('/graphql')) {
      return graphqlEndpoint.substring(0, graphqlEndpoint.length - 8);
    }
    return graphqlEndpoint;
  }

  // Clear cache (useful for testing)
  static void clearCache() {
    _cachedEndpoint = null;
    _cacheTime = null;
  }
}
