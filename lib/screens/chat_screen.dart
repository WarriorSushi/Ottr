import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../constants.dart';
import '../models/message_model.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/chat_service.dart';
import '../services/user_service.dart';
import '../widgets/message_bubble.dart';
import 'connect_screen.dart';

/// Screen for chatting with a connected user
class ChatScreen extends StatefulWidget {
  final String otherUserId;

  const ChatScreen({super.key, required this.otherUserId});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final AuthService _authService = AuthService();
  final UserService _userService = UserService();
  final ChatService _chatService = ChatService();
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  UserModel? _currentUser;
  UserModel? _otherUser;
  List<MessageModel> _messages = [];
  bool _isLoading = false;
  bool _isSending = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadUsers() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        _navigateToConnect();
        return;
      }

      // Get current user
      _authService.getUserStream(user.uid).listen((userModel) {
        if (mounted) {
          setState(() {
            _currentUser = userModel;
          });

          // If disconnected, navigate back to connect screen
          if (userModel?.connectionStatus != 'connected') {
            _navigateToConnect();
          }
        }
      });

      // Get other user
      final otherUser = await _userService.getUserById(widget.otherUserId);
      if (otherUser == null) {
        throw Exception('User not found');
      }

      setState(() {
        _otherUser = otherUser;
      });

      // Get messages
      _chatService.getMessages(user.uid, widget.otherUserId).listen((messages) {
        if (mounted) {
          setState(() {
            _messages = messages;
          });

          // Scroll to bottom when new message arrives
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              0,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
          }
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

  void _navigateToConnect() {
    Navigator.of(
      context,
    ).pushReplacement(MaterialPageRoute(builder: (_) => const ConnectScreen()));
  }

  Future<void> _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty || _currentUser == null || _otherUser == null) return;

    setState(() {
      _isSending = true;
      _errorMessage = '';
    });

    try {
      await _chatService.sendMessage(
        _currentUser!.uid,
        _otherUser!.uid,
        message,
      );

      _messageController.clear();
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
      }
    }
  }

  Future<void> _showDisconnectConfirmation() async {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Disconnect'),
          content: const Text('Are you sure you want to disconnect from this chat?'),
          actions: <Widget>[
            TextButton(
              child: const Text('Cancel'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            TextButton(
              child: const Text('Yes', style: TextStyle(color: Colors.red)),
              onPressed: () {
                Navigator.of(context).pop();
                _disconnect();
              },
            ),
          ],
        );
      },
    );
  }

  Future<void> _disconnect() async {
    if (_currentUser == null || _otherUser == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      await _userService.disconnect(_currentUser!.uid, _otherUser!.uid);

      // Navigation will happen automatically due to the user stream listener
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: _otherUser != null
            ? Text(_otherUser!.username)
            : const Text('Chat'),
        actions: [
          _isLoading
              ? const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  ),
                )
              : PopupMenuButton<String>(
                  icon: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('More', style: TextStyle(fontSize: 14)),
                      Icon(Icons.arrow_drop_down),
                    ],
                  ),
                  onSelected: (value) {
                    if (value == 'disconnect') {
                      _showDisconnectConfirmation();
                    }
                  },
                  itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
                    const PopupMenuItem<String>(
                      value: 'disconnect',
                      child: Row(
                        children: [
                          Icon(Icons.link_off, color: Colors.red),
                          SizedBox(width: 8),
                          Text('Disconnect', style: TextStyle(color: Colors.red)),
                        ],
                      ),
                    ),
                  ],
                ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Connection status
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              color: Colors.green.withOpacity(0.1),
              child: Row(
                children: [
                  const Icon(Icons.link, color: Colors.green),
                  const SizedBox(width: 8),
                  Text(
                    _otherUser != null
                        ? '${AppConstants.connectedStatus}${_otherUser!.username}'
                        : 'Connected',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
            ),

            // Error message
            if (_errorMessage.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(8),
                color: AppConstants.errorColor.withOpacity(0.1),
                child: Text(
                  _errorMessage,
                  style: const TextStyle(
                    color: AppConstants.errorColor,
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

            // Messages list
            Expanded(
              child: _messages.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.chat_bubble_outline,
                            size: 64,
                            color: Colors.grey.withOpacity(0.5),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'No messages yet',
                            style: TextStyle(color: Colors.grey, fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Start the conversation!',
                            style: TextStyle(color: Colors.grey, fontSize: 14),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      reverse: true,
                      itemCount: _messages.length,
                      itemBuilder: (context, index) {
                        final message = _messages[index];
                        final isMe = message.senderId == _currentUser?.uid;
                        final senderUsername = isMe
                            ? _currentUser?.username ?? 'You'
                            : _otherUser?.username ?? 'Other';

                        return MessageBubble(
                          message: message,
                          isMe: isMe,
                          senderUsername: senderUsername,
                        );
                      },
                    ),
            ),

            // Message input
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.2),
                    spreadRadius: 1,
                    blurRadius: 2,
                    offset: const Offset(0, -1),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      decoration: InputDecoration(
                        hintText: AppConstants.messageHint,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: AppConstants.lightColor,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Material(
                    color: AppConstants.primaryColor,
                    borderRadius: BorderRadius.circular(24),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(24),
                      onTap: _sendMessage,
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        child: _isSending
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : const Icon(Icons.send, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
