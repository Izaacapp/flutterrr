import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../models/flight_model.dart';
import '../core/api/api_config.dart';
import '../services/auth_service.dart';

class FlightService {
  final AuthService _authService = AuthService();

  Future<Map<String, String>> _getHeaders() async {
    final token = _authService.token;
    return {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    };
  }

  Future<Map<String, String>> _getMultipartHeaders() async {
    final token = _authService.token;
    return {
      'Authorization': 'Bearer $token',
    };
  }

  Future<List<Flight>> getMyFlights({String? status}) async {
    try {
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');
      
      String url = '$baseUrl/api/flights/my-flights';
      if (status != null) {
        url += '?status=$status';
      }
      
      print('Fetching flights from: $url');

      final response = await http.get(
        Uri.parse(url),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        final List<dynamic> flightsJson = data['flights'] ?? [];
        return flightsJson.map((json) => Flight.fromJson(json)).toList();
      } else {
        print('Failed to load flights: ${response.statusCode}');
        print('Response body: ${response.body}');
        throw Exception('Failed to load flights: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching flights: $e');
      throw e;
    }
  }

  Future<Flight> getFlightById(String flightId) async {
    try {
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/flights/$flightId'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        return Flight.fromJson(data['flight']);
      } else {
        throw Exception('Failed to load flight');
      }
    } catch (e) {
      print('Error fetching flight: $e');
      throw e;
    }
  }

  Future<Flight> createFlight(Map<String, dynamic> flightData) async {
    try {
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/flights/manual-entry'),
        headers: await _getHeaders(),
        body: json.encode(flightData),
      );

      if (response.statusCode == 201) {
        final Map<String, dynamic> data = json.decode(response.body);
        return Flight.fromJson(data['flight']);
      } else {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Failed to create flight');
      }
    } catch (e) {
      print('Error creating flight: $e');
      throw e;
    }
  }

  Future<Flight> uploadBoardingPass(File boardingPass) async {
    try {
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');
      
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/api/flights/upload-boarding-pass'),
      );

      // Add headers
      request.headers.addAll(await _getMultipartHeaders());

      // Add file
      String mimeType = 'image/jpeg';
      if (boardingPass.path.toLowerCase().endsWith('.pdf')) {
        mimeType = 'application/pdf';
      } else if (boardingPass.path.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
      }

      request.files.add(
        await http.MultipartFile.fromPath(
          'boardingPass',
          boardingPass.path,
          contentType: MediaType.parse(mimeType),
        ),
      );

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 201) {
        final Map<String, dynamic> data = json.decode(response.body);
        return Flight.fromJson(data['flight']);
      } else {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Failed to upload boarding pass');
      }
    } catch (e) {
      print('Error uploading boarding pass: $e');
      throw e;
    }
  }

  Future<Flight> updateFlight(String flightId, Map<String, dynamic> updates) async {
    try {
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');
      
      final response = await http.put(
        Uri.parse('$baseUrl/api/flights/$flightId'),
        headers: await _getHeaders(),
        body: json.encode(updates),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        return Flight.fromJson(data['flight']);
      } else {
        throw Exception('Failed to update flight');
      }
    } catch (e) {
      print('Error updating flight: $e');
      throw e;
    }
  }

  Future<void> deleteFlight(String flightId) async {
    try {
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');
      
      final response = await http.delete(
        Uri.parse('$baseUrl/api/flights/$flightId'),
        headers: await _getHeaders(),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to delete flight');
      }
    } catch (e) {
      print('Error deleting flight: $e');
      throw e;
    }
  }

  Future<Map<String, dynamic>> getFlightStats() async {
    try {
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/flights/stats'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load flight stats');
      }
    } catch (e) {
      print('Error fetching flight stats: $e');
      throw e;
    }
  }
}