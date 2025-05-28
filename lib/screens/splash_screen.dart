import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../constants.dart';
import 'auth_screen.dart';
import 'username_screen.dart';
import 'connect_screen.dart';

/// Splash screen shown when the app starts
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    // Navigate to the appropriate screen after a delay
    Future.delayed(const Duration(seconds: 2), () {
      navigateToNextScreen();
    });
  }

  Future<void> navigateToNextScreen() async {
    try {
      // Add a small delay to ensure any pending auth state changes are processed
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Check if user is already logged in
      User? user = FirebaseAuth.instance.currentUser;

      if (user != null) {
        // Add a small delay to ensure the user document is available
        await Future.delayed(const Duration(milliseconds: 500));
        
        // User is logged in, check if username is set
        try {
          final userDoc = await FirebaseFirestore.instance
              .collection('users')
              .doc(user.uid)
              .get();

          if (!mounted) return;
          
          if (!userDoc.exists) {
            // User document doesn't exist, navigate to username screen
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const UsernameScreen()),
            );
            return;
          }
          
          final userData = userDoc.data();
          if (userData == null || userData['username'] == null) {
            // Username is not set, navigate to username screen
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const UsernameScreen()),
            );
          } else {
            // Username is set, navigate to connect screen
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const ConnectScreen()),
            );
          }
        } catch (e) {
          print('Error fetching user document: $e');
          // If there's an error, navigate to auth screen to be safe
          if (mounted) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const AuthScreen()),
            );
          }
        }
      } else {
        // User is not logged in, navigate to auth screen
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const AuthScreen()),
          );
        }
      }
    } catch (e) {
      print('Error in splash screen navigation: $e');
      // If any error occurs, default to auth screen
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const AuthScreen()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppConstants.backgroundGradient,
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Animated logo with gentle float effect
              TweenAnimationBuilder<double>(
                tween: Tween<double>(begin: 0.0, end: 1.0),
                duration: const Duration(seconds: 1),
                curve: Curves.easeOutCubic,
                builder: (context, value, child) {
                  return Opacity(
                    opacity: value,
                    child: Transform.translate(
                      offset: Offset(0, 10 * (1 - value)), // Small float effect
                      child: child,
                    ),
                  );
                },
                child: Image.asset('assets/images/logo.png', width: 150, height: 150),
              ),
              const SizedBox(height: 24),
              // App name with fade-in effect
              TweenAnimationBuilder<double>(
                tween: Tween<double>(begin: 0.0, end: 1.0),
                duration: const Duration(milliseconds: 800),
                curve: Curves.easeOut,
                builder: (context, value, child) {
                  return Opacity(
                    opacity: value,
                    child: child,
                  );
                },
                child: Text(
                  AppConstants.appName,
                  style: AppConstants.headingStyle.copyWith(
                    fontSize: 32,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              // Tagline with lighter weight and opacity
              Text(
                AppConstants.appTagline,
                style: AppConstants.taglineStyle,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              // Subtle loading indicator
              Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [AppConstants.defaultShadow],
                ),
                padding: const EdgeInsets.all(8),
                child: const CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Color(0xFFEE6C4D), // Coral accent color for contrast
                  ),
                  strokeWidth: 3,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
