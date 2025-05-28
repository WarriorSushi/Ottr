import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants.dart';
import 'splash_screen.dart';

/// Onboarding screen with tutorial slides shown on first app launch
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  final int _numPages = 3;

  final List<Map<String, String>> _pages = [
    {
      'title': 'Welcome to Ottr',
      'description': 'Your one-to-one exclusive messaging app for meaningful connections',
      'image': 'assets/images/logo.png',
    },
    {
      'title': 'Exclusive Connection',
      'description': 'Connect with just one person at a time. Share your username with someone special to start chatting.',
      'image': 'assets/images/logo.png',
    },
    {
      'title': 'Ready to Connect?',
      'description': 'Sign up or log in to get started with your exclusive chat experience!',
      'image': 'assets/images/logo.png',
    },
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_currentPage < _numPages - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _completeOnboarding();
    }
  }

  Future<void> _completeOnboarding() async {
    // Save that onboarding is complete
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_complete', true);

    // Navigate to splash screen
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const SplashScreen()),
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
        child: SafeArea(
          child: Column(
            children: [
              // Skip button
              Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: TextButton(
                    onPressed: _completeOnboarding,
                    child: const Text(
                      'Skip',
                      style: TextStyle(
                        color: AppConstants.darkColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),

              // Page content
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  onPageChanged: (int page) {
                    setState(() {
                      _currentPage = page;
                    });
                  },
                  itemCount: _numPages,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.all(40.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Image
                          Image.asset(
                            _pages[index]['image']!,
                            height: 120,
                          ),
                          const SizedBox(height: 40),
                          
                          // Title
                          Text(
                            _pages[index]['title']!,
                            style: AppConstants.headingStyle,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 20),
                          
                          // Description
                          Text(
                            _pages[index]['description']!,
                            style: TextStyle(
                              fontSize: 16,
                              color: AppConstants.darkColor,
                              height: 1.5,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),

              // Page indicator and next button
              Padding(
                padding: const EdgeInsets.only(bottom: 40.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Page indicator
                    Row(
                      children: List.generate(
                        _numPages,
                        (index) => Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4.0),
                          height: 10,
                          width: 10,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _currentPage == index
                                ? AppConstants.primaryColor
                                : AppConstants.primaryColor.withAlpha(100),
                          ),
                        ),
                      ),
                    ),

                    // Next button
                    ElevatedButton(
                      onPressed: _nextPage,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppConstants.primaryColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 30,
                          vertical: 15,
                        ),
                      ),
                      child: Text(
                        _currentPage == _numPages - 1 ? 'Get Started' : 'Next',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
