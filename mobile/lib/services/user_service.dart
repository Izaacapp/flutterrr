import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api/api_config.dart';

class UserService {
  static Future<String> get baseUrl async {
    final endpoint = await ApiConfig.discoverEndpoint();
    return endpoint.replaceAll('/graphql', '');
  }

  static Future<String?> _getAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('passport_buddy_token');
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await _getAuthToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> blockUser(String userId) async {
    try {
      final headers = await _getHeaders();
      final apiUrl = await baseUrl;
      final url = '$apiUrl/api/users/block/$userId';
      
      final response = await http.post(
        Uri.parse(url),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to block user: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error blocking user: $e');
    }
  }

  static Future<Map<String, dynamic>> unblockUser(String userId) async {
    try {
      final headers = await _getHeaders();
      final apiUrl = await baseUrl;
      final url = '$apiUrl/api/users/block/$userId';
      
      final response = await http.delete(
        Uri.parse(url),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to unblock user: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error unblocking user: $e');
    }
  }

  static Future<Map<String, dynamic>> followUser(String userId) async {
    try {
      final headers = await _getHeaders();
      final apiUrl = await baseUrl;
      final url = '$apiUrl/api/users/follow/$userId';
      
      final response = await http.post(
        Uri.parse(url),
        headers: headers,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (response.body.isNotEmpty) {
          return json.decode(response.body);
        }
        return {'success': true};
      } else {
        throw Exception('Failed to follow user: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error following user: $e');
    }
  }

  static Future<Map<String, dynamic>> unfollowUser(String userId) async {
    try {
      final headers = await _getHeaders();
      final apiUrl = await baseUrl;
      final url = '$apiUrl/api/users/follow/$userId';
      
      final response = await http.delete(
        Uri.parse(url),
        headers: headers,
      );

      if (response.statusCode == 200 || response.statusCode == 204) {
        if (response.body.isNotEmpty) {
          return json.decode(response.body);
        }
        return {'success': true};
      } else {
        throw Exception('Failed to unfollow user: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error unfollowing user: $e');
    }
  }
}