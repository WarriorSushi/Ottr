import 'dart:async';
import 'package:flutter/material.dart';
import '../constants.dart';

/// A widget that displays rotating facts in a box with tap to advance
class FactsBox extends StatefulWidget {
  final List<String> facts;
  final double height;
  final Duration interval;

  const FactsBox({
    super.key,
    required this.facts,
    this.height = 60.0,
    this.interval = const Duration(seconds: 4),
  });

  @override
  State<FactsBox> createState() => _FactsBoxState();
}

class _FactsBoxState extends State<FactsBox> with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  late Timer _timer;
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _startTimer();
    
    // Setup animation controller for tap effect
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.95,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    
    _scaleAnimation.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _animationController.reverse();
      }
    });
  }

  void _startTimer() {
    _timer = Timer.periodic(widget.interval, (timer) {
      if (mounted) {
        setState(() {
          _currentIndex = (_currentIndex + 1) % widget.facts.length;
        });
      }
    });
  }
  
  void _showNextFact() {
    // Play the tap animation
    _animationController.forward();
    
    // Cancel the current timer and restart it
    _timer.cancel();
    
    setState(() {
      _currentIndex = (_currentIndex + 1) % widget.facts.length;
    });
    
    // Restart the timer
    _startTimer();
  }

  @override
  void dispose() {
    _timer.cancel();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: _showNextFact,
          child: AnimatedBuilder(
            animation: _scaleAnimation,
            builder: (context, child) => Transform.scale(
              scale: _scaleAnimation.value,
              child: child,
            ),
            child: Container(
              height: widget.height,
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppConstants.borderColor,
                  width: 1.0,
                ),
              ),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 500),
                child: Text(
                  key: ValueKey<int>(_currentIndex),
                  widget.facts[_currentIndex],
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    color: AppConstants.charcoalColor,
                    height: 1.4,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'tap for next fact',
          style: TextStyle(
            fontSize: 10,
            fontStyle: FontStyle.italic,
            color: AppConstants.charcoalColor.withOpacity(0.7),
          ),
        ),
      ],
    );
  }
}
