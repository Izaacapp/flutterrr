import '../core/utils/logger.dart';

class LocationResult {
  final String name;
  final String description;
  final String type; // 'city', 'country', 'airport', etc.
  final Map<String, dynamic>? metadata;
  final String? imageUrl;

  LocationResult({
    required this.name,
    required this.description,
    required this.type,
    this.metadata,
    this.imageUrl,
  });

  factory LocationResult.fromJson(Map<String, dynamic> json) {
    return LocationResult(
      name: json['name'] ?? json['display_name'] ?? '',
      description: json['description'] ?? json['formatted_address'] ?? '',
      type: json['type'] ?? 'place',
      metadata: json['metadata'],
      imageUrl: json['imageUrl'],
    );
  }
}

class LocationService {
  static const String placesApiKey = String.fromEnvironment(
    'GOOGLE_PLACES_API_KEY',
    defaultValue: ''
  );

  Future<List<LocationResult>> searchLocations(String query) async {
    try {
      if (query.isEmpty) return [];

      // For now, return mock data. In production, integrate with Google Places API
      // or another location service
      final mockResults = _getMockResults(query);
      
      // Simulate API delay
      await Future.delayed(const Duration(milliseconds: 300));
      
      return mockResults;
    } catch (e) {
      AppLogger.error('Error searching locations', e);
      return [];
    }
  }

  List<LocationResult> _getMockResults(String query) {
    final allLocations = [
      LocationResult(
        name: 'Paris, France',
        description: 'The City of Light - Famous for the Eiffel Tower and art',
        type: 'city',
      ),
      LocationResult(
        name: 'Tokyo, Japan',
        description: 'Modern metropolis blending tradition with technology',
        type: 'city',
      ),
      LocationResult(
        name: 'New York City, USA',
        description: 'The Big Apple - Financial and cultural capital',
        type: 'city',
      ),
      LocationResult(
        name: 'London, United Kingdom',
        description: 'Historic capital with Big Ben and royal palaces',
        type: 'city',
      ),
      LocationResult(
        name: 'Bali, Indonesia',
        description: 'Tropical paradise with beaches and temples',
        type: 'region',
      ),
      LocationResult(
        name: 'Dubai, UAE',
        description: 'Modern city with skyscrapers and luxury shopping',
        type: 'city',
      ),
      LocationResult(
        name: 'Rome, Italy',
        description: 'The Eternal City - Ancient history and Vatican City',
        type: 'city',
      ),
      LocationResult(
        name: 'Sydney, Australia',
        description: 'Harbor city with Opera House and beaches',
        type: 'city',
      ),
      LocationResult(
        name: 'Barcelona, Spain',
        description: 'Mediterranean city known for Gaudí architecture',
        type: 'city',
      ),
      LocationResult(
        name: 'Thailand',
        description: 'Southeast Asian country with temples and beaches',
        type: 'country',
      ),
      LocationResult(
        name: 'Iceland',
        description: 'Nordic island nation with glaciers and hot springs',
        type: 'country',
      ),
      LocationResult(
        name: 'Santorini, Greece',
        description: 'Stunning island with white buildings and blue domes',
        type: 'region',
      ),
    ];

    final lowerQuery = query.toLowerCase();
    return allLocations
        .where((location) => 
            location.name.toLowerCase().contains(lowerQuery) ||
            location.description.toLowerCase().contains(lowerQuery))
        .toList();
  }

  List<LocationResult> getPopularDestinations() {
    return [
      LocationResult(
        name: 'Paris, France',
        description: 'The City of Light',
        type: 'city',
      ),
      LocationResult(
        name: 'Tokyo, Japan',
        description: 'Modern metropolis',
        type: 'city',
      ),
      LocationResult(
        name: 'New York City',
        description: 'The Big Apple',
        type: 'city',
      ),
      LocationResult(
        name: 'London, England',
        description: 'Historic capital',
        type: 'city',
      ),
      LocationResult(
        name: 'Bali, Indonesia',
        description: 'Tropical paradise',
        type: 'region',
      ),
      LocationResult(
        name: 'Dubai, UAE',
        description: 'Modern luxury',
        type: 'city',
      ),
      LocationResult(
        name: 'Rome, Italy',
        description: 'The Eternal City',
        type: 'city',
      ),
      LocationResult(
        name: 'Sydney, Australia',
        description: 'Harbor city',
        type: 'city',
      ),
      LocationResult(
        name: 'Barcelona, Spain',
        description: 'Mediterranean charm',
        type: 'city',
      ),
      LocationResult(
        name: 'Thailand',
        description: 'Land of Smiles',
        type: 'country',
      ),
      LocationResult(
        name: 'Iceland',
        description: 'Land of Fire and Ice',
        type: 'country',
      ),
      LocationResult(
        name: 'Santorini, Greece',
        description: 'Island paradise',
        type: 'region',
      ),
    ];
  }
}