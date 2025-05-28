import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../constants.dart';
import '../services/auth_service.dart';
import '../widgets/custom_button.dart';
import '../widgets/facts_box.dart';
import 'connect_screen.dart';

/// Screen for setting up a unique username
class UsernameScreen extends StatefulWidget {
  const UsernameScreen({super.key});

  @override
  State<UsernameScreen> createState() => _UsernameScreenState();
}

class _UsernameScreenState extends State<UsernameScreen> {
  final AuthService _authService = AuthService();
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();

  bool _isLoading = false;
  bool _isChecking = false;
  bool _isAvailable = false;
  String _errorMessage = '';

  @override
  void dispose() {
    _usernameController.dispose();
    super.dispose();
  }

  Future<void> _checkUsernameAvailability() async {
    final username = _usernameController.text.trim();
    if (username.isEmpty) return;

    setState(() {
      _isChecking = true;
      _isAvailable = false;
      _errorMessage = '';
    });

    try {
      final isAvailable = await _authService.isUsernameAvailable(username);
      setState(() {
        _isAvailable = isAvailable;
        _errorMessage = isAvailable ? '' : AppConstants.usernameTaken;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() {
        _isChecking = false;
      });
    }
  }

  Future<void> _submitUsername() async {
    if (!_formKey.currentState!.validate() || !_isAvailable) return;

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      await _authService.createUserDocument(
        user.uid,
        user.email ?? '',
        _usernameController.text.trim(),
      );

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const ConnectScreen()),
        );
      }
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
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text('Set Up Your Profile', style: AppConstants.titleStyle),
        backgroundColor: Colors.transparent,
        foregroundColor: AppConstants.textColor,
        elevation: 0,
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: AppConstants.backgroundGradient,
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppConstants.spacingM),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Glass container for content
                    Container(
                      padding: const EdgeInsets.all(AppConstants.spacingM),
                      decoration: BoxDecoration(
                        color: AppConstants.surfaceColor.withOpacity(AppConstants.glassOpacity),
                        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
                        border: Border.all(
                          color: AppConstants.borderColor.withOpacity(0.2),
                          width: AppConstants.glassBorderWidth,
                        ),
                        boxShadow: AppConstants.glassShadows,
                      ),
                      child: Column(
                        children: [
                          Text(
                            AppConstants.usernameSetupTitle,
                            style: AppConstants.headingStyle,
                            textAlign: TextAlign.center,
                          ),
                          Text(
                            'This is how others will find and connect with you',
                            style: AppConstants.captionStyle,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: AppConstants.spacingM),

                          // Username input field
                          TextFormField(
                            controller: _usernameController,
                            decoration: AppConstants.glassInputDecoration(
                              labelText: AppConstants.usernameHint,
                              hintText: AppConstants.usernameHint,
                              prefixIcon: Icons.person,
                            ),
                            style: TextStyle(color: AppConstants.textColor),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Please enter a username';
                              }
                              if (value.trim().length < 3) {
                                return 'Username must be at least 3 characters';
                              }
                              if (!_isAvailable && value.trim().isNotEmpty) {
                                return AppConstants.usernameTaken;
                              }
                              return null;
                            },
                            onChanged: (_) {
                              if (_isAvailable) {
                                setState(() {
                                  _isAvailable = false;
                                });
                              }
                            },
                          ),
                          const SizedBox(height: AppConstants.spacingS),

                          // Check availability button
                          CustomButton(
                            text: 'Check Availability',
                            onPressed: _checkUsernameAvailability,
                            isLoading: _isChecking,
                            isOutlined: true,
                          ),
                          const SizedBox(height: AppConstants.spacingM),

                          // Availability message
                          if (_isAvailable && _usernameController.text.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(bottom: AppConstants.spacingS),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.check_circle_outline,
                                    color: Colors.green.withOpacity(0.8),
                                    size: 16,
                                  ),
                                  const SizedBox(width: AppConstants.spacingXxs),
                                  Text(
                                    AppConstants.usernameAvailable,
                                    style: AppConstants.captionStyle.copyWith(
                                      color: Colors.green.withOpacity(0.8),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                          // Error message
                          if (_errorMessage.isNotEmpty)
                            AnimatedContainer(
                              duration: AppConstants.standardAnimation,
                              margin: const EdgeInsets.only(bottom: AppConstants.spacingS),
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppConstants.spacingS,
                                vertical: AppConstants.spacingXs,
                              ),
                              decoration: BoxDecoration(
                                color: AppConstants.errorColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
                                border: Border.all(
                                  color: AppConstants.errorColor.withOpacity(0.3),
                                  width: 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.error_outline_rounded,
                                    color: AppConstants.errorColor,
                                    size: 20,
                                  ),
                                  const SizedBox(width: AppConstants.spacingXs),
                                  Expanded(
                                    child: Text(
                                      _errorMessage,
                                      style: AppConstants.errorTextStyle,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                          // Submit button
                          CustomButton(
                            text: AppConstants.usernameSubmitButton,
                            onPressed: _submitUsername,
                            isLoading: _isLoading,
                            isPill: true,
                          ),
                        ],
                      ),
                    ),
                    
                    // Animal love facts box
                    const SizedBox(height: AppConstants.spacingM),
                    const FactsBox(
                      facts: AppConstants.animalLoveFacts,
                      height: 70,
                      interval: Duration(seconds: 10),
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
