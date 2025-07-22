import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/auth_provider.dart';
import '../core/theme/app_theme.dart';
import '../widgets/avatar.dart';
import '../services/user_service.dart';
import '../features/feed/data/graphql/post_queries.dart';
import '../core/api/api_config.dart';

class UserProfilePage extends StatefulWidget {
  final String userId;
  final String username;
  
  const UserProfilePage({
    super.key,
    required this.userId,
    required this.username,
  });

  @override
  State<UserProfilePage> createState() => _UserProfilePageState();
}

class _UserProfilePageState extends State<UserProfilePage> {
  bool _isBlocked = false;
  bool _isBlockLoading = false;
  bool _showBlockConfirm = false;
  bool _isFollowing = false;
  bool _isFollowLoading = false;
  Map<String, dynamic>? _userProfile;
  bool _isLoading = true;
  List<dynamic> _userPosts = [];
  int _followersCount = 0;
  int _followingCount = 0;

  @override
  void initState() {
    super.initState();
    _fetchUserProfile();
  }

  Future<void> _fetchUserProfile() async {
    try {
      // Get auth token
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('passport_buddy_token');
      
      // Get base URL
      final endpoint = await ApiConfig.discoverEndpoint();
      final baseUrl = endpoint.replaceAll('/graphql', '');
      
      // Fetch user profile by username
      final response = await http.get(
        Uri.parse('$baseUrl/api/users/profile/${widget.username}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final userData = responseData['data']['user'];
        setState(() {
          _userProfile = userData;
          _isBlocked = userData['isBlocked'] ?? false;
          _isFollowing = userData['isFollowing'] ?? false;
          _followersCount = userData['followersCount'] ?? 0;
          _followingCount = userData['followingCount'] ?? 0;
          _isLoading = false;
        });
        
        // Fetch user posts after build
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _fetchUserPosts();
        });
      } else {
        throw Exception('Failed to load user profile');
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load profile: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
  
  Future<void> _fetchUserPosts() async {
    try {
      final client = GraphQLProvider.of(context).value;
      final result = await client.query(
        QueryOptions(
          document: getPostsDocument, // Use the regular posts query
          fetchPolicy: FetchPolicy.noCache,
        ),
      );

      if (!result.hasException && result.data != null) {
        final allPosts = result.data!['posts'] ?? [];
        // Filter posts by the current user
        final userPosts = (allPosts as List).where((post) {
          return post['author'] != null && post['author']['_id'] == widget.userId;
        }).toList();
        
        setState(() {
          _userPosts = userPosts;
        });
      }
    } catch (e) {
      // Silent error handling for posts
    }
  }

  Future<void> _handleBlockToggle() async {
    setState(() {
      _showBlockConfirm = true;
    });
  }

  Future<void> _confirmBlock() async {
    setState(() {
      _isBlockLoading = true;
      _showBlockConfirm = false;
    });

    try {
      if (_isBlocked) {
        await UserService.unblockUser(widget.userId);
        setState(() {
          _isBlocked = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('User unblocked successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        await UserService.blockUser(widget.userId);
        setState(() {
          _isBlocked = true;
          // Automatically unfollow when blocking
          if (_isFollowing) {
            _isFollowing = false;
            _followersCount = _followersCount > 0 ? _followersCount - 1 : 0;
          }
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('User blocked successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to ${_isBlocked ? 'unblock' : 'block'} user'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isBlockLoading = false;
      });
      // Refresh profile data after block/unblock
      _fetchUserProfile();
    }
  }

  Future<void> _handleFollowToggle() async {
    if (_isFollowLoading) return;
    
    setState(() {
      _isFollowLoading = true;
    });

    try {
      if (_isFollowing) {
        await UserService.unfollowUser(widget.userId);
        setState(() {
          _isFollowing = false;
          _followersCount = _followersCount > 0 ? _followersCount - 1 : 0;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('User unfollowed successfully'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      } else {
        await UserService.followUser(widget.userId);
        setState(() {
          _isFollowing = true;
          _followersCount = _followersCount + 1;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('User followed successfully'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (e) {
      // Revert the optimistic update
      setState(() {
        if (_isFollowing) {
          _followersCount = _followersCount > 0 ? _followersCount - 1 : 0;
        } else {
          _followersCount = _followersCount + 1;
        }
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to update follow status'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 3),
          ),
        );
      }
    } finally {
      setState(() {
        _isFollowLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final currentUser = authProvider.user;
    final isOwnProfile = currentUser?.id == widget.userId;

    return Scaffold(
      appBar: AppBar(
        title: Text('@${widget.username}'),
        centerTitle: true,
        actions: !isOwnProfile ? [
          PopupMenuButton<String>(
            icon: Icon(Icons.more_horiz, color: AppColors.mediumPurple),
            offset: const Offset(0, 40),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            onSelected: (String value) {
              if (value == 'block') {
                _handleBlockToggle();
              }
            },
            itemBuilder: (BuildContext context) => [
              PopupMenuItem<String>(
                value: 'block',
                child: Row(
                  children: [
                    Icon(
                      _isBlocked ? Icons.block_outlined : Icons.block,
                      color: Colors.red[600],
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      _isBlocked ? 'Unblock User' : 'Block User',
                      style: TextStyle(
                        color: Colors.red[600],
                        fontSize: 15,
                        fontFamily: 'SF Pro Text',
                        fontWeight: FontWeight.w500,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ] : [],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchUserProfile,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  children: [
                    const SizedBox(height: 24),
                    // Blocked user notice
                    if (_isBlocked)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.red[50],
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.red[200]!),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.block, color: Colors.red[600], size: 20),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'You have blocked this user',
                                  style: TextStyle(
                                    color: Colors.red[600],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    
                    // Profile header
                    Avatar(
                      imageUrl: _userProfile?['avatar'],
                      name: _userProfile?['fullName'] ?? _userProfile?['username'] ?? widget.username,
                      size: 100,
                    ),
                    const SizedBox(height: 16),
                    if (_userProfile?['fullName'] != null && _userProfile!['fullName'].toString().isNotEmpty)
                      Text(
                        _userProfile!['fullName'],
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                    if (_userProfile?['fullName'] != null && _userProfile!['fullName'].toString().isNotEmpty)
                      const SizedBox(height: 4),
                    Text(
                      '@${_userProfile?['username'] ?? widget.username}',
                      style: TextStyle(
                        fontSize: _userProfile?['fullName'] != null && _userProfile!['fullName'].toString().isNotEmpty ? 16 : 20,
                        color: _userProfile?['fullName'] != null && _userProfile!['fullName'].toString().isNotEmpty ? Colors.grey[600] : Colors.black87,
                        fontWeight: _userProfile?['fullName'] != null && _userProfile!['fullName'].toString().isNotEmpty ? FontWeight.normal : FontWeight.bold,
                      ),
                    ),
                    
                    // Bio
                    if (_userProfile?['bio'] != null && _userProfile!['bio'].isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          _userProfile!['bio'],
                          style: const TextStyle(
                            fontSize: 15,
                            height: 1.4,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                    
                    // Location and airport info
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (_userProfile?['location'] != null) ...[
                          Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Text(
                            _userProfile!['location'],
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(width: 16),
                        ],
                        if (_userProfile?['homeAirport'] != null) ...[
                          Icon(Icons.flight_takeoff, size: 16, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Text(
                            _userProfile!['homeAirport'],
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ],
                    ),
                    
                    // Stats row
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: Colors.grey[200]!),
                          bottom: BorderSide(color: Colors.grey[200]!),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _buildStatColumn('Posts', _userPosts.length.toString()),
                          _buildStatColumn('Followers', _followersCount.toString()),
                          _buildStatColumn('Following', _followingCount.toString()),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Follow button (only if not blocked)
                    if (!isOwnProfile && !_isBlocked)
                      SizedBox(
                        width: 200,
                        child: ElevatedButton(
                          onPressed: _isFollowLoading ? null : _handleFollowToggle,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _isFollowing ? Colors.white : AppColors.mediumPurple,
                            foregroundColor: _isFollowing ? AppColors.mediumPurple : Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                              side: BorderSide(
                                color: AppColors.mediumPurple,
                                width: _isFollowing ? 1.5 : 0,
                              ),
                            ),
                            elevation: _isFollowing ? 0 : 2,
                          ),
                          child: _isFollowLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text(
                                  _isFollowing ? 'Following' : 'Follow',
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                    
                    const SizedBox(height: 32),
                    
                    // Travel Stats
                    if (!_isBlocked && (_userProfile?['milesFlown'] != null || 
                        _userProfile?['countriesVisited'] != null)) ...[
                      Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              const Text(
                                'Travel Stats',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                children: [
                                  if (_userProfile?['milesFlown'] != null)
                                    _buildTravelStat(
                                      Icons.straighten,
                                      '${_userProfile!['milesFlown']}',
                                      'Miles Flown',
                                    ),
                                  if (_userProfile?['flightHours'] != null)
                                    _buildTravelStat(
                                      Icons.schedule,
                                      '${_userProfile!['flightHours']}',
                                      'Flight Hours',
                                    ),
                                  if (_userProfile?['countriesVisited'] != null)
                                    _buildTravelStat(
                                      Icons.public,
                                      '${(_userProfile!['countriesVisited'] as List?)?.length ?? 0}',
                                      'Countries',
                                    ),
                                  if (_userProfile?['passportCountry'] != null)
                                    _buildTravelStat(
                                      Icons.flag,
                                      _userProfile!['passportCountry'],
                                      'Passport',
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                    
                    // User posts section
                    if (!_isBlocked) ...[
                      const SizedBox(height: 24),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: [
                            Icon(Icons.grid_on, color: AppColors.mediumPurple),
                            const SizedBox(width: 8),
                            const Text(
                              'Posts',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (_userPosts.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            children: [
                              Icon(
                                Icons.photo_camera_outlined,
                                size: 48,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'No posts yet',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _userPosts.length,
                          itemBuilder: (context, index) {
                            final post = _userPosts[index];
                            return _buildPostCard(post);
                          },
                        ),
                    ],
                  ],
                ),
              ),
            ),
      
      // Block confirmation dialog
      bottomSheet: _showBlockConfirm ? _buildBlockConfirmDialog() : null,
    );
  }

  Widget _buildBlockConfirmDialog() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 10,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  color: Colors.orange[700],
                  size: 28,
                ),
                const SizedBox(width: 12),
                Text(
                  _isBlocked ? 'Unblock User?' : 'Block User?',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'SF Pro Display',
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              _isBlocked
                  ? 'Are you sure you want to unblock @${widget.username}?'
                  : 'Are you sure you want to block @${widget.username}? They won\'t be able to see your posts or interact with you.',
              style: const TextStyle(
                fontSize: 15,
                height: 1.5,
                fontFamily: 'SF Pro Text',
                letterSpacing: -0.2,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () {
                      setState(() {
                        _showBlockConfirm = false;
                      });
                    },
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text(
                      'Cancel',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 16,
                        fontFamily: 'SF Pro Text',
                        fontWeight: FontWeight.w500,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isBlockLoading ? null : _confirmBlock,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: _isBlockLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            _isBlocked ? 'Unblock' : 'Block',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'SF Pro Text',
                              letterSpacing: -0.3,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildStatColumn(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }
  
  Widget _buildTravelStat(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, size: 24, color: AppColors.darkPurple),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }
  
  Widget _buildPostCard(Map<String, dynamic> post) {
    return Container(
      margin: const EdgeInsets.only(bottom: 0),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(
            color: Colors.grey[200]!,
            width: 1,
          ),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Small avatar on the left
            Avatar(
              imageUrl: _userProfile?['avatar'],
              name: _userProfile?['fullName'] ?? _userProfile?['username'] ?? widget.username,
              size: 36,
            ),
            const SizedBox(width: 12),
            // Post content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Username and time
                  Row(
                    children: [
                      Text(
                        _userProfile?['username'] ?? widget.username,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatDate(post['createdAt']),
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  // Post content
                  Text(
                    post['content'] ?? '',
                    style: const TextStyle(
                      fontSize: 15,
                      height: 1.3,
                    ),
                  ),
                  
                  // Images
                  if (post['images'] != null && (post['images'] as List).isNotEmpty) ...[
                    const SizedBox(height: 12),
                    if ((post['images'] as List).length == 1)
                      // Single image
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: GestureDetector(
                          onTap: () => _openImage(post['images'][0]['url']),
                          child: Image.network(
                            post['images'][0]['url'],
                            fit: BoxFit.cover,
                            width: double.infinity,
                            height: 250,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                height: 250,
                                color: Colors.grey[200],
                                child: const Center(
                                  child: Icon(Icons.error_outline),
                                ),
                              );
                            },
                          ),
                        ),
                      )
                    else
                      // Multiple images in a grid
                      SizedBox(
                        height: 200,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: (post['images'] as List).length,
                          itemBuilder: (context, index) {
                            final image = post['images'][index];
                            return GestureDetector(
                              onTap: () => _openImage(image['url']),
                              child: Container(
                                margin: const EdgeInsets.only(right: 8),
                                width: 150,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  image: DecorationImage(
                                    image: NetworkImage(image['url']),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                  ],
                  
                  // Action buttons
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      // Like button
                      Row(
                        children: [
                          Icon(
                            Icons.favorite_outline,
                            size: 22,
                            color: Colors.grey[700],
                          ),
                          if ((post['likes'] as List? ?? []).isNotEmpty) ...[
                            const SizedBox(width: 4),
                            Text(
                              '${(post['likes'] as List).length}',
                              style: TextStyle(
                                color: Colors.grey[700],
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(width: 20),
                      // Comment button
                      Row(
                        children: [
                          Icon(
                            Icons.mode_comment_outlined,
                            size: 20,
                            color: Colors.grey[700],
                          ),
                          if ((post['comments'] as List? ?? []).isNotEmpty) ...[
                            const SizedBox(width: 4),
                            Text(
                              '${(post['comments'] as List).length}',
                              style: TextStyle(
                                color: Colors.grey[700],
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(width: 20),
                      // Share button
                      Icon(
                        Icons.share_outlined,
                        size: 20,
                        color: Colors.grey[700],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  void _openImage(String imageUrl) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
          ),
          body: Center(
            child: InteractiveViewer(
              child: Image.network(
                imageUrl,
                errorBuilder: (context, error, stackTrace) {
                  return const Icon(
                    Icons.error_outline,
                    color: Colors.white,
                    size: 64,
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
  
  String _formatDate(String? dateString) {
    if (dateString == null) return 'Unknown';
    
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays > 0) {
        return '${difference.inDays}d ago';
      } else if (difference.inHours > 0) {
        return '${difference.inHours}h ago';
      } else if (difference.inMinutes > 0) {
        return '${difference.inMinutes}m ago';
      } else {
        return 'just now';
      }
    } catch (e) {
      return 'Unknown';
    }
  }
}