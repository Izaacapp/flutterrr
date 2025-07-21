// lib/features/feed/presentation/screens/feed_screen.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../services/auth_service.dart';
import '../../../../services/post_service.dart';
import '../../data/graphql/post_queries.dart';
import 'create_post_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../widgets/like_button.dart';
import '../../../../widgets/avatar.dart';

class FeedScreen extends StatelessWidget {
  const FeedScreen({super.key});

  Widget _buildCreatePostTrigger(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;
    
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const CreatePostScreen(),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.all(8.0),
        padding: const EdgeInsets.all(16.0),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey[200]!),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 2,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Avatar(
              imageUrl: user?.avatar,
              name: user?.fullName ?? user?.username ?? 'User',
              size: 40,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user?.username ?? 'User',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'What\'s new?',
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeMessage(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16.0),
      padding: const EdgeInsets.all(24.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: const Column(
        children: [
          Icon(
            Icons.flight_takeoff,
            size: 48,
            color: Colors.grey,
          ),
          SizedBox(height: 16),
          Text(
            'Welcome to Passport Buddy!',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.black,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'There are no posts yet. Be the first to share your travel adventures!',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    print('📱 Building FeedScreen');
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Passport Buddy'),
            const SizedBox(width: 8),
            Icon(
              Icons.flight_takeoff,
              size: 24,
              color: AppColors.darkPurple,
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            color: AppColors.mediumPurple,
            onPressed: () {
              // Show logout dialog
              showDialog(
                context: context,
                builder: (BuildContext context) {
                  return AlertDialog(
                    title: const Text('Logout'),
                    content: const Text('Are you sure you want to logout?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Cancel'),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.pop(context);
                          context.read<AuthProvider>().logout();
                        },
                        child: const Text('Logout'),
                      ),
                    ],
                  );
                },
              );
            },
          ),
        ],
      ),
      body: Query(
        options: QueryOptions(
          document: gql(getPostsQuery),
          pollInterval: const Duration(seconds: 3), // Auto refresh every 3 seconds
          fetchPolicy: FetchPolicy.noCache, // Always fetch from network, no caching
        ),
        builder: (QueryResult result, {VoidCallback? refetch, FetchMore? fetchMore}) {
          // Handle errors
          if (result.hasException) {
            
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 60, color: Colors.red),
                  const SizedBox(height: 16),
                  const Text('Error loading posts'),
                  Container(
                    padding: const EdgeInsets.all(16),
                    margin: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Column(
                      children: [
                        if (result.exception?.graphqlErrors?.isNotEmpty ?? false) ...[
                          const Text('GraphQL Errors:', style: TextStyle(fontWeight: FontWeight.bold)),
                          ...result.exception!.graphqlErrors!.map((e) => Text('• ${e.message}')),
                          const SizedBox(height: 8),
                        ],
                        if (result.exception?.linkException != null) ...[
                          const Text('Network Error:', style: TextStyle(fontWeight: FontWeight.bold)),
                          Text('${result.exception?.linkException}'),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: refetch,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          // Handle loading
          if (result.isLoading && result.data == null) {
            return const Center(child: CircularProgressIndicator());
          }

          // Get posts from result
          final List posts = result.data?['posts'] ?? [];

          // Show posts (including when empty - we always want to show the create post trigger)
          return RefreshIndicator(
            onRefresh: () async {
              // FIX: Properly handle the refetch as a Future
              if (refetch != null) {
                refetch();
                // Wait a bit for the refetch to complete
                await Future.delayed(const Duration(milliseconds: 500));
              }
            },
            child: ListView.builder(
              itemCount: posts.length + 1 + (posts.isEmpty ? 1 : 0), // Add 1 for create post, +1 for welcome message if empty
              itemBuilder: (context, index) {
                // Show create post widget as the first item
                if (index == 0) {
                  return _buildCreatePostTrigger(context);
                }
                
                // Show welcome message if no posts
                if (posts.isEmpty && index == 1) {
                  return _buildWelcomeMessage(context);
                }
                
                final post = posts[index - 1 - (posts.isEmpty ? 1 : 0)]; // Adjust index for posts and welcome message
                return Card(
                    margin: const EdgeInsets.all(8.0),
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: AppColors.lightPeriwinkle, width: 1),
                    ),
                    child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Author Header
                      if (post['author'] != null)
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Row(
                            children: [
                              // Avatar
                              Avatar(
                                imageUrl: post['author']['avatar'],
                                name: post['author']['fullName'] ?? post['author']['username'] ?? 'User',
                                size: 40,
                              ),
                              const SizedBox(width: 12),
                              // Username and time
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      post['author']['username'] ?? 'anonymous',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14,
                                      ),
                                    ),
                                    Text(
                                      _formatDate(post['createdAt']),
                                      style: TextStyle(
                                        color: Colors.grey[600],
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // More options button
                              IconButton(
                                icon: const Icon(Icons.more_horiz),
                                color: AppColors.mediumPurple,
                                onPressed: () {},
                              ),
                            ],
                          ),
                        ),
                      // Post Content
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        child: Text(
                          post['content'] ?? '',
                          style: const TextStyle(fontSize: 16),
                        ),
                      ),
                      // Display images if available
                      if (post['images'] != null && (post['images'] as List).isNotEmpty) ...[
                        SizedBox(
                            height: 200,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: (post['images'] as List).length,
                              itemBuilder: (context, imageIndex) {
                                final image = post['images'][imageIndex];
                                print('Feed image URL: ${image['url']}');
                                return GestureDetector(
                                  onDoubleTap: () async {
                                    // Double tap to like
                                    final prefs = await SharedPreferences.getInstance();
                                    final userJson = prefs.getString('passport_buddy_user');
                                    if (userJson != null) {
                                      final userData = jsonDecode(userJson);
                                      final currentUserId = userData['id'];
                                      final likes = post['likes'] as List? ?? [];
                                      final likesList = likes.map((e) => e.toString()).toList();
                                      final isLiked = likesList.contains(currentUserId);
                                      
                                      // Only like if not already liked
                                      if (!isLiked) {
                                        try {
                                          await PostService.toggleLike(post['_id']);
                                          if (refetch != null) {
                                            refetch();
                                          }
                                        } catch (e) {
                                          // Silent error handling for double tap
                                        }
                                      }
                                    }
                                  },
                                  onTap: () {
                                    // Debug: Print the image URL
                                    print('Opening image URL: ${image['url']}');
                                    
                                    // Open image in full screen
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
                                                image['url'],
                                                errorBuilder: (context, error, stackTrace) {
                                                  print('Image load error: $error');
                                                  return Column(
                                                    mainAxisAlignment: MainAxisAlignment.center,
                                                    children: [
                                                      const Icon(
                                                        Icons.error_outline,
                                                        color: Colors.white,
                                                        size: 64,
                                                      ),
                                                      const SizedBox(height: 16),
                                                      Text(
                                                        'Failed to load image',
                                                        style: const TextStyle(color: Colors.white),
                                                      ),
                                                      const SizedBox(height: 8),
                                                      Text(
                                                        image['url'],
                                                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                                                        textAlign: TextAlign.center,
                                                      ),
                                                    ],
                                                  );
                                                },
                                                loadingBuilder: (context, child, loadingProgress) {
                                                  if (loadingProgress == null) return child;
                                                  return const Center(
                                                    child: CircularProgressIndicator(
                                                      color: Colors.white,
                                                    ),
                                                  );
                                                },
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                                  child: Container(
                                    margin: const EdgeInsets.only(right: 8),
                                    width: 200,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(8),
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
                      // Action buttons (Like, Comment, Share, Save)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8.0),
                        child: Row(
                          children: [
                            // Like button
                            FutureBuilder<String?>(
                              future: SharedPreferences.getInstance().then((prefs) {
                                final userJson = prefs.getString('passport_buddy_user');
                                if (userJson != null) {
                                  final userData = jsonDecode(userJson);
                                  return userData['id'];
                                }
                                return null;
                              }),
                              builder: (context, snapshot) {
                                final currentUserId = snapshot.data;
                                final likes = post['likes'] as List? ?? [];
                                
                                // Convert likes list to List<String> for proper comparison
                                final likesList = likes.map((e) => e.toString()).toList();
                                final isLiked = currentUserId != null && likesList.contains(currentUserId);
                                
                                return LikeButton(
                                  isLiked: isLiked,
                                  onPressed: () async {
                                    try {
                                      await PostService.toggleLike(post['_id']);
                                      
                                      // Force immediate refetch
                                      if (refetch != null) {
                                        refetch();
                                      }
                                    } catch (e) {
                                      print('Error toggling like: $e');
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text('Failed to like post: $e')),
                                      );
                                    }
                                  },
                                );
                              },
                            ),
                            // Comment button
                            IconButton(
                              icon: CustomPaint(
                                size: const Size(24, 24),
                                painter: CircularCommentPainter(color: AppColors.mediumPurple),
                              ),
                              onPressed: () {
                                // TODO: Implement comment functionality
                              },
                            ),
                            // Share button
                            IconButton(
                              icon: const Icon(Icons.share_outlined, color: AppColors.mediumPurple),
                              onPressed: () {
                                // TODO: Implement share functionality
                              },
                            ),
                            const Spacer(),
                            // Save button
                            IconButton(
                              icon: const Icon(Icons.bookmark_border, color: AppColors.mediumPurple),
                              onPressed: () {
                                // TODO: Implement save functionality
                              },
                            ),
                          ],
                        ),
                      ),
                      // Likes count
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: Text(
                          '${(post['likes'] as List? ?? []).length} likes',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppColors.darkPurple,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                );
              },
            ),
          );
        },
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

// Custom painter for circular comment icon (matches web)
class CircularCommentPainter extends CustomPainter {
  final Color color;
  
  CircularCommentPainter({required this.color});
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    
    final path = Path();
    
    // Create circular bubble with tail
    // M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22l-1.344-4.992Z
    
    // Draw the circle
    final center = Offset(size.width * 0.45, size.height * 0.45);
    final radius = size.width * 0.35;
    
    path.addOval(Rect.fromCircle(center: center, radius: radius));
    
    // Add the tail pointing to bottom right
    path.moveTo(size.width * 0.7, size.height * 0.7);
    path.lineTo(size.width * 0.9, size.height * 0.9);
    path.lineTo(size.width * 0.65, size.height * 0.8);
    
    canvas.drawPath(path, paint);
  }
  
  @override
  bool shouldRepaint(CircularCommentPainter oldDelegate) => oldDelegate.color != color;
}