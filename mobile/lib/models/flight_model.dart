class Flight {
  final String id;
  final String airline;
  final String? airlineLogo;
  final String flightNumber;
  final String confirmationCode;
  final String? eticketNumber;
  final FlightLocation origin;
  final FlightLocation destination;
  final DateTime scheduledDepartureTime;
  final DateTime scheduledArrivalTime;
  final DateTime? actualDepartureTime;
  final DateTime? actualArrivalTime;
  final String? seatNumber;
  final String? boardingGroup;
  final double? distance;
  final int? duration;
  final int? points;
  final String? boardingPassUrl;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;

  Flight({
    required this.id,
    required this.airline,
    this.airlineLogo,
    required this.flightNumber,
    required this.confirmationCode,
    this.eticketNumber,
    required this.origin,
    required this.destination,
    required this.scheduledDepartureTime,
    required this.scheduledArrivalTime,
    this.actualDepartureTime,
    this.actualArrivalTime,
    this.seatNumber,
    this.boardingGroup,
    this.distance,
    this.duration,
    this.points,
    this.boardingPassUrl,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Flight.fromJson(Map<String, dynamic> json) {
    return Flight(
      id: json['_id'] ?? json['id'],
      airline: json['airline'],
      airlineLogo: json['airlineLogo'],
      flightNumber: json['flightNumber'],
      confirmationCode: json['confirmationCode'],
      eticketNumber: json['eticketNumber'],
      origin: FlightLocation.fromJson(json['origin']),
      destination: FlightLocation.fromJson(json['destination']),
      scheduledDepartureTime: DateTime.parse(json['scheduledDepartureTime']),
      scheduledArrivalTime: DateTime.parse(json['scheduledArrivalTime']),
      actualDepartureTime: json['actualDepartureTime'] != null 
          ? DateTime.parse(json['actualDepartureTime']) 
          : null,
      actualArrivalTime: json['actualArrivalTime'] != null 
          ? DateTime.parse(json['actualArrivalTime']) 
          : null,
      seatNumber: json['seatNumber'],
      boardingGroup: json['boardingGroup'],
      distance: json['distance']?.toDouble(),
      duration: json['duration'],
      points: json['points'],
      boardingPassUrl: json['boardingPassUrl'],
      status: json['status'] ?? 'upcoming',
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'airline': airline,
      'flightNumber': flightNumber,
      'confirmationCode': confirmationCode,
      'eticketNumber': eticketNumber,
      'origin': origin.toJson(),
      'destination': destination.toJson(),
      'scheduledDepartureTime': scheduledDepartureTime.toIso8601String(),
      'scheduledArrivalTime': scheduledArrivalTime.toIso8601String(),
      'actualDepartureTime': actualDepartureTime?.toIso8601String(),
      'actualArrivalTime': actualArrivalTime?.toIso8601String(),
      'seatNumber': seatNumber,
      'boardingGroup': boardingGroup,
      'distance': distance,
      'duration': duration,
      'points': points,
      'boardingPassUrl': boardingPassUrl,
      'status': status,
    };
  }

  String get durationFormatted {
    if (duration == null) return '';
    final hours = duration! ~/ 60;
    final minutes = duration! % 60;
    return '${hours}h ${minutes}m';
  }

  bool get isUpcoming => status == 'upcoming';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get isDelayed => status == 'delayed';
}

class FlightLocation {
  final String airportCode;
  final String? airportName;
  final String city;
  final String country;
  final String? terminal;
  final String? gate;

  FlightLocation({
    required this.airportCode,
    this.airportName,
    required this.city,
    required this.country,
    this.terminal,
    this.gate,
  });

  factory FlightLocation.fromJson(Map<String, dynamic> json) {
    return FlightLocation(
      airportCode: json['airportCode'],
      airportName: json['airportName'],
      city: json['city'],
      country: json['country'],
      terminal: json['terminal'],
      gate: json['gate'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'airportCode': airportCode,
      'airportName': airportName,
      'city': city,
      'country': country,
      'terminal': terminal,
      'gate': gate,
    };
  }
}