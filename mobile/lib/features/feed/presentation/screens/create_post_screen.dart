// lib/features/feed/presentation/screens/create_post_screen.dart
import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../data/graphql/post_queries.dart';
import 'package:provider/provider.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../widgets/avatar.dart';

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final TextEditingController _controller = TextEditingController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      setState(() {}); // Rebuild to update button state
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.black, size: 28),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'New thread',
          style: TextStyle(
            color: Colors.black,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: Colors.grey[100],
            height: 1,
          ),
        ),
      ),
      body: Mutation(
        options: MutationOptions(
          document: gql(createPostMutation),
          // This function is called to update the cache after a successful mutation.
          update: (GraphQLDataProxy cache, QueryResult? result) {
            if (result == null || result.hasException || result.data == null) {
              return;
            }
            
            // Read the existing posts from the cache.
            final request = Request(
              operation: Operation(document: gql(getPostsQuery)),
            );
            
            final existingData = cache.readQuery(request);
            if (existingData != null) {
              // Add the new post to the beginning of the list.
              final newPost = result.data!['createPost'];
              final updatedPosts = [newPost, ...existingData['posts']];
              
              // Write the updated list back to the cache.
              cache.writeQuery(request, data: {'posts': updatedPosts});
            }
          },
          // This function is called when the mutation is successfully completed.
          onCompleted: (dynamic resultData) {
            if (resultData != null) {
              // Navigate back to the previous screen on success.
              Navigator.of(context).pop();
            }
          },
          // This function is called if the mutation results in an error.
          onError: (error) {
            String errorMessage;
            // Safely handle different types of errors.
            if (error != null && error.graphqlErrors.isNotEmpty) {
              // If there are specific errors from the GraphQL server, display the first one.
              errorMessage = error.graphqlErrors.first.message;
            } else if (error != null && error.linkException != null) {
              // If there is a network or link error, show a generic connection error message.
              errorMessage = 'Connection error. Please check your network and try again.';
            } else {
              // A fallback for any other unknown errors.
              errorMessage = 'An unknown error occurred.';
            }

            // Show the error message in a SnackBar.
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Failed to create post: $errorMessage'),
                backgroundColor: Theme.of(context).colorScheme.error,
              ),
            );
          },
        ),
        builder: (RunMutation runMutation, QueryResult? result) {
          return Form(
            key: _formKey,
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Column(
                          children: [
                            Avatar(
                              imageUrl: user?.avatar,
                              name: user?.fullName ?? user?.username ?? 'User',
                              size: 40,
                            ),
                            const SizedBox(height: 8),
                            Container(
                              width: 2,
                              height: 80,
                              color: Colors.grey[300],
                              margin: const EdgeInsets.only(top: 4),
                            ),
                          ],
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
                                ),
                              ),
                              const SizedBox(height: 4),
                              TextFormField(
                                controller: _controller,
                                decoration: const InputDecoration(
                                  hintText: 'What\'s new?',
                                  hintStyle: TextStyle(
                                    color: Colors.grey,
                                    fontSize: 15,
                                  ),
                                  border: InputBorder.none,
                                  enabledBorder: InputBorder.none,
                                  focusedBorder: InputBorder.none,
                                  errorBorder: InputBorder.none,
                                  focusedErrorBorder: InputBorder.none,
                                  contentPadding: EdgeInsets.all(12.0),
                                  fillColor: Colors.transparent,
                                  filled: true,
                                ),
                                validator: (value) => (value?.isEmpty ?? true) ? 'Thread cannot be empty' : null,
                                maxLines: null,
                                minLines: 3,
                                autofocus: true,
                                style: const TextStyle(
                                  fontSize: 15,
                                  height: 1.5,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  _MediaButton(
                                    icon: Icons.image_outlined,
                                    onPressed: () {},
                                  ),
                                  const SizedBox(width: 8),
                                  _MediaButton(
                                    icon: Icons.videocam_outlined,
                                    onPressed: () {},
                                  ),
                                  const SizedBox(width: 8),
                                  _MediaButton(
                                    icon: Icons.location_on_outlined,
                                    onPressed: () {},
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border(
                      top: BorderSide(color: Colors.grey[200]!),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Anyone can reply',
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: 13,
                        ),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _controller.text.trim().isEmpty
                              ? Colors.grey[100]
                              : Colors.black,
                          foregroundColor: _controller.text.trim().isEmpty
                              ? Colors.grey
                              : Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 10,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                        onPressed: (result?.isLoading ?? false) || _controller.text.trim().isEmpty
                            ? null
                            : () {
                                if (_formKey.currentState!.validate()) {
                                  runMutation({'content': _controller.text});
                                }
                              },
                        child: (result?.isLoading ?? false)
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text(
                                'Post',
                                style: TextStyle(
                                  fontWeight: FontWeight.w500,
                                  fontSize: 15,
                                ),
                              ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

class _MediaButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;

  const _MediaButton({
    required this.icon,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          size: 18,
          color: Colors.grey[600],
        ),
      ),
    );
  }
}
