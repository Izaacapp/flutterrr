class ApiConfig {
  static const String _devUrl = 'http://localhost:3000';
  static const String _prodUrl = 'https://www.xbullet.me';
  
  static const bool isProduction = bool.fromEnvironment('dart.vm.product');
  
  static String get baseUrl => isProduction ? _prodUrl : _devUrl;
  
  // API endpoints
  static const String authEndpoint = '/api/v1/auth';
  static const String flightsEndpoint = '/api/v1/flights';
  static const String usersEndpoint = '/api/v1/users';
  static const String postsEndpoint = '/api/v1/posts';
  
  // GraphQL endpoint
  static String get graphqlEndpoint => '$baseUrl/graphql';
  
  // WebSocket endpoint
  static String get wsEndpoint => baseUrl.replaceFirst('http', 'ws') + '/graphql';
  
  // Service discovery methods
  static Future<String> discoverEndpoint([String? service]) async {
    // If no service specified, return GraphQL endpoint
    if (service == null) {
      return graphqlEndpoint;
    }
    // Simple implementation for service discovery
    return '$baseUrl/api/v1/$service';
  }
  
  static void clearCache() {
    // Clear any cached endpoint data
    // Implementation can be added later for caching
  }
}