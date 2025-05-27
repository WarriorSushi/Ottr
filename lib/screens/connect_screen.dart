import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../constants.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/user_service.dart';
import '../widgets/custom_button.dart';
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
    Navigator.of(
      context,
    ).pushReplacement(MaterialPageRoute(builder: (_) => const AuthScreen()));
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
        const SnackBar(
          content: Text(AppConstants.requestSent),
          backgroundColor: Colors.green,
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
    if (_currentUser == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      await _userService.acceptConnectionRequest(
        _currentUser!.uid,
        requester.uid,
      );

      // Navigation will happen automatically due to the user stream listener
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
    if (_currentUser == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
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

  Future<void> _signOut() async {
    try {
      await _authService.signOut();
      _navigateToAuth();
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.lightColor,
      appBar: AppBar(
        title: const Text('OTTR'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.logout), onPressed: _signOut),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User info
              if (_currentUser != null)
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Your Username: ${_currentUser!.username}',
                          style: AppConstants.subheadingStyle,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Status: ${_currentUser!.connectionStatus}',
                          style: const TextStyle(fontSize: 16),
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 24),

              // Connection status
              if (_currentUser?.connectionStatus == 'pending')
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.amber),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.hourglass_top, color: Colors.amber),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          AppConstants.pendingStatus,
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 24),

              // Incoming requests
              if (_incomingRequests.isNotEmpty) ...[
                Text(
                  'Connection Requests',
                  style: AppConstants.subheadingStyle,
                ),
                const SizedBox(height: 8),
                ListView.builder(
                  shrinkWrap: true,
                  itemCount: _incomingRequests.length,
                  itemBuilder: (context, index) {
                    final requester = _incomingRequests[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        title: Text(requester.username),
                        subtitle: const Text('Wants to connect with you'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(
                                Icons.check,
                                color: Colors.green,
                              ),
                              onPressed: () =>
                                  _acceptConnectionRequest(requester),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close, color: Colors.red),
                              onPressed: () =>
                                  _declineConnectionRequest(requester),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),
              ],

              // Connect form
              if (_currentUser?.connectionStatus == 'none') ...[
                Text(
                  AppConstants.connectTitle,
                  style: AppConstants.subheadingStyle,
                ),
                const SizedBox(height: 16),
                Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      // Username field
                      TextFormField(
                        controller: _usernameController,
                        decoration: InputDecoration(
                          labelText: AppConstants.connectHint,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          prefixIcon: const Icon(Icons.person_search),
                          suffixIcon: _isSearching
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : null,
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter a username';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Find user button
                      CustomButton(
                        text: 'Find User',
                        onPressed: _findUserByUsername,
                        isLoading: _isSearching,
                        isOutlined: true,
                      ),
                      const SizedBox(height: 24),

                      // Target user info
                      if (_targetUser != null)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.green.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.green),
                          ),
                          child: Column(
                            children: [
                              Text(
                                'Found: ${_targetUser!.username}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              const SizedBox(height: 16),
                              CustomButton(
                                text: AppConstants.connectButton,
                                onPressed: _sendConnectionRequest,
                                isLoading: _isLoading,
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
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text(
                    _errorMessage,
                    style: const TextStyle(
                      color: AppConstants.errorColor,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
