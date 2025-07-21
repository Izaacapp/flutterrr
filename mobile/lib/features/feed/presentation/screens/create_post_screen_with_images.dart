import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
import '../../../../core/api/api_config.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../widgets/avatar.dart';

class CreatePostScreenWithImages extends StatefulWidget {
  const CreatePostScreenWithImages({super.key});

  @override
  State<CreatePostScreenWithImages> createState() => _CreatePostScreenWithImagesState();
}

class _CreatePostScreenWithImagesState extends State<CreatePostScreenWithImages> {
  final TextEditingController _controller = TextEditingController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final ImagePicker _picker = ImagePicker();
  final List<XFile> _selectedImages = [];
  XFile? _selectedVideo;
  bool _isUploading = false;
  final int _maxCaptionLength = 500;
  Map<String, dynamic>? _selectedLocation;
  
  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      setState(() {}); // Rebuild when text changes to update button state
    });
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1200,
    );

    if (image != null) {
      setState(() {
        _selectedImages.clear();
        _selectedImages.add(image);
        _selectedVideo = null;
      });
    }
  }
  
  Future<void> _pickVideo() async {
    final XFile? video = await _picker.pickVideo(
      source: ImageSource.gallery,
      maxDuration: const Duration(minutes: 1),
    );

    if (video != null) {
      setState(() {
        _selectedVideo = video;
        _selectedImages.clear();
      });
    }
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
    });
  }

  Future<void> _createPost() async {
    if (!_formKey.currentState!.validate() || _isUploading) return;

    setState(() {
      _isUploading = true;
    });

    try {
      // Get auth token and API config
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('passport_buddy_token');
      
      print('Token from SharedPreferences: ${token != null ? "exists" : "null"}');
      
      if (token == null) {
        throw Exception('Not authenticated - no token found');
      }
      
      final endpoint = await ApiConfig.discoverEndpoint();
      final apiUrl = endpoint.replaceAll('/graphql', '');
      
      // Use REST API for image upload
      final dio = Dio();
      final formData = FormData();
      
      formData.fields.add(MapEntry('content', _controller.text));
      
      // Add images
      for (final image in _selectedImages) {
        formData.files.add(MapEntry(
          'images',
          await MultipartFile.fromFile(image.path, filename: image.name),
        ));
      }
      
      // Add video
      if (_selectedVideo != null) {
        formData.files.add(MapEntry(
          'images',
          await MultipartFile.fromFile(_selectedVideo!.path, filename: _selectedVideo!.name),
        ));
      }

      print('Creating post to: $apiUrl/api/posts');
      print('Auth token: ${token?.substring(0, 20)}...');
      print('Selected images count: ${_selectedImages.length}');
      print('Selected video: ${_selectedVideo != null}');
      print('Form data fields: ${formData.fields.map((e) => '${e.key}: ${e.value}').join(', ')}');
      print('Form data files: ${formData.files.length}');
      print('Form data file names: ${formData.files.map((e) => e.key).join(', ')}');
      
      final response = await dio.post(
        '$apiUrl/api/posts',
        data: formData,
        options: Options(
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': 'Bearer $token',
          },
        ),
      );

      print('Response status: ${response.statusCode}');
      print('Response data: ${response.data}');

      if (mounted && (response.statusCode == 200 || response.statusCode == 201)) {
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Post created successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop(true); // Return true to indicate success
      } else {
        throw Exception('Unexpected status code: ${response.statusCode}');
      }
    } catch (error) {
      print('Error creating post: $error');
      if (error is DioException) {
        print('Dio error response: ${error.response?.data}');
        print('Dio error status: ${error.response?.statusCode}');
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to create post: ${error.toString()}'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
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
          icon: const Icon(Icons.close, color: Colors.black),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'New thread',
          style: TextStyle(color: Colors.black, fontSize: 16),
        ),
        centerTitle: true,
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // User Avatar
                    Avatar(
                      imageUrl: user?.avatar,
                      name: user?.fullName ?? user?.username ?? 'User',
                      size: 40,
                    ),
                    const SizedBox(width: 12),
                    
                    // Content area
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Username
                          Text(
                            user?.username ?? 'Anonymous',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 4),
                          
                          // Text input
                          TextFormField(
                            controller: _controller,
                            decoration: const InputDecoration(
                              hintText: "What's new?",
                              border: InputBorder.none,
                              hintStyle: TextStyle(
                                color: Colors.grey,
                                fontSize: 15,
                              ),
                            ),
                            validator: (value) => 
                                (value?.trim().isEmpty ?? true) ? 'Post cannot be empty' : null,
                            maxLines: null,
                            minLines: 3,
                            maxLength: _maxCaptionLength,
                            autofocus: true,
                            buildCounter: (context, {required currentLength, required isFocused, maxLength}) {
                              return Text(
                                '$currentLength/$maxLength',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: currentLength > maxLength! ? Colors.red : Colors.grey,
                                ),
                              );
                            },
                          ),
                          
                          // Media preview
                          if (_selectedImages.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Stack(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Image.file(
                                    File(_selectedImages.first.path),
                                    height: 300,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                                Positioned(
                                  top: 8,
                                  right: 8,
                                  child: GestureDetector(
                                    onTap: () => _removeImage(0),
                                    child: Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withValues(alpha: 0.5),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.close,
                                        size: 18,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                          
                          if (_selectedVideo != null) ...[
                            const SizedBox(height: 12),
                            Stack(
                              children: [
                                Container(
                                  height: 300,
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    color: Colors.black,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Center(
                                    child: Icon(
                                      Icons.play_circle_outline,
                                      color: Colors.white,
                                      size: 64,
                                    ),
                                  ),
                                ),
                                Positioned(
                                  top: 8,
                                  right: 8,
                                  child: GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _selectedVideo = null;
                                      });
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withValues(alpha: 0.5),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.close,
                                        size: 18,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                          
                          // Location display  
                          if (_selectedLocation != null) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.location_on, size: 16, color: Colors.grey),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _selectedLocation!['name'] ?? '',
                                      style: const TextStyle(fontSize: 14),
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _selectedLocation = null;
                                      });
                                    },
                                    child: const Icon(Icons.close, size: 16, color: Colors.grey),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          
                          // Media buttons
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              IconButton(
                                onPressed: _isUploading ? null : _pickImage,
                                icon: const Icon(Icons.image_outlined),
                                color: Colors.grey[600],
                                tooltip: 'Add photo',
                              ),
                              IconButton(
                                onPressed: _isUploading ? null : _pickVideo,
                                icon: const Icon(Icons.videocam_outlined),
                                color: Colors.grey[600],
                                tooltip: 'Add video',
                              ),
                              IconButton(
                                onPressed: _isUploading ? null : () {
                                  setState(() {
                                    if (_selectedLocation == null) {
                                      _selectedLocation = {
                                        'name': 'San Francisco, CA',
                                        'address': 'San Francisco, California, USA',
                                      };
                                    } else {
                                      _selectedLocation = null;
                                    }
                                  });
                                },
                                icon: const Icon(Icons.location_on_outlined),
                                color: Colors.grey[600],
                                tooltip: 'Add location',
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
            
            // Bottom action bar
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: Colors.grey[300]!),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: _isUploading || _controller.text.trim().isEmpty
                        ? null
                        : _createPost,
                    style: TextButton.styleFrom(
                      backgroundColor: _isUploading || _controller.text.trim().isEmpty
                          ? Colors.grey[300]
                          : Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    child: _isUploading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text('Post'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}