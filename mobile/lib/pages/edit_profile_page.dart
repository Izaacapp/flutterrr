import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';
import '../core/theme/app_theme.dart';
import '../core/api/api_config.dart';

class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _fullNameController;
  late TextEditingController _usernameController;
  late TextEditingController _bioController;
  late TextEditingController _locationController;
  late TextEditingController _homeAirportController;
  late TextEditingController _passportCountryController;
  
  bool _isLoading = false;
  Map<String, String> _errors = {};

  @override
  void initState() {
    super.initState();
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    
    _fullNameController = TextEditingController(text: user?.fullName ?? '');
    _usernameController = TextEditingController(text: user?.username ?? '');
    _bioController = TextEditingController(text: user?.bio ?? '');
    _locationController = TextEditingController(text: user?.location ?? '');
    _homeAirportController = TextEditingController(text: user?.homeAirport ?? '');
    _passportCountryController = TextEditingController(text: user?.passportCountry ?? '');
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _usernameController.dispose();
    _bioController.dispose();
    _locationController.dispose();
    _homeAirportController.dispose();
    _passportCountryController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() {
      _isLoading = true;
      _errors.clear();
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authService.token;
      
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final endpoint = await ApiConfig.getBaseApiUrl();
      final response = await http.patch(
        Uri.parse('$endpoint/api/users/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'fullName': _fullNameController.text.trim(),
          'username': _usernameController.text.trim().toLowerCase(),
          'bio': _bioController.text.trim(),
          'location': _locationController.text.trim(),
          'homeAirport': _homeAirportController.text.trim().toUpperCase(),
          'passportCountry': _passportCountryController.text.trim(),
        }),
      );

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');
      
      if (response.body.isEmpty) {
        throw Exception('Empty response from server');
      }
      
      Map<String, dynamic> responseData;
      try {
        responseData = jsonDecode(response.body);
      } catch (e) {
        print('JSON decode error: $e');
        throw Exception('Invalid JSON response from server: ${response.body}');
      }
      
      if (response.statusCode == 200 && responseData['status'] == 'success') {
        // Update user in auth provider
        final updatedUser = User.fromJson(responseData['data']['user']);
        authProvider.updateUser(updatedUser);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profile updated successfully!'),
              backgroundColor: AppColors.mediumPurple,
            ),
          );
          Navigator.of(context).pop();
        }
      } else if (response.statusCode == 400 && responseData['message'] == 'Username is already taken') {
        setState(() {
          _errors['username'] = 'Username is already taken';
        });
      } else {
        throw Exception(responseData['message'] ?? 'Failed to update profile');
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${error.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveProfile,
            child: _isLoading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.mediumPurple,
                    ),
                  )
                : const Text(
                    'Save',
                    style: TextStyle(
                      color: AppColors.mediumPurple,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildTextField(
                controller: _fullNameController,
                label: 'Full Name',
                required: true,
                error: _errors['fullName'],
              ),
              const SizedBox(height: 16),
              
              _buildTextField(
                controller: _usernameController,
                label: 'Username',
                required: true,
                error: _errors['username'],
                onChanged: (value) {
                  setState(() {
                    _errors.remove('username');
                  });
                },
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Username is required';
                  }
                  if (value.length < 3) {
                    return 'Username must be at least 3 characters';
                  }
                  if (!RegExp(r'^[a-zA-Z0-9_]+$').hasMatch(value)) {
                    return 'Username can only contain letters, numbers, and underscores';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              _buildTextField(
                controller: _bioController,
                label: 'Bio',
                maxLines: 3,
                maxLength: 150,
                error: _errors['bio'],
              ),
              const SizedBox(height: 16),
              
              _buildTextField(
                controller: _locationController,
                label: 'Location',
                hintText: 'e.g., San Francisco, CA',
              ),
              const SizedBox(height: 16),
              
              _buildTextField(
                controller: _homeAirportController,
                label: 'Home Airport',
                hintText: 'e.g., SFO, JFK, LHR',
                maxLength: 4,
                textCapitalization: TextCapitalization.characters,
              ),
              const SizedBox(height: 16),
              
              _buildTextField(
                controller: _passportCountryController,
                label: 'Passport Country',
                hintText: 'e.g., United States, Canada, United Kingdom',
              ),
              const SizedBox(height: 32),
              
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveProfile,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.mediumPurple,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Save Changes',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    bool required = false,
    int maxLines = 1,
    int? maxLength,
    String? hintText,
    String? error,
    TextCapitalization textCapitalization = TextCapitalization.none,
    String? Function(String?)? validator,
    Function(String)? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          required ? '$label *' : label,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: AppColors.darkPurple,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          maxLength: maxLength,
          textCapitalization: textCapitalization,
          decoration: InputDecoration(
            hintText: hintText,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.lightPeriwinkle),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: error != null ? Colors.red : AppColors.lightPeriwinkle,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: error != null ? Colors.red : AppColors.mediumPurple,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Colors.red),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Colors.red),
            ),
            contentPadding: const EdgeInsets.all(16),
          ),
          validator: validator ?? (required ? (value) {
            if (value == null || value.trim().isEmpty) {
              return '$label is required';
            }
            return null;
          } : null),
          onChanged: onChanged,
        ),
        if (error != null) ...[
          const SizedBox(height: 4),
          Text(
            error,
            style: const TextStyle(
              color: Colors.red,
              fontSize: 12,
            ),
          ),
        ],
      ],
    );
  }
}