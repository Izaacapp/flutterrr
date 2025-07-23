import 'package:flutter_test/flutter_test.dart';
import '../lib/features/auth/data/models/flight.dart';

void main() {
  test('Mobile app flight models are compatible with backend data format', () {
    // This simulates data coming from the backend API
    final backendFlightJson = {
      '_id': '507f1f77bcf86cd799439011',
      'userId': 'user123',
      'airline': 'American Airlines',
      'airlineCode': 'AA', 
      'flightNumber': 'AA123',
      'confirmationCode': 'ABC123',
      'origin': {
        'airportCode': 'LAX',
        'airportName': 'Los Angeles International Airport',
        'city': 'Los Angeles',
        'country': 'United States',
        'terminal': '7',
        'gate': 'A23'
      },
      'destination': {
        'airportCode': 'JFK', 
        'airportName': 'John F. Kennedy International Airport',
        'city': 'New York',
        'country': 'United States',
        'terminal': '4',
        'gate': 'B12'
      },
      'scheduledDepartureTime': '2024-01-15T14:30:00.000Z',
      'scheduledArrivalTime': '2024-01-15T18:45:00.000Z',
      'seatNumber': '12A',
      'status': 'upcoming',
      'distance': 2475,
      'duration': 315,
      'points': 2475
    };

    // Test that mobile app can parse backend data
    final flight = Flight.fromJson(backendFlightJson);
    
    expect(flight.id, equals('507f1f77bcf86cd799439011'));
    expect(flight.airline, equals('American Airlines'));
    expect(flight.airlineCode, equals('AA'));
    expect(flight.flightNumber, equals('AA123'));
    expect(flight.origin.airportCode, equals('LAX'));
    expect(flight.destination.airportCode, equals('JFK'));
    expect(flight.status, equals(FlightStatus.upcoming));
    expect(flight.distance, equals(2475));
    expect(flight.duration, equals(315));
    
    print('✅ Mobile app successfully parsed backend flight data!');
    print('✅ Flight route: ${flight.flightRoute}');
    print('✅ Status: ${flight.statusDisplay}');
    print('✅ Duration: ${flight.formattedDuration}');
  });
}