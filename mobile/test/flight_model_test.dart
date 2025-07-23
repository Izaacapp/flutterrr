import 'package:flutter_test/flutter_test.dart';
import '../lib/features/auth/data/models/flight.dart';
import '../lib/services/flight_service.dart';
import '../lib/core/api/api_config.dart';

void main() {
  group('Flight Data Sync Tests', () {
    test('Flight model can be created and serialized', () {
      // Create a sample airport location
      final originAirport = AirportLocation(
        airportCode: 'LAX',
        airportName: 'Los Angeles International Airport',
        city: 'Los Angeles',
        country: 'United States',
        terminal: '7',
        gate: 'A23',
      );

      final destinationAirport = AirportLocation(
        airportCode: 'JFK',
        airportName: 'John F. Kennedy International Airport',
        city: 'New York',
        country: 'United States',
        terminal: '4',
        gate: 'B12',
      );

      // Create a sample flight
      final flight = Flight(
        userId: 'user123',
        airline: 'American Airlines',
        airlineCode: 'AA',
        flightNumber: 'AA123',
        confirmationCode: 'ABC123',
        origin: originAirport,
        destination: destinationAirport,
        scheduledDepartureTime: DateTime.parse('2024-01-15T14:30:00Z'),
        scheduledArrivalTime: DateTime.parse('2024-01-15T18:45:00Z'),
        seatNumber: '12A',
        status: FlightStatus.upcoming,
        distance: 2475,
        duration: 315, // 5h 15m
      );

      // Test serialization
      final json = flight.toJson();
      expect(json['flightNumber'], equals('AA123'));
      expect(json['airline'], equals('American Airlines'));
      expect((json['origin'] as Map<String, dynamic>)['airportCode'], equals('LAX'));
      expect((json['destination'] as Map<String, dynamic>)['airportCode'], equals('JFK'));

      // Test deserialization
      final deserializedFlight = Flight.fromJson(json);
      expect(deserializedFlight.flightNumber, equals(flight.flightNumber));
      expect(deserializedFlight.airline, equals(flight.airline));
      expect(deserializedFlight.origin.airportCode, equals(flight.origin.airportCode));
      expect(deserializedFlight.destination.airportCode, equals(flight.destination.airportCode));
    });

    test('Flight helper methods work correctly', () {
      final flight = Flight(
        userId: 'user123',
        airline: 'Delta',
        flightNumber: 'DL456',
        confirmationCode: 'DEF456',
        origin: AirportLocation(
          airportCode: 'SFO',
          city: 'San Francisco',
          country: 'United States',
        ),
        destination: AirportLocation(
          airportCode: 'SEA',
          city: 'Seattle',
          country: 'United States',
        ),
        scheduledDepartureTime: DateTime.parse('2024-01-15T09:15:00Z'),
        scheduledArrivalTime: DateTime.parse('2024-01-15T11:45:00Z'),
        seatNumber: '8C',
        status: FlightStatus.completed,
        duration: 150, // 2h 30m
        classOfService: ClassOfService.business,
      );

      // Test helper methods
      expect(flight.flightRoute, equals('SFO → SEA'));
      expect(flight.formattedDuration, equals('2h 30m'));
      expect(flight.statusDisplay, equals('Completed'));
      expect(flight.classDisplay, equals('Business'));
    });

    test('FlightService can be instantiated', () {
      // This tests that our service imports work correctly
      final flightService = FlightService();
      expect(flightService, isNotNull);
    });

    test('ApiConfig provides correct URLs', () {
      // Test that our API configuration works
      expect(ApiConfig.baseUrl, isNotEmpty);
      expect(ApiConfig.flightsEndpoint, equals('/api/v1/flights'));
      expect(ApiConfig.authEndpoint, equals('/api/v1/auth'));
    });

    test('All flight statuses can be serialized', () {
      final statuses = [
        FlightStatus.upcoming,
        FlightStatus.completed,
        FlightStatus.cancelled,
        FlightStatus.delayed,
        FlightStatus.inFlight,
      ];

      for (final status in statuses) {
        final flight = Flight(
          userId: 'user123',
          airline: 'Test Airline',
          flightNumber: 'TEST123',
          confirmationCode: 'TEST123',
          origin: AirportLocation(
            airportCode: 'AAA',
            city: 'Test City A',
            country: 'Test Country',
          ),
          destination: AirportLocation(
            airportCode: 'BBB',
            city: 'Test City B',
            country: 'Test Country',
          ),
          scheduledDepartureTime: DateTime.now(),
          scheduledArrivalTime: DateTime.now().add(const Duration(hours: 2)),
          seatNumber: '1A',
          status: status,
        );

        final json = flight.toJson();
        final deserializedFlight = Flight.fromJson(json);
        expect(deserializedFlight.status, equals(status));
      }
    });
  });
}