import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../features/auth/data/models/flight.dart';
import '../core/api/api_config.dart';

class FlightService {
  final Dio _dio = Dio();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  FlightService() {
    _dio.options.baseUrl = ApiConfig.baseUrl;
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  // Upload boarding pass image
  Future<Flight?> uploadBoardingPass(File imageFile) async {
    try {
      final formData = FormData.fromMap({
        'boardingPass': await MultipartFile.fromFile(
          imageFile.path,
          filename: 'boarding_pass.jpg',
        ),
      });

      final response = await _dio.post(
        '/api/v1/flights/upload-boarding-pass',
        data: formData,
      );

      if (response.statusCode == 200 && response.data['flight'] != null) {
        return Flight.fromJson(response.data['flight']);
      }
      return null;
    } catch (e) {
      print('Error uploading boarding pass: $e');
      return null;
    }
  }

  // Create manual flight entry
  Future<Flight?> createManualFlight(Map<String, dynamic> flightData) async {
    try {
      final response = await _dio.post(
        '/api/v1/flights/manual-entry',
        data: flightData,
      );

      if (response.statusCode == 201) {
        return Flight.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error creating manual flight: $e');
      return null;
    }
  }

  // Get user's flights
  Future<List<Flight>> getMyFlights({
    FlightStatus? status,
    String? airline,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
        'offset': offset,
      };
      
      if (status != null) {
        queryParams['status'] = status.toString().split('.').last;
      }
      if (airline != null) {
        queryParams['airline'] = airline;
      }

      final response = await _dio.get(
        '/api/v1/flights/my-flights',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final List<dynamic> flightsJson = response.data['flights'];
        return flightsJson.map((json) => Flight.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error getting flights: $e');
      return [];
    }
  }

  // Get flight by ID
  Future<Flight?> getFlightById(String flightId) async {
    try {
      final response = await _dio.get('/api/v1/flights/$flightId');

      if (response.statusCode == 200) {
        return Flight.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error getting flight: $e');
      return null;
    }
  }

  // Update flight
  Future<Flight?> updateFlight(String flightId, Map<String, dynamic> updates) async {
    try {
      final response = await _dio.put(
        '/api/v1/flights/$flightId',
        data: updates,
      );

      if (response.statusCode == 200) {
        return Flight.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error updating flight: $e');
      return null;
    }
  }

  // Delete flight
  Future<bool> deleteFlight(String flightId) async {
    try {
      final response = await _dio.delete('/api/v1/flights/$flightId');
      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting flight: $e');
      return false;
    }
  }

  // Get flight statistics
  Future<FlightStats?> getFlightStats({int? year}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (year != null) {
        queryParams['year'] = year;
      }

      final response = await _dio.get(
        '/api/v1/flights/stats',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        return FlightStats.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error getting flight stats: $e');
      return null;
    }
  }

  // Helper method to group flights by date
  Map<DateTime, List<Flight>> groupFlightsByDate(List<Flight> flights) {
    final grouped = <DateTime, List<Flight>>{};
    
    for (final flight in flights) {
      final date = DateTime(
        flight.scheduledDepartureTime.year,
        flight.scheduledDepartureTime.month,
        flight.scheduledDepartureTime.day,
      );
      
      if (grouped.containsKey(date)) {
        grouped[date]!.add(flight);
      } else {
        grouped[date] = [flight];
      }
    }
    
    // Sort flights within each date by departure time
    grouped.forEach((date, flightList) {
      flightList.sort((a, b) => 
        a.scheduledDepartureTime.compareTo(b.scheduledDepartureTime));
    });
    
    return grouped;
  }

  // Helper method to get upcoming flights
  Future<List<Flight>> getUpcomingFlights() async {
    return getMyFlights(status: FlightStatus.upcoming);
  }

  // Helper method to get completed flights
  Future<List<Flight>> getCompletedFlights() async {
    return getMyFlights(status: FlightStatus.completed);
  }
}