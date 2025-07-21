import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

class Avatar extends StatelessWidget {
  final String? imageUrl;
  final String name;
  final double size;
  final Color? backgroundColor;

  const Avatar({
    super.key,
    this.imageUrl,
    required this.name,
    this.size = 40,
    this.backgroundColor,
  });

  String _getInitials(String name) {
    if (name.isEmpty) return 'U';
    
    final names = name.trim().split(' ');
    
    if (names.length > 1) {
      return '${names[0][0]}${names[names.length - 1][0]}'.toUpperCase();
    }
    return name[0].toUpperCase();
  }

  Color _getAvatarColor() {
    // If backgroundColor is provided, use it
    if (backgroundColor != null) return backgroundColor!;
    
    // Try to extract color from ui-avatars URL
    if (imageUrl != null && imageUrl!.contains('ui-avatars.com')) {
      final backgroundMatch = RegExp(r'background=([a-fA-F0-9]{6})').firstMatch(imageUrl!);
      if (backgroundMatch != null) {
        final colorHex = backgroundMatch.group(1);
        if (colorHex != null) {
          return Color(int.parse('FF$colorHex', radix: 16));
        }
      }
    }
    
    // Default to medium purple
    return AppColors.mediumPurple;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: _getAvatarColor(),
      ),
      clipBehavior: Clip.antiAlias,
      child: imageUrl != null && imageUrl!.isNotEmpty
          ? Image.network(
              imageUrl!,
              fit: BoxFit.cover,
              width: size,
              height: size,
              errorBuilder: (context, error, stackTrace) {
                // Fallback to initials on error
                return _buildInitialsAvatar();
              },
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return _buildInitialsAvatar();
              },
            )
          : _buildInitialsAvatar(),
    );
  }

  Widget _buildInitialsAvatar() {
    return Container(
      color: _getAvatarColor(),
      child: Center(
        child: Text(
          _getInitials(name),
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: size * 0.4,
          ),
        ),
      ),
    );
  }
}