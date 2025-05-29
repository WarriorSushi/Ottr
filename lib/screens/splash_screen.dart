import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants.dart';
import '../services/auth_service.dart';
import '../services/user_service.dart';
import 'auth_screen.dart';
import 'username_screen.dart';
import 'connect_screen.dart';
import 'onboarding_screen.dart';

/// Splash screen shown when the app starts
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  String? _errorMessage;
  
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    try {
      print('Initializing app...');
      
      // Initialize UserService
      final userService = Provider.of<UserService>(context, listen: false);
      await userService.initialize();
      
      // Small delay for splash screen effect
      await Future.delayed(const Duration(seconds: 2));
      
      // Navigate based on authentication and profile status
      await _navigateToAppropriateScreen();
      
    } catch (e) {
      print('Error during app initialization: $e');
      setState(() {
        _errorMessage = 'Failed to initialize app: $e';
      });
      // Show error dialog or navigate to login after a delay
      await Future.delayed(const Duration(seconds: 2));
      _navigateToLogin();
    }
  }

  Future<void> _navigateToAppropriateScreen() async {
    try {
      // Check if onboarding has been completed
      final prefs = await SharedPreferences.getInstance();
      final bool onboardingComplete = prefs.getBool('onboarding_complete') ?? false;
      
      if (!onboardingComplete && mounted) {
        // Show onboarding screen if it's the first launch
        _navigateToOnboarding();
        return;
      }
      
      final authService = Provider.of<AuthService>(context, listen: false);
      final userService = Provider.of<UserService>(context, listen: false);
      
      // Check if user is authenticated
      if (authService.currentUser == null) {
        print('No authenticated user, navigating to login');
        _navigateToLogin();
        return;
      }

      print('User is authenticated, checking profile completeness...');
      
      // Check if user profile is loaded and complete
      if (userService.currentUser == null) {
        print('User profile not loaded, loading now...');
        // First attempt to load user profile
        await userService.loadUserProfile();
        
        // Wait longer to ensure profile loads (handling PigeonUserDetails recovery)
        await Future.delayed(const Duration(seconds: 1));
        
        // If still null, try one more time (similar to the recovery pattern in AuthService)
        if (userService.currentUser == null) {
          print('Retrying profile load after delay...');
          await userService.loadUserProfile();
          await Future.delayed(const Duration(seconds: 1));
        }
      }

      // Final check after all loading attempts
      if (userService.currentUser == null) {
        print('Failed to load user profile after multiple attempts, navigating to login');
        _navigateToLogin();
      } else if (!userService.hasUsername) {
        print('User exists but no username, navigating to username setup');
        _navigateToUsernameSetup();
      } else {
        print('User profile complete with username: ${userService.currentUser?.username}, navigating to main app');
        _navigateToMain();
      }
      
    } catch (e) {
      print('Error checking user status: $e');
      setState(() {
        _errorMessage = 'Error checking user status: $e';
      });
      await Future.delayed(const Duration(seconds: 2));
      _navigateToLogin();
    }
  }

  void _navigateToLogin() {
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const AuthScreen()),
      );
    }
  }

  void _navigateToUsernameSetup() {
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const UsernameScreen()),
      );
    }
  }

  void _navigateToMain() {
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const ConnectScreen()),
      );
    }
  }
  
  void _navigateToOnboarding() {
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const OnboardingScreen()),
      );
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
              // Error message if there's an error
              if (_errorMessage != null) ...[
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 24),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(color: Colors.white),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 16),
              ],
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
