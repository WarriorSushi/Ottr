import 'package:flutter/material.dart';
import '../constants.dart';

/// A custom button widget with consistent styling
class CustomButton extends StatefulWidget {
  final String text;
  final VoidCallback onPressed;
  final bool isLoading;
  final bool isOutlined;

  const CustomButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
    this.isOutlined = false,
  });

  @override
  State<CustomButton> createState() => _CustomButtonState();
}

class _CustomButtonState extends State<CustomButton> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.03).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => _animationController.forward(),
      onExit: (_) => _animationController.reverse(),
      child: GestureDetector(
        onTapDown: (_) => _animationController.forward(),
        onTapUp: (_) => _animationController.reverse(),
        onTapCancel: () => _animationController.reverse(),
        child: ScaleTransition(
          scale: _scaleAnimation,
          child: SizedBox(
            width: double.infinity,
            height: 48, // Perfect for thumbs as requested
            child: Container(
              decoration: BoxDecoration(
                gradient: widget.isOutlined
                    ? null
                    : AppConstants.primaryGradient,
                borderRadius: BorderRadius.circular(16), // Increased rounded corners
                border: widget.isOutlined
                    ? Border.all(color: AppConstants.primaryColor, width: 2)
                    : null,
                boxShadow: widget.isOutlined
                    ? []
                    : [AppConstants.defaultShadow],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  splashColor: AppConstants.primaryColor.withOpacity(0.1),
                  highlightColor: AppConstants.primaryColor.withOpacity(0.05),
                  onTap: widget.isLoading ? null : widget.onPressed,
                  child: Center(
                    child: widget.isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : Text(
                            widget.text,
                            style: AppConstants.buttonTextStyle.copyWith(
                              color: widget.isOutlined ? AppConstants.primaryColor : Colors.white,
                            ),
                          ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
