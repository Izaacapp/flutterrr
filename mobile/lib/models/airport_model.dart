class Airport {
  final String code;
  final String name;
  final String city;
  final String? country;
  final String? state;
  final double? lat;
  final double? lng;
  final String? search;

  Airport({
    required this.code,
    required this.name,
    required this.city,
    this.country,
    this.state,
    this.lat,
    this.lng,
    this.search,
  });

  factory Airport.fromJson(Map<String, dynamic> json) {
    return Airport(
      code: json['code'] as String,
      name: json['name'] as String,
      city: json['city'] as String,
      country: json['country'] as String?,
      state: json['state'] as String?,
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
      search: json['search'] as String?,
    );
  }

  String get displayName => '$code - $city';
  
  String get fullLocation {
    final parts = [city];
    if (state != null) parts.add(state!);
    if (country != null) parts.add(country!);
    return parts.join(', ');
  }

  Map<String, dynamic> toJson() {
    return {
      'code': code,
      'name': name,
      'city': city,
      'country': country,
      'state': state,
      'lat': lat,
      'lng': lng,
      'search': search,
    };
  }
}