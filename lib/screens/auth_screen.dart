import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../constants.dart';
import '../services/auth_service.dart';
import '../widgets/custom_button.dart';
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
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const UsernameScreen()),
          );
        }
      } else {
        // Register
        try {
          User? user = await _authService.registerWithEmailAndPassword(_email, _password);
          if (user != null && mounted) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const UsernameScreen()),
            );
          }
        } catch (e) {
          // If registration fails with type error but Firebase actually created the account,
          // we can try to sign in with the same credentials
          if (e.toString().contains('PigeonUserDetails') || 
              e.toString().contains('List<Object?>')) {
            // Wait a moment and check if user is now authenticated
            await Future.delayed(const Duration(milliseconds: 500));
            if (FirebaseAuth.instance.currentUser != null && mounted) {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const UsernameScreen()),
              );
              return;
            }
            
            // If not, try explicit sign in
            try {
              await _authService.signInWithEmailAndPassword(_email, _password);
              if (mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const UsernameScreen()),
                );
              }
              return;
            } catch (_) {
              // If sign-in also fails, show a user-friendly error
              setState(() {
                _errorMessage = 'Registration issue. Please try again or restart the app.';
                _isLoading = false;
              });
            }
          } else {
            // For other errors, rethrow to be caught by the outer catch block
            rethrow;
          }
        }
      }
    } on FirebaseAuthException catch (e) {
      String message = 'An error occurred';

      if (e.code == 'user-not-found' || e.code == 'wrong-password') {
        message = 'Invalid email or password';
      } else if (e.code == 'email-already-in-use') {
        message = 'Email is already in use';
      } else if (e.code == 'weak-password') {
        message = 'Password is too weak';
      } else if (e.code == 'invalid-email') {
        message = 'Invalid email address';
      }

      setState(() {
        _errorMessage = message;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.lightColor,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // App logo
                  Image.asset(
                    'assets/images/logo.png',
                    width: 120,
                    height: 120,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    _isLogin ? 'Welcome Back' : 'Create Account',
                    style: AppConstants.headingStyle,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _isLogin ? 'Sign in to continue' : 'Sign up to get started',
                    style: AppConstants.subheadingStyle,
                  ),
                  const SizedBox(height: 32),

                  // Email field
                  TextFormField(
                    decoration: InputDecoration(
                      labelText: AppConstants.emailHint,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      prefixIcon: const Icon(Icons.email),
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
                  const SizedBox(height: 16),

                  // Password field
                  TextFormField(
                    decoration: InputDecoration(
                      labelText: AppConstants.passwordHint,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      prefixIcon: const Icon(Icons.lock),
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
                  const SizedBox(height: 24),

                  // Error message
                  if (_errorMessage.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Text(
                        _errorMessage,
                        style: const TextStyle(
                          color: AppConstants.errorColor,
                          fontSize: 14,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),

                  // Submit button
                  CustomButton(
                    text: _isLogin
                        ? AppConstants.loginButton
                        : AppConstants.registerButton,
                    onPressed: _submitForm,
                    isLoading: _isLoading,
                  ),
                  const SizedBox(height: 16),

                  // Toggle auth mode
                  TextButton(
                    onPressed: _toggleAuthMode,
                    child: Text(
                      _isLogin
                          ? '${AppConstants.noAccountText}Register'
                          : '${AppConstants.haveAccountText}Login',
                      style: TextStyle(
                        color: AppConstants.primaryColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
