// lib/core/api/graphql_client.dart
import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'api_config.dart';  // ← ADD THIS IMPORT

// DELETE THE ENTIRE ApiConfig CLASS FROM THIS FILE!
// (lines ~6-35 that define class ApiConfig)

// Keep everything below this line
ValueNotifier<GraphQLClient>? _graphQLClient;
bool _isInitializing = false;

// Make this async to use the smart discovery
Future<ValueNotifier<GraphQLClient>> getGraphQLClient() async {
  if (_graphQLClient != null) {
    return _graphQLClient!;
  }
  
  if (_isInitializing) {
    while (_graphQLClient == null) {
      await Future.delayed(const Duration(milliseconds: 100));
    }
    return _graphQLClient!;
  }
  
  _isInitializing = true;
  
  try {
    // Use the smart discovery from api_config.dart
    final endpoint = await ApiConfig.discoverEndpoint();
    print('🔗 Using GraphQL endpoint: $endpoint');
    
    final HttpLink httpLink = HttpLink(
      endpoint,
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
      httpClient: http.Client(),
    );
    
    final authLink = AuthLink(
      getToken: () async {
        // Get token from SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('passport_buddy_token');
        print('🔐 Auth token: ${token != null ? 'Found' : 'Not found'}');
        return token != null ? 'Bearer $token' : null;
      },
    );
    
    final Link link = authLink.concat(httpLink);
    
    _graphQLClient = ValueNotifier(
      GraphQLClient(
        link: link,
        cache: GraphQLCache(store: HiveStore()),
        defaultPolicies: DefaultPolicies(
          watchQuery: Policies(
            fetch: FetchPolicy.cacheAndNetwork,
          ),
          query: Policies(
            fetch: FetchPolicy.networkOnly,
          ),
        ),
      ),
    );
    
    return _graphQLClient!;
  } finally {
    _isInitializing = false;
  }
}

void resetGraphQLClient() {
  _graphQLClient = null;
  ApiConfig.clearCache();
}

Future<bool> checkApiHealth() async {
  try {
    final endpoint = await ApiConfig.discoverEndpoint();
    final healthUrl = endpoint.replaceAll('/graphql', '/health');
    final response = await http.get(Uri.parse(healthUrl));
    return response.statusCode == 200;
  } catch (e) {
    print('❌ API health check failed: $e');
    return false;
  }
}