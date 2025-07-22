import 'package:flutter/foundation.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = authService;
  
  bool _isLoading = true;
  String? _error;

  User? get user => _authService.user;
  bool get isAuthenticated => _authService.isAuthenticated;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get needsVerification => _authService.needsVerification;

  AuthProvider() {
    _init();
  }

  Future<void> _init() async {
    _isLoading = true;
    notifyListeners();
    
    if (_authService.isAuthenticated) {
      await _authService.verify();
    }
    
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _authService.login(
        email: email,
        password: password,
      );

      if (!response.isSuccess) {
        _error = response.message;
      } else if (response.needsVerification == true) {
        // Login successful but needs verification
        _error = null;
        return true; // Let main.dart handle navigation to OTP screen
      }

      return response.isSuccess;
    } catch (e) {
      _error = 'An unexpected error occurred';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> signup({
    required String username,
    required String email,
    required String password,
    required String fullName,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _authService.signup(
        username: username,
        email: email,
        password: password,
        fullName: fullName,
      );

      if (!response.isSuccess) {
        _error = response.message;
      }

      return response.isSuccess;
    } catch (e) {
      _error = 'An unexpected error occurred';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void updateUser(User user) {
    notifyListeners();
  }

  Future<String?> getAuthToken() async {
    return _authService.token;
  }

  Future<void> refresh() async {
    await _init();
  }

  Future<void> refreshUserProfile() async {
    await _authService.refreshUserProfile();
    notifyListeners();
  }
}