// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'flight.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AirportLocation _$AirportLocationFromJson(Map<String, dynamic> json) =>
    AirportLocation(
      airportCode: json['airportCode'] as String,
      airportName: json['airportName'] as String?,
      city: json['city'] as String,
      country: json['country'] as String,
      terminal: json['terminal'] as String?,
      gate: json['gate'] as String?,
    );

Map<String, dynamic> _$AirportLocationToJson(AirportLocation instance) =>
    <String, dynamic>{
      'airportCode': instance.airportCode,
      'airportName': instance.airportName,
      'city': instance.city,
      'country': instance.country,
      'terminal': instance.terminal,
      'gate': instance.gate,
    };

BarcodeData _$BarcodeDataFromJson(Map<String, dynamic> json) => BarcodeData(
      type: $enumDecode(_$BarcodeTypeEnumMap, json['type']),
      value: json['value'] as String,
    );

Map<String, dynamic> _$BarcodeDataToJson(BarcodeData instance) =>
    <String, dynamic>{
      'type': _$BarcodeTypeEnumMap[instance.type]!,
      'value': instance.value,
    };

const _$BarcodeTypeEnumMap = {
  BarcodeType.pdf417: 'PDF417',
  BarcodeType.qr: 'QR',
  BarcodeType.aztec: 'AZTEC',
  BarcodeType.other: 'OTHER',
};

Flight _$FlightFromJson(Map<String, dynamic> json) => Flight(
      id: json['_id'] as String?,
      userId: json['userId'] as String,
      airline: json['airline'] as String,
      airlineCode: json['airlineCode'] as String?,
      airlineLogo: json['airlineLogo'] as String?,
      flightNumber: json['flightNumber'] as String,
      confirmationCode: json['confirmationCode'] as String,
      eticketNumber: json['eticketNumber'] as String?,
      origin: AirportLocation.fromJson(json['origin'] as Map<String, dynamic>),
      destination:
          AirportLocation.fromJson(json['destination'] as Map<String, dynamic>),
      distance: (json['distance'] as num?)?.toInt(),
      duration: (json['duration'] as num?)?.toInt(),
      scheduledDepartureTime:
          DateTime.parse(json['scheduledDepartureTime'] as String),
      scheduledArrivalTime:
          DateTime.parse(json['scheduledArrivalTime'] as String),
      actualDepartureTime: json['actualDepartureTime'] == null
          ? null
          : DateTime.parse(json['actualDepartureTime'] as String),
      actualArrivalTime: json['actualArrivalTime'] == null
          ? null
          : DateTime.parse(json['actualArrivalTime'] as String),
      boardingTime: json['boardingTime'] == null
          ? null
          : DateTime.parse(json['boardingTime'] as String),
      seatNumber: json['seatNumber'] as String,
      boardingGroup: json['boardingGroup'] as String?,
      boardingZone: json['boardingZone'] as String?,
      sequenceNumber: json['sequenceNumber'] as String?,
      classOfService:
          $enumDecodeNullable(_$ClassOfServiceEnumMap, json['classOfService']),
      points: (json['points'] as num?)?.toInt(),
      boardingPassUrl: json['boardingPassUrl'] as String?,
      barcode: json['barcode'] == null
          ? null
          : BarcodeData.fromJson(json['barcode'] as Map<String, dynamic>),
      status: $enumDecode(_$FlightStatusEnumMap, json['status']),
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$FlightToJson(Flight instance) => <String, dynamic>{
      '_id': instance.id,
      'userId': instance.userId,
      'airline': instance.airline,
      'airlineCode': instance.airlineCode,
      'airlineLogo': instance.airlineLogo,
      'flightNumber': instance.flightNumber,
      'confirmationCode': instance.confirmationCode,
      'eticketNumber': instance.eticketNumber,
      'origin': instance.origin,
      'destination': instance.destination,
      'distance': instance.distance,
      'duration': instance.duration,
      'scheduledDepartureTime':
          instance.scheduledDepartureTime.toIso8601String(),
      'scheduledArrivalTime': instance.scheduledArrivalTime.toIso8601String(),
      'actualDepartureTime': instance.actualDepartureTime?.toIso8601String(),
      'actualArrivalTime': instance.actualArrivalTime?.toIso8601String(),
      'boardingTime': instance.boardingTime?.toIso8601String(),
      'seatNumber': instance.seatNumber,
      'boardingGroup': instance.boardingGroup,
      'boardingZone': instance.boardingZone,
      'sequenceNumber': instance.sequenceNumber,
      'classOfService': _$ClassOfServiceEnumMap[instance.classOfService],
      'points': instance.points,
      'boardingPassUrl': instance.boardingPassUrl,
      'barcode': instance.barcode,
      'status': _$FlightStatusEnumMap[instance.status]!,
      'notes': instance.notes,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };

const _$ClassOfServiceEnumMap = {
  ClassOfService.economy: 'economy',
  ClassOfService.premiumEconomy: 'premium-economy',
  ClassOfService.business: 'business',
  ClassOfService.first: 'first',
};

const _$FlightStatusEnumMap = {
  FlightStatus.upcoming: 'upcoming',
  FlightStatus.completed: 'completed',
  FlightStatus.cancelled: 'cancelled',
  FlightStatus.delayed: 'delayed',
  FlightStatus.inFlight: 'in-flight',
};

FlightStats _$FlightStatsFromJson(Map<String, dynamic> json) => FlightStats(
      summary:
          FlightStatsSummary.fromJson(json['summary'] as Map<String, dynamic>),
      flightsByMonth: (json['flightsByMonth'] as List<dynamic>)
          .map((e) => MonthlyFlightStats.fromJson(e as Map<String, dynamic>))
          .toList(),
      topRoutes: (json['topRoutes'] as List<dynamic>)
          .map((e) => RouteStats.fromJson(e as Map<String, dynamic>))
          .toList(),
      airlineBreakdown: (json['airlineBreakdown'] as List<dynamic>)
          .map((e) => AirlineStats.fromJson(e as Map<String, dynamic>))
          .toList(),
      statusBreakdown: StatusBreakdown.fromJson(
          json['statusBreakdown'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$FlightStatsToJson(FlightStats instance) =>
    <String, dynamic>{
      'summary': instance.summary,
      'flightsByMonth': instance.flightsByMonth,
      'topRoutes': instance.topRoutes,
      'airlineBreakdown': instance.airlineBreakdown,
      'statusBreakdown': instance.statusBreakdown,
    };

FlightStatsSummary _$FlightStatsSummaryFromJson(Map<String, dynamic> json) =>
    FlightStatsSummary(
      totalFlights: (json['totalFlights'] as num).toInt(),
      totalDistance: (json['totalDistance'] as num).toInt(),
      totalDuration: (json['totalDuration'] as num).toInt(),
      totalPoints: (json['totalPoints'] as num).toInt(),
      uniqueAirlines: (json['uniqueAirlines'] as num).toInt(),
      uniqueDestinations: (json['uniqueDestinations'] as num).toInt(),
      uniqueCountries: (json['uniqueCountries'] as num).toInt(),
    );

Map<String, dynamic> _$FlightStatsSummaryToJson(FlightStatsSummary instance) =>
    <String, dynamic>{
      'totalFlights': instance.totalFlights,
      'totalDistance': instance.totalDistance,
      'totalDuration': instance.totalDuration,
      'totalPoints': instance.totalPoints,
      'uniqueAirlines': instance.uniqueAirlines,
      'uniqueDestinations': instance.uniqueDestinations,
      'uniqueCountries': instance.uniqueCountries,
    };

MonthlyFlightStats _$MonthlyFlightStatsFromJson(Map<String, dynamic> json) =>
    MonthlyFlightStats(
      month: (json['month'] as num).toInt(),
      year: (json['year'] as num).toInt(),
      count: (json['count'] as num).toInt(),
      distance: (json['distance'] as num).toInt(),
      points: (json['points'] as num).toInt(),
    );

Map<String, dynamic> _$MonthlyFlightStatsToJson(MonthlyFlightStats instance) =>
    <String, dynamic>{
      'month': instance.month,
      'year': instance.year,
      'count': instance.count,
      'distance': instance.distance,
      'points': instance.points,
    };

RouteStats _$RouteStatsFromJson(Map<String, dynamic> json) => RouteStats(
      origin: json['origin'] as String,
      destination: json['destination'] as String,
      count: (json['count'] as num).toInt(),
      totalDistance: (json['totalDistance'] as num).toInt(),
    );

Map<String, dynamic> _$RouteStatsToJson(RouteStats instance) =>
    <String, dynamic>{
      'origin': instance.origin,
      'destination': instance.destination,
      'count': instance.count,
      'totalDistance': instance.totalDistance,
    };

AirlineStats _$AirlineStatsFromJson(Map<String, dynamic> json) => AirlineStats(
      airline: json['airline'] as String,
      count: (json['count'] as num).toInt(),
      distance: (json['distance'] as num).toInt(),
      points: (json['points'] as num).toInt(),
    );

Map<String, dynamic> _$AirlineStatsToJson(AirlineStats instance) =>
    <String, dynamic>{
      'airline': instance.airline,
      'count': instance.count,
      'distance': instance.distance,
      'points': instance.points,
    };

StatusBreakdown _$StatusBreakdownFromJson(Map<String, dynamic> json) =>
    StatusBreakdown(
      upcoming: (json['upcoming'] as num).toInt(),
      completed: (json['completed'] as num).toInt(),
      cancelled: (json['cancelled'] as num).toInt(),
      delayed: (json['delayed'] as num).toInt(),
    );

Map<String, dynamic> _$StatusBreakdownToJson(StatusBreakdown instance) =>
    <String, dynamic>{
      'upcoming': instance.upcoming,
      'completed': instance.completed,
      'cancelled': instance.cancelled,
      'delayed': instance.delayed,
    };
