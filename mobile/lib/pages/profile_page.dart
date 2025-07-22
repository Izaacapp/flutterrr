import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'package:http/http.dart' as http;
import '../providers/auth_provider.dart';
import '../core/theme/app_theme.dart';
import '../core/api/api_config.dart';
import '../widgets/avatar.dart';
import '../services/post_service.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final ImagePicker _picker = ImagePicker();
  File? _selectedImage;
  bool _isUploading = false;
  Map<String, dynamic>? _userStats;
  bool _isLoadingStats = false;
  List<dynamic> _userPosts = [];
  bool _isLoadingPosts = false;

  @override
  void initState() {
    super.initState();
    _fetchUserStats();
    _fetchUserPosts();
    _refreshUserProfile();
  }

  Future<void> _refreshUserProfile() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.refreshUserProfile();
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _fetchUserStats() async {
    setState(() {
      _isLoadingStats = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = await authProvider.getAuthToken();
      
      if (token != null) {
        final apiUrl = await ApiConfig.discoverEndpoint();
        final baseUrl = apiUrl.replaceAll('/graphql', '');
        
        final response = await http.get(
          Uri.parse('$baseUrl/api/users/profile'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        );

        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          if (mounted) {
            setState(() {
              _userStats = data['data']['user'];
            });
          }
        }
      }
    } catch (e) {
      print('Error fetching user stats: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingStats = false;
        });
      }
    }
  }

  Future<void> _fetchUserPosts() async {
    setState(() {
      _isLoadingPosts = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      final token = await authProvider.getAuthToken();
      
      if (user?.id != null && token != null) {
        final apiUrl = await ApiConfig.discoverEndpoint();
        
        // Use GraphQL to fetch user posts
        final query = '''
          query GetUserPosts(\$userId: ID!) {
            userPosts(userId: \$userId) {
              _id
              content
              author {
                _id
                username
                fullName
                avatar
              }
              images {
                url
              }
              likes
              comments {
                _id
              }
              createdAt
            }
          }
        ''';
        
        final response = await http.post(
          Uri.parse(apiUrl),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: json.encode({
            'query': query,
            'variables': {
              'userId': user!.id,
            },
          }),
        );

        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          if (mounted && data['data'] != null) {
            setState(() {
              _userPosts = data['data']['userPosts'] ?? [];
            });
            // Debug: Log first post's author data if available
            if (_userPosts.isNotEmpty && _userPosts[0]['author'] != null) {
              print('First post author data: ${_userPosts[0]['author']}');
            }
          }
        } else {
          print('Error response: ${response.body}');
        }
      }
    } catch (e) {
      print('Error fetching user posts: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingPosts = false;
        });
      }
    }
  }

  void _handleDeletePost(String postId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Row(
            children: [
              Icon(
                Icons.warning_amber_rounded,
                color: Colors.orange[700],
                size: 28,
              ),
              const SizedBox(width: 12),
              const Text(
                'Delete Post?',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          content: const Text(
            'This action cannot be undone. Are you sure you want to delete this post?',
            style: TextStyle(
              fontSize: 15,
              height: 1.5,
              color: Colors.black87,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              child: Text(
                'Cancel',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                await _confirmDeletePost(postId);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Delete',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _confirmDeletePost(String postId) async {
    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return const Center(
          child: CircularProgressIndicator(
            color: AppColors.mediumPurple,
          ),
        );
      },
    );
    
    try {
      await PostService.deletePost(postId);
      
      if (mounted) {
        Navigator.pop(context); // Dismiss loading
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 12),
                const Text('Post deleted successfully'),
              ],
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        );
        
        // Refresh posts
        _fetchUserPosts();
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Dismiss loading
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Failed to delete post',
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              GestureDetector(
                onTap: _selectedImage == null ? _showImagePickerOptions : null,
                child: Stack(
                  children: [
                    ClipOval(
                      child: _selectedImage != null
                          ? SizedBox(
                              width: 120,
                              height: 120,
                              child: Image.file(
                                _selectedImage!,
                                fit: BoxFit.cover,
                                width: 120,
                                height: 120,
                              ),
                            )
                          : Avatar(
                              imageUrl: user?.avatar,
                              name: user?.fullName ?? user?.username ?? 'User',
                              size: 120,
                            ),
                    ),
                    if (_selectedImage == null)
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.mediumPurple,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.camera_alt,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              if (_selectedImage != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.ultraLight,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.lightPeriwinkle),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      ElevatedButton(
                        onPressed: _isUploading ? null : _uploadAvatar,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.mediumPurple,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        ),
                        child: _isUploading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Update Avatar'),
                      ),
                      TextButton(
                        onPressed: _isUploading ? null : () {
                          setState(() {
                            _selectedImage = null;
                          });
                        },
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        ),
                        child: Text(
                          'Cancel',
                          style: TextStyle(color: AppColors.darkPurple),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              Text(
                '@${user?.username ?? 'User'}',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                user?.fullName ?? 'Full Name',
                style: const TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 16),
              
              // Edit Profile Button
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, '/edit-profile');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.mediumPurple,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('Edit Profile'),
              ),
              const SizedBox(height: 32),
              
              // Travel Statistics
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      const Text(
                        'Travel Statistics',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Main statistics - 4 items
                      GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: 2,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: 1.4,
                        children: [
                          _buildStatCard(
                            Icons.flight_takeoff, 
                            _isLoadingStats ? '...' : '${_userStats?['totalFlights'] ?? user?.totalFlights ?? 0}', 
                            'Total Flights'
                          ),
                          _buildStatCard(
                            Icons.location_city, 
                            _isLoadingStats ? '...' : '${_userStats?['citiesVisited'] ?? user?.citiesVisited ?? 0}', 
                            'Cities Visited'
                          ),
                          _buildStatCard(
                            Icons.public, 
                            _isLoadingStats ? '...' : '${_userStats?['countriesVisited']?.length ?? user?.countriesVisited?.length ?? 0}', 
                            'Countries'
                          ),
                          _buildStatCard(
                            Icons.schedule, 
                            _isLoadingStats ? '...' : '${_userStats?['flightHours'] ?? user?.flightHours ?? 0}', 
                            'Flight Hours'
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Miles Statistics - Separate Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      const Text(
                        'Miles Statistics',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Miles statistics stacked vertically
                      Column(
                        children: [
                          _buildHorizontalMileStat(
                            Icons.straighten,
                            _isLoadingStats ? '...' : '${_userStats?['milesFlown'] ?? user?.milesFlown ?? 0}',
                            'Miles Flown',
                            null,
                            0,
                          ),
                          const SizedBox(height: 16),
                          _buildHorizontalEarthStat(
                            _isLoadingStats ? 0 : (_userStats?['milesFlown'] ?? user?.milesFlown ?? 0),
                          ),
                          const SizedBox(height: 16),
                          _buildHorizontalMoonStat(
                            _isLoadingStats ? 0 : (_userStats?['milesFlown'] ?? user?.milesFlown ?? 0),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // User Posts Feed - displayed as a simple feed
              _buildUserPostsFeed(),
              
              const SizedBox(height: 16),
              
              // Profile Information
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      const Text(
                        'Profile Information',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildInfoRow('Email', user?.email ?? 'N/A'),
                      const SizedBox(height: 12),
                      _buildInfoRow('Member Since', _formatMemberSince(user?.createdAt)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () {
                  authProvider.logout();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'Logout',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(IconData icon, String value, String label) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 22,
            color: AppColors.darkPurple,
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: Colors.grey,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          '$label:',
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        Text(
          value,
          style: const TextStyle(color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildEarthCard(int miles) {
    final timesAroundEarth = miles / 24901; // Earth's circumference in miles
    final progress = (timesAroundEarth % 1); // Get the decimal part for progress
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF4A90E2),
              border: Border.all(color: const Color(0xFF2E7D32), width: 0.5),
            ),
            child: CustomPaint(
              painter: EarthPainter(),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${timesAroundEarth.toStringAsFixed(1)}x',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 3),
          const Text(
            'Around Earth',
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          // Progress bar
          Container(
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: progress,
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF4A90E2),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMoonCard(int miles) {
    final timesToMoon = miles / 238855; // Average distance to the moon in miles
    final progress = timesToMoon > 1 ? 1.0 : timesToMoon;
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFFE8E8E8),
            ),
            child: CustomPaint(
              painter: MoonPainter(),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${timesToMoon.toStringAsFixed(2)}x',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 3),
          const Text(
            'To the Moon',
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          // Progress bar
          Container(
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: progress,
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFC0C0C0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHorizontalMileStat(IconData icon, String value, String label, Color? progressColor, double progress) {
    return Row(
      children: [
        Icon(
          icon,
          size: 28,
          color: AppColors.darkPurple,
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHorizontalEarthStat(int miles) {
    final timesAroundEarth = miles / 24901;
    final progress = (timesAroundEarth % 1);
    
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF4A90E2),
            border: Border.all(color: const Color(0xFF2E7D32), width: 0.5),
          ),
          child: CustomPaint(
            painter: EarthPainter(),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Around Earth',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  Text(
                    '${timesAroundEarth.toStringAsFixed(1)}x',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Container(
                height: 6,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(3),
                ),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: progress,
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF4A90E2),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHorizontalMoonStat(int miles) {
    final timesToMoon = miles / 238855;
    final progress = timesToMoon > 1 ? 1.0 : timesToMoon;
    
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: Color(0xFFE8E8E8),
          ),
          child: CustomPaint(
            painter: MoonPainter(),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'To the Moon',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  Text(
                    '${timesToMoon.toStringAsFixed(2)}x',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Container(
                height: 6,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(3),
                ),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: progress,
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFC0C0C0),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildUserPostsFeed() {
    if (_isLoadingPosts) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_userPosts.isEmpty) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
        child: const Center(
          child: Text(
            'No posts yet',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey,
            ),
          ),
        ),
      );
    }

    return Column(
      children: _userPosts.map((post) {
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: AppColors.lightPeriwinkle, width: 1),
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Post header
              Row(
                children: [
                  Avatar(
                    imageUrl: post['author']?['avatar'],
                    name: post['author']?['fullName'] ?? post['author']?['username'] ?? 'User',
                    size: 32,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          post['author']?['username'] ?? 'Unknown',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          _formatDate(post['createdAt']),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  // More options button - show for post author
                  PopupMenuButton<String>(
                    icon: Icon(Icons.more_horiz, color: AppColors.mediumPurple),
                    offset: const Offset(0, 40),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    onSelected: (String value) {
                      if (value == 'delete') {
                        _handleDeletePost(post['_id']);
                      }
                    },
                    itemBuilder: (BuildContext context) => [
                      PopupMenuItem<String>(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete_outline, color: Colors.red[600], size: 20),
                            const SizedBox(width: 12),
                            Text(
                              'Delete Post',
                              style: TextStyle(
                                color: Colors.red[600],
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Post content
              Text(
                post['content'] ?? '',
                style: const TextStyle(fontSize: 14),
              ),
              // Display images if available
              if (post['images'] != null && (post['images'] as List).isNotEmpty) ...[
                const SizedBox(height: 12),
                SizedBox(
                  height: 200,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: (post['images'] as List).length,
                    itemBuilder: (context, imageIndex) {
                      final image = post['images'][imageIndex];
                      return Container(
                        margin: const EdgeInsets.only(right: 8),
                        width: 200,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          image: DecorationImage(
                            image: NetworkImage(image['url']),
                            fit: BoxFit.cover,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
              const SizedBox(height: 12),
              // Post stats
              Row(
                children: [
                  Icon(
                    Icons.favorite,
                    size: 16,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${post['likes']?.length ?? 0}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Icon(
                    Icons.comment,
                    size: 16,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${post['comments']?.length ?? 0}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ],
          ),
          ),
        );
      }).toList(),
    );
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return '';
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);
      
      if (difference.inDays > 30) {
        return '${date.day}/${date.month}/${date.year}';
      } else if (difference.inDays > 0) {
        return '${difference.inDays}d ago';
      } else if (difference.inHours > 0) {
        return '${difference.inHours}h ago';
      } else if (difference.inMinutes > 0) {
        return '${difference.inMinutes}m ago';
      } else {
        return 'Just now';
      }
    } catch (e) {
      return '';
    }
  }

  String _formatMemberSince(String? createdAt) {
    if (createdAt == null) return 'Unknown';
    try {
      final date = DateTime.parse(createdAt);
      final months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return '${months[date.month - 1]} ${date.year}';
    } catch (e) {
      return 'Unknown';
    }
  }

  void _showImagePickerOptions() {
    showModalBottomSheet(
      context: context,
      builder: (BuildContext context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_camera),
                title: const Text('Take Photo'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Choose from Gallery'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.gallery);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        setState(() {
          _selectedImage = File(pickedFile.path);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to pick image: $e')),
        );
      }
    }
  }

  Future<void> _uploadAvatar() async {
    if (_selectedImage == null) return;

    setState(() {
      _isUploading = true;
    });

    try {
      final dio = Dio();
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = await authProvider.getAuthToken();

      // Use dynamic API discovery like other parts of the app
      final apiUrl = await ApiConfig.discoverEndpoint();
      final baseUrl = apiUrl.replaceAll('/graphql', '');

      // Get the actual filename and extension
      final filename = _selectedImage!.path.split('/').last;
      final extension = filename.split('.').last.toLowerCase();
      
      final formData = FormData.fromMap({
        'avatar': await MultipartFile.fromFile(
          _selectedImage!.path,
          filename: 'avatar.$extension',
        ),
      });

      final response = await dio.post(
        '$baseUrl/api/users/avatar',
        data: formData,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
          },
        ),
      );

      if (response.statusCode == 200) {
        setState(() {
          _selectedImage = null;
        });
        
        // Refresh user data by reinitializing
        await authProvider.refresh();
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Avatar updated successfully')),
          );
        }
      }
    } catch (e) {
      print('Avatar upload error: $e');
      String errorMessage = 'Failed to upload avatar';
      
      if (e is DioException) {
        print('DioException details: ${e.response?.data}');
        errorMessage = 'Failed to upload avatar: ${e.response?.statusCode} - ${e.response?.data}';
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMessage)),
        );
      }
    } finally {
      setState(() {
        _isUploading = false;
      });
    }
  }
}

// Custom painter for Earth icon
class EarthPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint();
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    
    // Draw meridians
    paint.color = const Color(0xFF2E7D32);
    paint.style = PaintingStyle.stroke;
    paint.strokeWidth = 0.5;
    
    // Vertical meridian
    canvas.drawLine(Offset(center.dx, 0), Offset(center.dx, size.height), paint);
    
    // Horizontal equator
    canvas.drawLine(Offset(0, center.dy), Offset(size.width, center.dy), paint);
    
    // Draw some continents (simplified)
    paint.style = PaintingStyle.fill;
    paint.color = const Color(0xFF2E7D32).withOpacity(0.3);
    
    // Simple continent shapes
    final path = Path();
    // Africa/Europe
    path.moveTo(center.dx + radius * 0.2, center.dy - radius * 0.3);
    path.quadraticBezierTo(
      center.dx + radius * 0.3, center.dy,
      center.dx + radius * 0.2, center.dy + radius * 0.4
    );
    path.close();
    canvas.drawPath(path, paint);
    
    // Americas
    final path2 = Path();
    path2.moveTo(center.dx - radius * 0.4, center.dy - radius * 0.2);
    path2.quadraticBezierTo(
      center.dx - radius * 0.3, center.dy,
      center.dx - radius * 0.4, center.dy + radius * 0.3
    );
    path2.close();
    canvas.drawPath(path2, paint);
  }
  
  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}

// Custom painter for Moon icon
class MoonPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint();
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    
    // Draw craters
    paint.color = const Color(0xFFC0C0C0);
    paint.style = PaintingStyle.fill;
    
    // Crater 1
    canvas.drawCircle(Offset(center.dx - radius * 0.3, center.dy - radius * 0.3), radius * 0.2, paint);
    
    // Crater 2
    canvas.drawCircle(Offset(center.dx + radius * 0.3, center.dy - radius * 0.1), radius * 0.15, paint);
    
    // Crater 3
    canvas.drawCircle(Offset(center.dx, center.dy + radius * 0.3), radius * 0.1, paint);
    
    // Crater 4
    canvas.drawCircle(Offset(center.dx + radius * 0.35, center.dy + radius * 0.35), radius * 0.18, paint);
    
    // Crater 5
    canvas.drawCircle(Offset(center.dx - radius * 0.4, center.dy + radius * 0.1), radius * 0.08, paint);
    
    // Add shadow effect
    paint.color = const Color(0xFFC0C0C0).withOpacity(0.2);
    final shadowPath = Path();
    shadowPath.addArc(
      Rect.fromCircle(center: center, radius: radius),
      -3.14 / 4,
      3.14 / 2,
    );
    shadowPath.close();
    canvas.drawPath(shadowPath, paint);
  }
  
  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}