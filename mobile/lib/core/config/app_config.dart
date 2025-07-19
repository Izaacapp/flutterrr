import 'package:flutter/foundation.dart';

class AppConfig {
  // API Configuration
  static String get apiUrl {
    const envValue = String.fromEnvironment('API_URL');
    if (envValue.isNotEmpty) return envValue;
    
    // Only use defaults if no environment variable is provided
    return kDebugMode 
      ? 'http://localhost:3000' 
      : throw Exception('API_URL environment variable must be set in production');
  }
  
  static String get graphqlUrl {
    const envValue = String.fromEnvironment('GRAPHQL_URL');
    if (envValue.isNotEmpty) return envValue;
    
    // Default to apiUrl/graphql if not specified
    return '$apiUrl/graphql';
  }
  
  static String get wsUrl {
    const envValue = String.fromEnvironment('WS_URL');
    if (envValue.isNotEmpty) return envValue;
    
    // Convert HTTP URL to WebSocket URL
    final httpUrl = graphqlUrl;
    if (httpUrl.startsWith('https://')) {
      return httpUrl.replaceFirst('https://', 'wss://');
    } else if (httpUrl.startsWith('http://')) {
      return httpUrl.replaceFirst('http://', 'ws://');
    }
    return kDebugMode 
      ? 'ws://localhost:3000/graphql' 
      : throw Exception('WS_URL environment variable must be set in production');
  }
  
  // Feature Flags
  static bool get enableSignup => const bool.fromEnvironment(
    'ENABLE_SIGNUP',
    defaultValue: true
  );
  
  static bool get enableEmailVerification => const bool.fromEnvironment(
    'ENABLE_EMAIL_VERIFICATION',
    defaultValue: true
  );
  
  // App Info
  static String get appName => const String.fromEnvironment(
    'APP_NAME',
    defaultValue: 'Passport Buddy'
  );
  
  // Timeouts
  static Duration get apiTimeout => Duration(
    seconds: int.fromEnvironment(
      'API_TIMEOUT_SECONDS',
      defaultValue: 30
    )
  );
  
  static Duration get connectionTimeout => Duration(
    seconds: int.fromEnvironment(
      'CONNECTION_TIMEOUT_SECONDS',
      defaultValue: 10
    )
  );
}