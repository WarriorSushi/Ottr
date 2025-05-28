import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../constants.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/user_service.dart';
import '../widgets/custom_button.dart';
import '../widgets/facts_box.dart';
import 'auth_screen.dart';
import 'chat_screen.dart';

/// Screen for connecting with another user
class ConnectScreen extends StatefulWidget {
  const ConnectScreen({super.key});

  @override
  State<ConnectScreen> createState() => _ConnectScreenState();
}

class _ConnectScreenState extends State<ConnectScreen> {
  final AuthService _authService = AuthService();
  final UserService _userService = UserService();
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();

  bool _isLoading = false;
  bool _isSearching = false;
  String _errorMessage = '';
  UserModel? _currentUser;
  UserModel? _targetUser;
  List<UserModel> _incomingRequests = [];

  @override
  void initState() {
    super.initState();
    _loadCurrentUser();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    super.dispose();
  }

  Future<void> _loadCurrentUser() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        _navigateToAuth();
        return;
      }

      // Listen to current user changes
      _authService.getUserStream(user.uid).listen((userModel) {
        if (mounted) {
          setState(() {
            _currentUser = userModel;
          });

          // If connected, navigate to chat screen
          if (userModel?.connectionStatus == 'connected' &&
              userModel?.connectedTo != null) {
            _navigateToChat(userModel!.connectedTo!);
          }
        }
      });

      // Listen to incoming requests
      _userService.getIncomingRequests(user.uid).listen((requests) {
        if (mounted) {
          setState(() {
            _incomingRequests = requests;
          });
        }
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
        });
      }
    }
  }

  void _navigateToAuth() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const AuthScreen()),
    );
  }

  void _navigateToChat(String otherUserId) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => ChatScreen(otherUserId: otherUserId)),
    );
  }

  Future<void> _findUserByUsername() async {
    final username = _usernameController.text.trim();
    if (username.isEmpty) return;

    setState(() {
      _isSearching = true;
      _targetUser = null;
      _errorMessage = '';
    });

    try {
      // Check if username is the current user
      if (_currentUser?.username == username) {
        setState(() {
          _errorMessage = "You can't connect with yourself";
        });
        return;
      }

      final user = await _userService.getUserByUsername(username);
      if (user == null) {
        setState(() {
          _errorMessage = AppConstants.userNotFound;
        });
        return;
      }

      // Check if target user is available
      if (user.connectionStatus != 'none') {
        setState(() {
          _errorMessage = AppConstants.userUnavailable;
        });
        return;
      }

      setState(() {
        _targetUser = user;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() {
        _isSearching = false;
      });
    }
  }

  Future<void> _sendConnectionRequest() async {
    if (_targetUser == null || _currentUser == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      await _userService.sendConnectionRequest(
        _currentUser!.uid,
        _targetUser!.uid,
      );

      setState(() {
        _targetUser = null;
        _usernameController.clear();
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppConstants.requestSent),
          backgroundColor: AppConstants.accentColor,
        ),
      );
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _acceptConnectionRequest(UserModel requester) async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      if (_currentUser == null) return;

      await _userService.acceptConnectionRequest(
        _currentUser!.uid,
        requester.uid,
      );

      // Navigation to chat will happen automatically via the user stream listener
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _declineConnectionRequest(UserModel requester) async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      if (_currentUser == null) return;

      await _userService.declineConnectionRequest(
        _currentUser!.uid,
        requester.uid,
      );

      setState(() {
        _incomingRequests.removeWhere((user) => user.uid == requester.uid);
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _cancelConnectionRequest() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      if (_currentUser == null) return;

      await _userService.cancelConnectionRequest(_currentUser!.uid);

      setState(() {
        _currentUser = _currentUser?.copyWith(
          connectionStatus: 'none',
          connectedTo: null,
          connectionRequestSent: null,
        );
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _signOut() async {
    try {
      await _authService.signOut();
      if (mounted) {
        _navigateToAuth();
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Using a container with gradient as background
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text('Connect', style: AppConstants.titleStyle),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: AppConstants.textColor,
        actions: [
          IconButton(
            icon: Icon(Icons.logout, color: AppConstants.textColor),
            onPressed: _signOut,
          ),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: AppConstants.backgroundGradient,
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppConstants.spacingM),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // User status in glass container
                if (_currentUser != null) ...[
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
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          'Hello, ${_currentUser!.username}!',
                          style: AppConstants.headingStyle.copyWith(
                            fontSize: 20,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AppConstants.spacingXs),
                        
                        // Show different content based on connection status
                        if (_currentUser!.connectionStatus == 'none')
                          Text(
                            'You are not connected to anyone.',
                            style: AppConstants.bodyStyle,
                            textAlign: TextAlign.center,
                          )
                        else if (_currentUser!.connectionStatus == 'pending' && 
                                _currentUser!.connectionRequestSent != null)
                          Column(
                            children: [
                              Text(
                                'Connection request pending...',
                                style: AppConstants.bodyStyle,
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: AppConstants.spacingS),
                              CustomButton(
                                text: 'Cancel Request',
                                onPressed: _cancelConnectionRequest,
                                isLoading: _isLoading,
                                isOutlined: true,
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                  
                  // Pending connection status indicator
                  if (_currentUser!.connectionStatus == 'pending' && 
                      _currentUser!.connectionRequestSent != null)
                    Container(
                      margin: const EdgeInsets.only(top: AppConstants.spacingM),
                      padding: const EdgeInsets.all(AppConstants.spacingS),
                      decoration: BoxDecoration(
                        color: Colors.amber.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
                        border: Border.all(color: Colors.amber),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.hourglass_top, color: Colors.amber),
                          const SizedBox(width: AppConstants.spacingXs),
                          Expanded(
                            child: Text(
                              AppConstants.pendingStatus,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: AppConstants.textColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  
                  // Incoming connection requests
                  if (_incomingRequests.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(top: AppConstants.spacingM),
                      padding: const EdgeInsets.all(AppConstants.spacingS),
                      decoration: BoxDecoration(
                        color: AppConstants.accentColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
                        border: Border.all(
                          color: AppConstants.accentColor.withOpacity(0.3),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Connection Requests',
                            style: AppConstants.bodyStyle.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: AppConstants.spacingXs),
                          ...List.generate(
                            _incomingRequests.length,
                            (index) {
                              final requester = _incomingRequests[index];
                              return Container(
                                margin: const EdgeInsets.only(bottom: AppConstants.spacingXs),
                                padding: const EdgeInsets.all(AppConstants.spacingXs),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
                                ),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      backgroundColor: AppConstants.accentColor.withOpacity(0.2),
                                      radius: 16,
                                      child: Text(
                                        requester.username.substring(0, 1).toUpperCase(),
                                        style: TextStyle(
                                          color: AppConstants.accentColor,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: AppConstants.spacingXs),
                                    Expanded(
                                      child: Text(
                                        requester.username,
                                        style: AppConstants.bodyStyle.copyWith(
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          icon: Icon(
                                            Icons.check_circle_outline,
                                            color: AppConstants.accentColor,
                                          ),
                                          onPressed: () => _acceptConnectionRequest(requester),
                                          tooltip: 'Accept',
                                          constraints: BoxConstraints.tight(const Size(32, 32)),
                                          padding: EdgeInsets.zero,
                                        ),
                                        IconButton(
                                          icon: Icon(
                                            Icons.cancel_outlined,
                                            color: AppConstants.errorColor,
                                          ),
                                          onPressed: () => _declineConnectionRequest(requester),
                                          tooltip: 'Decline',
                                          constraints: BoxConstraints.tight(const Size(32, 32)),
                                          padding: EdgeInsets.zero,
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  
                  // Connect with someone section
                  if (_currentUser!.connectionStatus == 'none')
                    Container(
                      margin: const EdgeInsets.only(top: AppConstants.spacingM),
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
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(
                            'Connect with Someone',
                            style: AppConstants.headingStyle.copyWith(
                              fontSize: 18,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: AppConstants.spacingM),
                          
                          // Username search form
                          Form(
                            key: _formKey,
                            child: Column(
                              children: [
                                TextFormField(
                                  controller: _usernameController,
                                  decoration: AppConstants.glassInputDecoration(
                                    labelText: 'Username',
                                    hintText: 'Enter their username',
                                    prefixIcon: Icons.person_search,
                                  ),
                                  style: TextStyle(color: AppConstants.textColor),
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Please enter a username';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: AppConstants.spacingS),
                                
                                // Find user button
                                CustomButton(
                                  text: 'Find User',
                                  onPressed: _findUserByUsername,
                                  isLoading: _isSearching,
                                  isOutlined: true,
                                ),
                                const SizedBox(height: AppConstants.spacingM),

                                // Target user info
                                if (_targetUser != null)
                                  Container(
                                    padding: const EdgeInsets.all(AppConstants.spacingS),
                                    decoration: BoxDecoration(
                                      color: AppConstants.accentColor.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
                                      border: Border.all(
                                        color: AppConstants.accentColor.withOpacity(0.3),
                                      ),
                                    ),
                                    child: Column(
                                      children: [
                                        Text(
                                          'Found: ${_targetUser!.username}',
                                          style: AppConstants.bodyStyle.copyWith(
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        const SizedBox(height: AppConstants.spacingS),
                                        CustomButton(
                                          text: AppConstants.connectButton,
                                          onPressed: _sendConnectionRequest,
                                          isLoading: _isLoading,
                                          isPill: true,
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                ],

                // Error message
                if (_errorMessage.isNotEmpty)
                  AnimatedContainer(
                    duration: AppConstants.standardAnimation,
                    margin: const EdgeInsets.only(top: AppConstants.spacingS),
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
                
                // Animal love facts box at the bottom
                const Spacer(),
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
    );
  }
}
