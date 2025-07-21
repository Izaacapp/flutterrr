import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class LikeButton extends StatefulWidget {
  final bool isLiked;
  final VoidCallback onPressed;
  final bool isLoading;

  const LikeButton({
    super.key,
    required this.isLiked,
    required this.onPressed,
    this.isLoading = false,
  });

  @override
  State<LikeButton> createState() => _LikeButtonState();
}

class _LikeButtonState extends State<LikeButton>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late AnimationController _likeAnimationController;
  late AnimationController _bounceAnimationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;
  late Animation<double> _bounceAnimation;
  bool _isPressed = false;

  // Web-matching colors
  static const Color _purpleColor = Color(0xFF8B5CF6);
  static const Color _hoverBackgroundColor = Color(0xFFF5F4FD);
  static const Color _darkPurpleColor = Color(0xFF7B6BA6);

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    
    _likeAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _bounceAnimationController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.85,
    ).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(
      CurvedAnimation(
        parent: _likeAnimationController,
        curve: Curves.easeIn,
      ),
    );
    
    _bounceAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.2)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 15,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.2, end: 0.95)
            .chain(CurveTween(curve: Curves.easeIn)),
        weight: 15,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.95, end: 1.0)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 70,
      ),
    ]).animate(_bounceAnimationController);
    
    // Set initial animation state based on isLiked
    if (widget.isLiked) {
      _likeAnimationController.value = 1.0;
    }
  }

  @override
  void didUpdateWidget(LikeButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isLiked != oldWidget.isLiked) {
      if (widget.isLiked) {
        _likeAnimationController.forward();
        _bounceAnimationController.forward(from: 0);
      } else {
        _likeAnimationController.reverse();
        _bounceAnimationController.reset();
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    _likeAnimationController.dispose();
    _bounceAnimationController.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    setState(() {
      _isPressed = true;
    });
    _animationController.forward();
    HapticFeedback.lightImpact();
  }

  void _handleTapUp(TapUpDetails details) {
    setState(() {
      _isPressed = false;
    });
    _animationController.reverse();
  }

  void _handleTapCancel() {
    setState(() {
      _isPressed = false;
    });
    _animationController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: widget.isLoading ? null : widget.onPressed,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value * _bounceAnimation.value,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _isPressed ? _hoverBackgroundColor : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
              ),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: widget.isLoading
                    ? SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            widget.isLiked ? _purpleColor : _darkPurpleColor,
                          ),
                        ),
                      )
                    : Stack(
                        alignment: Alignment.center,
                        children: [
                          // Unliked heart (always visible)
                          CustomPaint(
                            size: const Size(24, 24),
                            painter: HeartPainter(
                              isLiked: false,
                              color: _darkPurpleColor,
                            ),
                          ),
                          // Liked heart (fades in/out)
                          FadeTransition(
                            opacity: _fadeAnimation,
                            child: CustomPaint(
                              size: const Size(24, 24),
                              painter: HeartPainter(
                                isLiked: true,
                                color: _purpleColor,
                              ),
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class HeartPainter extends CustomPainter {
  final bool isLiked;
  final Color color;

  HeartPainter({
    required this.isLiked,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = isLiked ? PaintingStyle.fill : PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final path = Path();
    
    // Heart path scaled to 24x24
    
    path.moveTo(size.width * 0.5, size.height * 0.85);
    
    // Left side of heart
    path.cubicTo(
      size.width * 0.2, size.height * 0.65,
      size.width * 0, size.height * 0.4,
      size.width * 0, size.height * 0.3,
    );
    path.cubicTo(
      size.width * 0, size.height * 0.1,
      size.width * 0.2, size.height * 0,
      size.width * 0.35, size.height * 0,
    );
    path.cubicTo(
      size.width * 0.45, size.height * 0,
      size.width * 0.5, size.height * 0.05,
      size.width * 0.5, size.height * 0.15,
    );
    
    // Right side of heart
    path.cubicTo(
      size.width * 0.5, size.height * 0.05,
      size.width * 0.55, size.height * 0,
      size.width * 0.65, size.height * 0,
    );
    path.cubicTo(
      size.width * 0.8, size.height * 0,
      size.width * 1, size.height * 0.1,
      size.width * 1, size.height * 0.3,
    );
    path.cubicTo(
      size.width * 1, size.height * 0.4,
      size.width * 0.8, size.height * 0.65,
      size.width * 0.5, size.height * 0.85,
    );
    
    path.close();
    
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(HeartPainter oldDelegate) {
    return oldDelegate.isLiked != isLiked || oldDelegate.color != color;
  }
}