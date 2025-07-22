import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api/api_config.dart';

class PostService {
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

  static Future<Map<String, dynamic>> toggleLike(String postId) async {
    try {
      final headers = await _getHeaders();
      final apiUrl = await baseUrl;
      final url = '$apiUrl/api/posts/$postId/like';
      
      final response = await http.post(
        Uri.parse(url),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to toggle like: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      throw Exception('Error toggling like: $e');
    }
  }
  
  static Future<Map<String, dynamic>> deletePost(String postId) async {
    try {
      final headers = await _getHeaders();
      final apiUrl = await baseUrl;
      final url = '$apiUrl/api/posts/$postId';
      
      final response = await http.delete(
        Uri.parse(url),
        headers: headers,
      );

      if (response.statusCode == 200 || response.statusCode == 204) {
        // Some APIs return 204 No Content for successful deletes
        if (response.body.isNotEmpty) {
          return json.decode(response.body);
        } else {
          return {'status': 'success', 'message': 'Post deleted'};
        }
      } else {
        throw Exception('Failed to delete post: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error deleting post: $e');
    }
  }
}