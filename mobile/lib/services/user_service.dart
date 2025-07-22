import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/api/api_config.dart';

class UserService {

  static Future<Map<String, dynamic>?> getUserProfile(String userId) async {
    try {
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/v1/users/$userId'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        print('Failed to load user profile: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('Error fetching user profile: $e');
      return null;
    }
  }

  static Future<bool> updateUserProfile(String userId, Map<String, dynamic> updates) async {
    try {
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');
      
      final response = await http.put(
        Uri.parse('$baseUrl/api/v1/users/$userId'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode(updates),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error updating user profile: $e');
      return false;
    }
  }

  static Future<List<Map<String, dynamic>>> searchUsers(String query) async {
    try {
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/v1/users/search?q=$query'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        print('Failed to search users: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('Error searching users: $e');
      return [];
    }
  }

  static Future<bool> followUser(String userId) async {
    try {
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/users/$userId/follow'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error following user: $e');
      return false;
    }
  }

  static Future<bool> unfollowUser(String userId) async {
    try {
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');
      
      final response = await http.delete(
        Uri.parse('$baseUrl/api/v1/users/$userId/follow'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error unfollowing user: $e');
      return false;
    }
  }

  static Future<bool> blockUser(String userId) async {
    try {
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/users/$userId/block'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error blocking user: $e');
      return false;
    }
  }

  static Future<bool> unblockUser(String userId) async {
    try {
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');
      
      final response = await http.delete(
        Uri.parse('$baseUrl/api/v1/users/$userId/block'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error unblocking user: $e');
      return false;
    }
  }
}