import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/utils/logger.dart';

class PexelsPhoto {
  final int id;
  final int width;
  final int height;
  final String url;
  final String photographer;
  final String photographerUrl;
  final String avgColor;
  final PhotoSrc src;
  final String alt;

  PexelsPhoto({
    required this.id,
    required this.width,
    required this.height,
    required this.url,
    required this.photographer,
    required this.photographerUrl,
    required this.avgColor,
    required this.src,
    required this.alt,
  });

  factory PexelsPhoto.fromJson(Map<String, dynamic> json) {
    return PexelsPhoto(
      id: json['id'],
      width: json['width'],
      height: json['height'],
      url: json['url'],
      photographer: json['photographer'],
      photographerUrl: json['photographer_url'],
      avgColor: json['avg_color'],
      src: PhotoSrc.fromJson(json['src']),
      alt: json['alt'] ?? '',
    );
  }
}

class PhotoSrc {
  final String original;
  final String large2x;
  final String large;
  final String medium;
  final String small;
  final String portrait;
  final String landscape;
  final String tiny;

  PhotoSrc({
    required this.original,
    required this.large2x,
    required this.large,
    required this.medium,
    required this.small,
    required this.portrait,
    required this.landscape,
    required this.tiny,
  });

  factory PhotoSrc.fromJson(Map<String, dynamic> json) {
    return PhotoSrc(
      original: json['original'],
      large2x: json['large2x'],
      large: json['large'],
      medium: json['medium'],
      small: json['small'],
      portrait: json['portrait'],
      landscape: json['landscape'],
      tiny: json['tiny'],
    );
  }
}

class PexelsService {
  static const String apiKey = 'GAbObNkJoksVvDYm1iJiBaYeDMEHyCsXb5u70nYZ5J87Zv8HXrGqfh1x';
  static const String baseUrl = 'https://api.pexels.com/v1';
  
  final SharedPreferences? _prefs;
  
  PexelsService._internal(this._prefs);
  
  static Future<PexelsService> create() async {
    final prefs = await SharedPreferences.getInstance();
    return PexelsService._internal(prefs);
  }

  Future<List<PexelsPhoto>> searchLocationPhotos(String location, {int perPage = 10}) async {
    try {
      // Check cache first
      final cacheKey = _getCacheKey(location);
      final cached = _prefs?.getString(cacheKey);
      
      if (cached != null) {
        final cachedData = json.decode(cached);
        final timestamp = cachedData['timestamp'] as int;
        
        // Cache for 1 hour
        if (DateTime.now().millisecondsSinceEpoch - timestamp < 3600000) {
          final photos = (cachedData['photos'] as List)
              .map((p) => PexelsPhoto.fromJson(p))
              .toList();
          return photos;
        }
      }

      // Make API request
      final enhancedQuery = '$location travel destination landscape';
      final encodedQuery = Uri.encodeComponent(enhancedQuery);
      
      final response = await http.get(
        Uri.parse('$baseUrl/search?query=$encodedQuery&per_page=$perPage&orientation=landscape'),
        headers: {
          'Authorization': apiKey,
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final photos = (data['photos'] as List)
            .map((p) => PexelsPhoto.fromJson(p))
            .toList();
        
        // Cache the result
        _prefs?.setString(cacheKey, json.encode({
          'photos': data['photos'],
          'timestamp': DateTime.now().millisecondsSinceEpoch,
        }));
        
        return photos;
      } else {
        AppLogger.error('Pexels API error: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      AppLogger.error('Error fetching location photos', e);
      return [];
    }
  }

  String _getCacheKey(String location) {
    return 'pexels-${location.toLowerCase().replaceAll(RegExp(r'\s+'), '-')}';
  }
}