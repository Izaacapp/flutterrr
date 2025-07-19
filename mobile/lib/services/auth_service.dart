import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api/api_config.dart';
import '../core/utils/logger.dart';

class User {
  final String id;
  final String username;
  final String email;
  final String fullName;
  final String? avatar;
  final String? bio;
  final String? location;
  final String? homeAirport;
  final String? passportCountry;
  final int? milesFlown;
  final List<String>? countriesVisited;
  final bool? emailVerified;

  User({
    required this.id,
    required this.username,
    required this.email,
    required this.fullName,
    this.avatar,
    this.bio,
    this.location,
    this.homeAirport,
    this.passportCountry,
    this.milesFlown,
    this.countriesVisited,
    this.emailVerified,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? json['_id'],
      username: json['username'],
      email: json['email'],
      fullName: json['fullName'],
      avatar: json['avatar'],
      bio: json['bio'],
      location: json['location'],
      homeAirport: json['homeAirport'],
      passportCountry: json['passportCountry'],
      milesFlown: json['milesFlown'],
      countriesVisited: json['countriesVisited'] != null 
          ? List<String>.from(json['countriesVisited'])
          : null,
      emailVerified: json['emailVerified'],
    );
  }
}

class AuthResponse {
  final String? status;
  final bool? success;
  final String message;
  final String? token;
  final User? user;
  final bool? needsVerification;

  AuthResponse({
    this.status,
    this.success,
    required this.message,
    this.token,
    this.user,
    this.needsVerification,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    User? user;
    
    // Handle nested user data structure
    if (json['data'] != null && json['data']['user'] != null) {
      user = User.fromJson(json['data']['user']);
    } else if (json['user'] != null) {
      user = User.fromJson(json['user']);
    }

    // Debug logging
    AppLogger.debug('AuthResponse.fromJson - status: ${json['status']}, message: ${json['message']}');
    
    // Extract message from different possible fields
    String message = json['message'] ?? json['error'] ?? '';
    if (message.isEmpty && json['status'] == 'error') {
      message = 'An error occurred';
    }
    
    return AuthResponse(
      status: json['status'],
      success: json['success'] ?? (json['status'] == 'success'),
      message: message,
      token: json['token'],
      user: user,
      needsVerification: json['needsVerification'],
    );
  }

  bool get isSuccess => status == 'success' || success == true;
}

class AuthService {
  static const String _tokenKey = 'passport_buddy_token';
  static const String _userKey = 'passport_buddy_user';
  
  final Dio _dio = Dio();
  late SharedPreferences _prefs;
  
  String? _token;
  User? _user;

  AuthService() {
    _initPrefs();
  }

  Future<void> _initPrefs() async {
    _prefs = await SharedPreferences.getInstance();
    _token = _prefs.getString(_tokenKey);
    final userJson = _prefs.getString(_userKey);
    if (userJson != null) {
      try {
        _user = User.fromJson(jsonDecode(userJson));
        // If user is not verified, clear the stored auth data
        if (_user != null && _user!.emailVerified != true) {
          AppLogger.warning('User not verified, clearing stored auth data');
          await logout();
        }
      } catch (e) {
        AppLogger.error('Failed to parse user data', e);
      }
    }
  }

  Future<String> get apiUrl async {
    final endpoint = await ApiConfig.discoverEndpoint();
    return endpoint.replaceAll('/graphql', '');
  }

  Future<AuthResponse> signup({
    required String username,
    required String email,
    required String password,
    required String fullName,
  }) async {
    try {
      final baseUrl = await apiUrl;
      AppLogger.info('Signup - API URL: $baseUrl/api/auth/signup');
      final response = await _dio.post(
        '$baseUrl/api/auth/signup',
        data: {
          'username': username,
          'email': email,
          'password': password,
          'fullName': fullName,
        },
      );
      AppLogger.info('Signup response: ${response.data}');

      final authResponse = AuthResponse.fromJson(response.data);
      
      if (authResponse.isSuccess && authResponse.token != null && authResponse.user != null) {
        await _setAuthData(authResponse.token!, authResponse.user!);
      }

      return authResponse;
    } on DioException catch (e) {
      AppLogger.error('Signup DioException: ${e.message}', e);
      AppLogger.error('Response data: ${e.response?.data}');
      if (e.response != null) {
        return AuthResponse.fromJson(e.response!.data);
      }
      return AuthResponse(
        success: false,
        message: 'Network error. Please try again.',
      );
    } catch (e) {
      AppLogger.error('Signup error', e);
      return AuthResponse(
        success: false,
        message: 'An unexpected error occurred',
      );
    }
  }

  Future<AuthResponse> verifyAccount(String otp) async {
    if (_token == null) {
      return AuthResponse(success: false, message: 'No authentication token found');
    }

    try {
      final baseUrl = await apiUrl;
      final response = await _dio.post(
        '$baseUrl/api/auth/verify-account',
        data: {
          'otp': otp,
        },
        options: Options(
          headers: {'Authorization': 'Bearer $_token'},
        ),
      );

      final authResponse = AuthResponse.fromJson(response.data);
      
      if (authResponse.isSuccess && authResponse.user != null) {
        // Update user data with verified status
        _user = authResponse.user;
        await _prefs.setString(_userKey, jsonEncode({
          'id': _user!.id,
          'username': _user!.username,
          'email': _user!.email,
          'fullName': _user!.fullName,
          'avatar': _user!.avatar,
          'bio': _user!.bio,
          'location': _user!.location,
          'homeAirport': _user!.homeAirport,
          'passportCountry': _user!.passportCountry,
          'milesFlown': _user!.milesFlown,
          'countriesVisited': _user!.countriesVisited,
          'emailVerified': _user!.emailVerified,
        }));
      }

      return authResponse;
    } on DioException catch (e) {
      if (e.response != null) {
        return AuthResponse.fromJson(e.response!.data);
      }
      return AuthResponse(
        success: false,
        message: 'Network error. Please try again.',
      );
    } catch (e) {
      return AuthResponse(
        success: false,
        message: 'An unexpected error occurred',
      );
    }
  }

  Future<AuthResponse> resendOTP() async {
    if (_token == null) {
      return AuthResponse(success: false, message: 'No authentication token found');
    }

    try {
      final baseUrl = await apiUrl;
      final response = await _dio.post(
        '$baseUrl/api/auth/resend-otp',
        options: Options(
          headers: {'Authorization': 'Bearer $_token'},
        ),
      );

      return AuthResponse.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response != null) {
        return AuthResponse.fromJson(e.response!.data);
      }
      return AuthResponse(
        success: false,
        message: 'Network error. Please try again.',
      );
    } catch (e) {
      return AuthResponse(
        success: false,
        message: 'An unexpected error occurred',
      );
    }
  }

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final baseUrl = await apiUrl;
      AppLogger.info('Login - API URL: $baseUrl/api/auth/login');
      final response = await _dio.post(
        '$baseUrl/api/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );
      AppLogger.info('Login response: ${response.data}');

      final authResponse = AuthResponse.fromJson(response.data);
      
      if (authResponse.isSuccess && authResponse.token != null && authResponse.user != null) {
        // Check if user needs verification BEFORE setting auth data
        if (authResponse.needsVerification == true) {
          // Don't save auth data yet - user needs to verify first
          // But keep the token in memory for OTP verification
          _token = authResponse.token;
          _user = authResponse.user;
          // Don't persist to storage yet
          return authResponse;
        }
        
        // Only set auth data if user is verified
        await _setAuthData(authResponse.token!, authResponse.user!);
      }

      return authResponse;
    } on DioException catch (e) {
      AppLogger.error('Login DioException: ${e.message}', e);
      AppLogger.error('Response status: ${e.response?.statusCode}');
      AppLogger.error('Response data: ${e.response?.data}');
      if (e.response != null) {
        return AuthResponse.fromJson(e.response!.data);
      }
      return AuthResponse(
        success: false,
        message: 'Network error. Please try again.',
      );
    } catch (e) {
      AppLogger.error('Login error', e, StackTrace.current);
      AppLogger.error('Error type: ${e.runtimeType}');
      return AuthResponse(
        success: false,
        message: 'An unexpected error occurred',
      );
    }
  }

  Future<AuthResponse> forgotPassword(String email) async {
    try {
      final baseUrl = await apiUrl;
      final response = await _dio.post(
        '$baseUrl/api/auth/forgot-password',
        data: {
          'email': email,
        },
      );

      return AuthResponse.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response != null) {
        return AuthResponse.fromJson(e.response!.data);
      }
      return AuthResponse(
        success: false,
        message: 'Network error. Please try again.',
      );
    } catch (e) {
      return AuthResponse(
        success: false,
        message: 'An unexpected error occurred',
      );
    }
  }

  Future<AuthResponse> resetPassword({
    required String email,
    required String otp,
    required String password,
    required String passwordConfirm,
  }) async {
    try {
      final baseUrl = await apiUrl;
      final response = await _dio.post(
        '$baseUrl/api/auth/reset-password',
        data: {
          'email': email,
          'otp': otp,
          'password': password,
          'passwordConfirm': passwordConfirm,
        },
      );

      final authResponse = AuthResponse.fromJson(response.data);
      
      if (authResponse.isSuccess && authResponse.token != null && authResponse.user != null) {
        await _setAuthData(authResponse.token!, authResponse.user!);
      }

      return authResponse;
    } on DioException catch (e) {
      if (e.response != null) {
        return AuthResponse.fromJson(e.response!.data);
      }
      return AuthResponse(
        success: false,
        message: 'Network error. Please try again.',
      );
    } catch (e) {
      return AuthResponse(
        success: false,
        message: 'An unexpected error occurred',
      );
    }
  }

  Future<AuthResponse> verify() async {
    if (_token == null) {
      return AuthResponse(success: false, message: 'No token found');
    }

    try {
      final baseUrl = await apiUrl;
      final response = await _dio.get(
        '$baseUrl/api/auth/verify',
        options: Options(
          headers: {'Authorization': 'Bearer $_token'},
        ),
      );

      final authResponse = AuthResponse.fromJson(response.data);
      
      if (authResponse.success == true && authResponse.user != null) {
        _user = authResponse.user;
        await _prefs.setString(_userKey, jsonEncode({
          'id': _user!.id,
          'username': _user!.username,
          'email': _user!.email,
          'fullName': _user!.fullName,
          'avatar': _user!.avatar,
          'bio': _user!.bio,
          'location': _user!.location,
          'homeAirport': _user!.homeAirport,
          'passportCountry': _user!.passportCountry,
          'milesFlown': _user!.milesFlown,
          'countriesVisited': _user!.countriesVisited,
          'emailVerified': _user!.emailVerified,
        }));
      } else {
        await logout();
      }

      return authResponse;
    } catch (e) {
      return AuthResponse(
        success: false,
        message: 'Failed to verify token',
      );
    }
  }

  Future<void> logout() async {
    try {
      final baseUrl = await apiUrl;
      await _dio.post(
        '$baseUrl/api/auth/logout',
        options: Options(
          headers: _token != null ? {'Authorization': 'Bearer $_token'} : {},
        ),
      );
    } catch (e) {
      // Continue with local logout even if API call fails
    } finally {
      _token = null;
      _user = null;
      await _prefs.remove(_tokenKey);
      await _prefs.remove(_userKey);
    }
  }

  Future<void> _setAuthData(String token, User user) async {
    _token = token;
    _user = user;
    await _prefs.setString(_tokenKey, token);
    await _prefs.setString(_userKey, jsonEncode({
      'id': user.id,
      'username': user.username,
      'email': user.email,
      'fullName': user.fullName,
      'avatar': user.avatar,
      'bio': user.bio,
      'location': user.location,
      'homeAirport': user.homeAirport,
      'passportCountry': user.passportCountry,
      'milesFlown': user.milesFlown,
      'countriesVisited': user.countriesVisited,
      'emailVerified': user.emailVerified,
    }));
  }

  String? get token => _token;
  User? get user => _user;
  bool get isAuthenticated => _token != null && _user != null && _user!.emailVerified == true;
  bool get needsVerification => _user != null && _user!.emailVerified != true;
}

// Singleton instance
final authService = AuthService();