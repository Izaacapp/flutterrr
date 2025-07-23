import 'package:json_annotation/json_annotation.dart';

part 'flight.g.dart';

// Flight status enum
enum FlightStatus {
  @JsonValue('upcoming')
  upcoming,
  @JsonValue('completed')
  completed,
  @JsonValue('cancelled')
  cancelled,
  @JsonValue('delayed')
  delayed,
  @JsonValue('in-flight')
  inFlight
}

// Class of service enum
enum ClassOfService {
  @JsonValue('economy')
  economy,
  @JsonValue('premium-economy')
  premiumEconomy,
  @JsonValue('business')
  business,
  @JsonValue('first')
  first
}

// Barcode type enum
enum BarcodeType {
  @JsonValue('PDF417')
  pdf417,
  @JsonValue('QR')
  qr,
  @JsonValue('AZTEC')
  aztec,
  @JsonValue('OTHER')
  other
}

@JsonSerializable()
class AirportLocation {
  final String airportCode;
  final String? airportName;
  final String city;
  final String country;
  final String? terminal;
  final String? gate;

  AirportLocation({
    required this.airportCode,
    this.airportName,
    required this.city,
    required this.country,
    this.terminal,
    this.gate,
  });

  factory AirportLocation.fromJson(Map<String, dynamic> json) =>
      _$AirportLocationFromJson(json);

  Map<String, dynamic> toJson() => _$AirportLocationToJson(this);
}

@JsonSerializable()
class BarcodeData {
  final BarcodeType type;
  final String value;

  BarcodeData({
    required this.type,
    required this.value,
  });

  factory BarcodeData.fromJson(Map<String, dynamic> json) =>
      _$BarcodeDataFromJson(json);

  Map<String, dynamic> toJson() => _$BarcodeDataToJson(this);
}

@JsonSerializable()
class Flight {
  @JsonKey(name: '_id')
  final String? id;
  final String userId;
  
  // Basic flight info
  final String airline;
  final String? airlineCode;
  final String? airlineLogo;
  final String flightNumber;
  final String confirmationCode;
  final String? eticketNumber;
  
  // Route info
  final AirportLocation origin;
  final AirportLocation destination;
  final int? distance; // in miles
  final int? duration; // in minutes
  
  // Time info
  final DateTime scheduledDepartureTime;
  final DateTime scheduledArrivalTime;
  final DateTime? actualDepartureTime;
  final DateTime? actualArrivalTime;
  final DateTime? boardingTime;
  
  // Boarding details
  final String seatNumber;
  final String? boardingGroup;
  final String? boardingZone;
  final String? sequenceNumber;
  final ClassOfService? classOfService;
  
  // Flight stats
  final int? points;
  
  // Documents
  final String? boardingPassUrl;
  final BarcodeData? barcode;
  
  // Status
  final FlightStatus status;
  final String? notes;
  
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Flight({
    this.id,
    required this.userId,
    required this.airline,
    this.airlineCode,
    this.airlineLogo,
    required this.flightNumber,
    required this.confirmationCode,
    this.eticketNumber,
    required this.origin,
    required this.destination,
    this.distance,
    this.duration,
    required this.scheduledDepartureTime,
    required this.scheduledArrivalTime,
    this.actualDepartureTime,
    this.actualArrivalTime,
    this.boardingTime,
    required this.seatNumber,
    this.boardingGroup,
    this.boardingZone,
    this.sequenceNumber,
    this.classOfService,
    this.points,
    this.boardingPassUrl,
    this.barcode,
    required this.status,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  factory Flight.fromJson(Map<String, dynamic> json) => _$FlightFromJson(json);

  Map<String, dynamic> toJson() => _$FlightToJson(this);

  // Helper methods
  String get flightRoute => '${origin.airportCode} → ${destination.airportCode}';
  
  String get formattedDepartureTime {
    final hour = scheduledDepartureTime.hour;
    final minute = scheduledDepartureTime.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '$displayHour:$minute $period';
  }
  
  String get formattedArrivalTime {
    final hour = scheduledArrivalTime.hour;
    final minute = scheduledArrivalTime.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '$displayHour:$minute $period';
  }
  
  String get formattedDuration {
    if (duration == null) return 'N/A';
    final hours = duration! ~/ 60;
    final minutes = duration! % 60;
    return '${hours}h ${minutes}m';
  }
  
  String get statusDisplay {
    switch (status) {
      case FlightStatus.upcoming:
        return 'Upcoming';
      case FlightStatus.completed:
        return 'Completed';
      case FlightStatus.cancelled:
        return 'Cancelled';
      case FlightStatus.delayed:
        return 'Delayed';
      case FlightStatus.inFlight:
        return 'In Flight';
    }
  }
  
  String get classDisplay {
    if (classOfService == null) return 'Economy';
    switch (classOfService!) {
      case ClassOfService.economy:
        return 'Economy';
      case ClassOfService.premiumEconomy:
        return 'Premium Economy';
      case ClassOfService.business:
        return 'Business';
      case ClassOfService.first:
        return 'First';
    }
  }
}

@JsonSerializable()
class FlightStats {
  final FlightStatsSummary summary;
  final List<MonthlyFlightStats> flightsByMonth;
  final List<RouteStats> topRoutes;
  final List<AirlineStats> airlineBreakdown;
  final StatusBreakdown statusBreakdown;

  FlightStats({
    required this.summary,
    required this.flightsByMonth,
    required this.topRoutes,
    required this.airlineBreakdown,
    required this.statusBreakdown,
  });

  factory FlightStats.fromJson(Map<String, dynamic> json) =>
      _$FlightStatsFromJson(json);

  Map<String, dynamic> toJson() => _$FlightStatsToJson(this);
}

@JsonSerializable()
class FlightStatsSummary {
  final int totalFlights;
  final int totalDistance;
  final int totalDuration;
  final int totalPoints;
  final int uniqueAirlines;
  final int uniqueDestinations;
  final int uniqueCountries;

  FlightStatsSummary({
    required this.totalFlights,
    required this.totalDistance,
    required this.totalDuration,
    required this.totalPoints,
    required this.uniqueAirlines,
    required this.uniqueDestinations,
    required this.uniqueCountries,
  });

  factory FlightStatsSummary.fromJson(Map<String, dynamic> json) =>
      _$FlightStatsSummaryFromJson(json);

  Map<String, dynamic> toJson() => _$FlightStatsSummaryToJson(this);
}

@JsonSerializable()
class MonthlyFlightStats {
  final int month;
  final int year;
  final int count;
  final int distance;
  final int points;

  MonthlyFlightStats({
    required this.month,
    required this.year,
    required this.count,
    required this.distance,
    required this.points,
  });

  factory MonthlyFlightStats.fromJson(Map<String, dynamic> json) =>
      _$MonthlyFlightStatsFromJson(json);

  Map<String, dynamic> toJson() => _$MonthlyFlightStatsToJson(this);
}

@JsonSerializable()
class RouteStats {
  final String origin;
  final String destination;
  final int count;
  final int totalDistance;

  RouteStats({
    required this.origin,
    required this.destination,
    required this.count,
    required this.totalDistance,
  });

  factory RouteStats.fromJson(Map<String, dynamic> json) =>
      _$RouteStatsFromJson(json);

  Map<String, dynamic> toJson() => _$RouteStatsToJson(this);
}

@JsonSerializable()
class AirlineStats {
  final String airline;
  final int count;
  final int distance;
  final int points;

  AirlineStats({
    required this.airline,
    required this.count,
    required this.distance,
    required this.points,
  });

  factory AirlineStats.fromJson(Map<String, dynamic> json) =>
      _$AirlineStatsFromJson(json);

  Map<String, dynamic> toJson() => _$AirlineStatsToJson(this);
}

@JsonSerializable()
class StatusBreakdown {
  final int upcoming;
  final int completed;
  final int cancelled;
  final int delayed;

  StatusBreakdown({
    required this.upcoming,
    required this.completed,
    required this.cancelled,
    required this.delayed,
  });

  factory StatusBreakdown.fromJson(Map<String, dynamic> json) =>
      _$StatusBreakdownFromJson(json);

  Map<String, dynamic> toJson() => _$StatusBreakdownToJson(this);
}