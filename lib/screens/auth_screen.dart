import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../constants.dart';
import '../services/auth_service.dart';
import '../widgets/custom_button.dart';
import '../widgets/facts_box.dart';
import 'username_screen.dart';

/// Authentication screen for login and registration
class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final AuthService _authService = AuthService();
  final _formKey = GlobalKey<FormState>();

  bool _isLogin = true;
  bool _isLoading = false;
  String _email = '';
  String _password = '';
  String _errorMessage = '';

  void _toggleAuthMode() {
    setState(() {
      _isLogin = !_isLogin;
      _errorMessage = '';
    });
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    _formKey.currentState!.save();
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      if (_isLogin) {
        // Login
        await _authService.signInWithEmailAndPassword(_email, _password);
      } else {
        // Register
        User? user = await _authService.registerWithEmailAndPassword(_email, _password);
        if (user == null) {
          throw FirebaseAuthException(
            code: 'registration-failed',
            message: 'Failed to create user account',
          );
        }
      }
      
      // If we get here, authentication was successful
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const UsernameScreen()),
        );
      }
    } on FirebaseAuthException catch (e) {
      String message = 'An error occurred';

      if (e.code == 'user-not-found' || e.code == 'wrong-password') {
        message = 'Invalid email or password';
      } else if (e.code == 'email-already-in-use') {
        message = 'An account already exists with this email';
      } else if (e.code == 'weak-password') {
        message = 'Password is too weak';
      } else if (e.code == 'invalid-email') {
        message = 'Invalid email address';
      } else if (e.code == 'registration-failed') {
        message = 'Failed to create account. Please try again.';
      }

      setState(() {
        _errorMessage = message;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'An unexpected error occurred. Please try again.';
        _isLoading = false;
      });
      print('Authentication error: $e');
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
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // App logo with subtle animation
                    TweenAnimationBuilder<double>(
                      tween: Tween<double>(begin: 0.95, end: 1.0),
                      duration: const Duration(milliseconds: 1500),
                      curve: Curves.easeInOut,
                      builder: (context, value, child) {
                        return Transform.scale(
                          scale: value,
                          child: child,
                        );
                      },
                      child: Image.asset(
                        'assets/images/logo.png',
                        width: 120,
                        height: 120,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Facts box
                    const FactsBox(
                      facts: AppConstants.animalLoveFacts,
                      height: 70,
                      interval: Duration(seconds: 4),
                    ),
                    const SizedBox(height: 16),
                    
                    Text(
                      _isLogin ? 'Welcome Back' : 'Create Account',
                      style: AppConstants.headingStyle,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _isLogin ? 'Sign in to continue' : 'Sign up to get started',
                      style: AppConstants.taglineStyle,
                    ),
                    const SizedBox(height: 32),

                    // Email field with improved styling
                    Container(
                      decoration: BoxDecoration(
                        color: AppConstants.lightColor,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [AppConstants.defaultShadow],
                      ),
                      child: TextFormField(
                        decoration: InputDecoration(
                          labelText: AppConstants.emailHint,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: AppConstants.accentColor, width: 1),
                          ),
                          filled: true,
                          fillColor: AppConstants.lightColor,
                          prefixIcon: Icon(Icons.email, color: AppConstants.primaryColor.withOpacity(0.7)),
                          labelStyle: TextStyle(color: AppConstants.darkColor.withOpacity(0.7)),
                        ),
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your email';
                          }
                          if (!value.contains('@') || !value.contains('.')) {
                            return 'Please enter a valid email';
                          }
                          return null;
                        },
                        onSaved: (value) {
                          _email = value?.trim() ?? '';
                        },
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Password field with improved styling
                    Container(
                      decoration: BoxDecoration(
                        color: AppConstants.lightColor,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [AppConstants.defaultShadow],
                      ),
                      child: TextFormField(
                        decoration: InputDecoration(
                          labelText: AppConstants.passwordHint,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: AppConstants.accentColor, width: 1),
                          ),
                          filled: true,
                          fillColor: AppConstants.lightColor,
                          prefixIcon: Icon(Icons.lock, color: AppConstants.primaryColor.withOpacity(0.7)),
                          labelStyle: TextStyle(color: AppConstants.darkColor.withOpacity(0.7)),
                        ),
                        obscureText: true,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your password';
                          }
                          if (!_isLogin && value.length < 6) {
                            return 'Password must be at least 6 characters';
                          }
                          return null;
                        },
                        onSaved: (value) {
                          _password = value?.trim() ?? '';
                        },
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Error message with icon
                    if (_errorMessage.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                        decoration: BoxDecoration(
                          color: AppConstants.errorColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline, color: AppConstants.errorColor, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage,
                                style: AppConstants.errorTextStyle,
                                textAlign: TextAlign.left,
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 24),

                    // Submit button
                    CustomButton(
                      text: _isLogin
                          ? AppConstants.loginButton
                          : AppConstants.registerButton,
                      onPressed: _submitForm,
                      isLoading: _isLoading,
                    ),
                    const SizedBox(height: 16),

                    // Toggle auth mode with improved styling
                    TextButton(
                      onPressed: _toggleAuthMode,
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        _isLogin
                            ? '${AppConstants.noAccountText}Register'
                            : '${AppConstants.haveAccountText}Login',
                        style: TextStyle(
                          color: Colors.green[800], // Dark green color
                          fontWeight: FontWeight.w500,
                          decoration: TextDecoration.underline,
                          decorationColor: Colors.green[800],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
