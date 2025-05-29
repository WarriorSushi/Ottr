import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';
import 'fcm_service_simple.dart';

/// Service for managing user data and connections
class UserService extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  UserModel? _currentUser;
  bool _isLoading = false;
  String? _error;
  StreamSubscription<DocumentSnapshot>? _userSubscription;
  
  // Getters
  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasUsername => _currentUser?.username.isNotEmpty ?? false;
  bool get isLoggedIn => _auth.currentUser != null && _currentUser != null;

  // Method to explicitly set the current user
  void setCurrentUser(UserModel user) {
    _currentUser = user;
    print('UserService: Current user explicitly set via setCurrentUser: ${user.username}');
    _isLoading = false; // Ensure loading state is reset
    _error = null;    // Clear any previous errors
    // Ensure listener is active for this user, authStateChanges listener should also handle this.
    if (_auth.currentUser != null && _auth.currentUser!.uid == user.uid) {
       _setupUserListener(user.uid);
    }
    // Defer notification to avoid setState during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      notifyListeners();
    });
  }


  // Initialize user service and set up listeners
  Future<void> initialize() async {
    print('Initializing UserService...');
    
    final user = _auth.currentUser;
    if (user != null) {
      await loadUserProfile(user.uid);
      _setupUserListener(user.uid);
      
      // Update FCM token when initializing service
      await updateFCMToken();
    }
    
    // Listen to auth state changes
    _auth.authStateChanges().listen((User? user) async {
      if (user != null) {
        print('Auth state changed: User logged in (${user.uid})');
        await loadUserProfile(user.uid);
        _setupUserListener(user.uid);
      } else {
        print('Auth state changed: User logged out');
        _clearUserData();
      }
    });
  }

  // Load user profile from Firestore
  Future<void> loadUserProfile([String? userId]) async {
    final uid = userId ?? _auth.currentUser?.uid;
    if (uid == null) {
      print('Cannot load profile: No user ID provided');
      return;
    }

    _setLoading(true);
    _clearError();

    try {
      print('Loading user profile for UID: $uid');
      final doc = await _firestore
          .collection('users')
          .doc(uid)
          .get();

      if (doc.exists && doc.data() != null) {
        _currentUser = UserModel.fromMap(doc.data()!, doc.id);
        print('User profile loaded successfully: ${_currentUser!.username}');
        
        // Check if FCM token needs to be updated
        if (!_currentUser!.hasValidFCMToken) {
          print('FCM token missing or expired, updating...');
          await updateFCMToken();
        }
      } else {
        print('User document not found, creating minimal profile...');
        // Create minimal profile for authenticated user without Firestore doc
        _currentUser = UserModel(
          uid: uid,
          email: _auth.currentUser?.email ?? '',
          username: '',
          connectionStatus: 'none',
          createdAt: DateTime.now(),
        );
      }
    } catch (e) {
      print('Error loading user profile: $e');
      _setError('Failed to load user profile: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Set up real-time listener for user document
  void _setupUserListener(String userId) {
    _userSubscription?.cancel();
    
    _userSubscription = _firestore
        .collection('users')
        .doc(userId)
        .snapshots()
        .listen(
      (DocumentSnapshot doc) {
        if (doc.exists && doc.data() != null) {
          print('User document updated via listener');
          _currentUser = UserModel.fromMap(
            doc.data() as Map<String, dynamic>,
            doc.id,
          );
          notifyListeners();
        }
      },
      onError: (error) {
        print('Error in user document listener: $error');
        _setError('Connection error: ${error.toString()}');
      }
    );
  }

  // Get user by ID
  Future<UserModel?> getUserById(String uid) async {
    try {
      DocumentSnapshot doc = await _firestore.collection('users').doc(uid).get();
      if (doc.exists) {
        return UserModel.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }

  // Get user by username
  Future<UserModel?> getUserByUsername(String username) async {
    try {
      final QuerySnapshot result = await _firestore
          .collection('users')
          .where('username', isEqualTo: username)
          .limit(1)
          .get();

      if (result.docs.isNotEmpty) {
        return UserModel.fromMap(
          result.docs.first.data() as Map<String, dynamic>,
          result.docs.first.id,
        );
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }

  // Update username and refresh profile
  Future<bool> updateUsername(String username) async {
    if (_auth.currentUser == null) {
      print('Cannot update username: No authenticated user');
      return false;
    }

    _setLoading(true);
    _clearError();

    try {
      print('Updating username to: $username');
      
      // Check if username is already taken
      final existingUserQuery = await _firestore
          .collection('users')
          .where('username', isEqualTo: username)
          .limit(1)
          .get();

      if (existingUserQuery.docs.isNotEmpty && 
          existingUserQuery.docs.first.id != _auth.currentUser!.uid) {
        _setError('Username is already taken');
        return false;
      }

      // Update username in Firestore
      await _firestore
          .collection('users')
          .doc(_auth.currentUser!.uid)
          .update({
            'username': username,
            'updatedAt': FieldValue.serverTimestamp(),
          });

      // Update local user object
      if (_currentUser != null) {
        _currentUser = _currentUser!.copyWith(username: username);
      }

      print('Username updated successfully');
      return true;
    } catch (e) {
      print('Error updating username: $e');
      _setError('Failed to update username: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Helper method to prepare and send connection notifications
  Future<void> _sendConnectionNotification(
    String senderId,
    String receiverId,
    String notificationType,
    {String? additionalMessage}
  ) async {
    try {
      // Get receiver's FCM token to send notification
      final receiverDoc = await _firestore.collection('users').doc(receiverId).get();
      if (receiverDoc.exists && receiverDoc.data() != null) {
        final receiverData = receiverDoc.data()!;
        final fcmToken = receiverData['fcmToken'] as String?;
        final notificationsEnabled = receiverData['notificationsEnabled'] as bool? ?? true;
        final notificationPrefs = receiverData['notificationPreferences'] as Map<String, dynamic>?;
        
        // Check if receiver has enabled connection notifications
        final connectionsEnabled = notificationPrefs?['connections'] as bool? ?? true;
        
        if (fcmToken != null && notificationsEnabled && connectionsEnabled) {
          // Get sender's username for the notification
          final senderDoc = await _firestore.collection('users').doc(senderId).get();
          String senderName = 'Someone';
          if (senderDoc.exists && senderDoc.data() != null) {
            senderName = senderDoc.data()!['username'] as String? ?? 'Someone';
          }
          
          String title = '';
          String body = '';
          
          switch (notificationType) {
            case 'connection_request':
              title = 'New Connection Request';
              body = '$senderName wants to connect with you';
              break;
            case 'connection_accepted':
              title = 'Connection Accepted';
              body = '$senderName accepted your connection request';
              break;
            case 'connection_disconnected':
              title = 'Connection Ended';
              body = '$senderName has disconnected';
              break;
            default:
              title = 'Ottr Notification';
              body = additionalMessage ?? 'You have a new notification';
          }
          
          // In a production app, this would be handled by a Cloud Function
          // For now, we'll just log that a notification would be sent
          print('Would send FCM notification to $receiverId with token: ${fcmToken.substring(0, 10)}...');
          print('Notification type: $notificationType');
          print('Notification content: $title - $body');
        }
      }
    } catch (e) {
      // Don't let notification errors affect the main operation
      print('Error preparing connection notification: $e');
    }
  }

  // Send connection request
  Future<void> sendConnectionRequest(String currentUserId, String targetUserId) async {
    try {
      // Check if target user is available
      DocumentSnapshot targetUserDoc = await _firestore.collection('users').doc(targetUserId).get();
      if (!targetUserDoc.exists) {
        throw Exception('User not found');
      }
      
      Map<String, dynamic> targetUserData = targetUserDoc.data() as Map<String, dynamic>;
      if (targetUserData['connectionStatus'] != 'none') {
        throw Exception('User is currently unavailable');
      }
      
      // Update current user's status
      await _firestore.collection('users').doc(currentUserId).update({
        'connectedTo': targetUserId,
        'connectionStatus': 'pending',
      });
      
      // Send notification to target user about the connection request
      await _sendConnectionNotification(
        currentUserId,
        targetUserId,
        'connection_request',
      );
    } catch (e) {
      rethrow;
    }
  }

  // Accept connection request
  Future<void> acceptConnectionRequest(String currentUserId, String requesterId) async {
    try {
      // Check if requester is still pending
      DocumentSnapshot requesterDoc = await _firestore.collection('users').doc(requesterId).get();
      if (!requesterDoc.exists) {
        throw Exception('User not found');
      }
      
      Map<String, dynamic> requesterData = requesterDoc.data() as Map<String, dynamic>;
      if (requesterData['connectionStatus'] != 'pending' || 
          requesterData['connectedTo'] != currentUserId) {
        throw Exception('No pending request from this user');
      }
      
      // Update current user's status
      await _firestore.collection('users').doc(currentUserId).update({
        'connectedTo': requesterId,
        'connectionStatus': 'connected',
      });
      
      // Update requester's status
      await _firestore.collection('users').doc(requesterId).update({
        'connectionStatus': 'connected',
      });
      
      // Create a pair ID for the chat (lexicographically ordered)
      String pairId = currentUserId.compareTo(requesterId) < 0
          ? '${currentUserId}_$requesterId'
          : '${requesterId}_$currentUserId';
      
      // Create a chat document if it doesn't exist
      await _firestore.collection('messages').doc(pairId).set({
        'participants': [currentUserId, requesterId],
        'lastActivity': FieldValue.serverTimestamp(),
      });
      
      // Send notification to requester that their connection request was accepted
      await _sendConnectionNotification(
        currentUserId,
        requesterId,
        'connection_accepted',
      );
    } catch (e) {
      rethrow;
    }
  }

  // Decline connection request
  Future<void> declineConnectionRequest(String currentUserId, String requesterId) async {
    try {
      // Update requester's status
      await _firestore.collection('users').doc(requesterId).update({
        'connectedTo': null,
        'connectionStatus': 'none',
      });
    } catch (e) {
      rethrow;
    }
  }

  // Disconnect from current connection
  Future<void> disconnect(String currentUserId, String connectedUserId) async {
    try {
      // Update current user's status
      await _firestore.collection('users').doc(currentUserId).update({
        'connectedTo': null,
        'connectionStatus': 'none',
      });
      
      // Update connected user's status
      await _firestore.collection('users').doc(connectedUserId).update({
        'connectedTo': null,
        'connectionStatus': 'none',
      });
      
      // Send notification to the other user about the disconnection
      await _sendConnectionNotification(
        currentUserId,
        connectedUserId,
        'connection_disconnected',
      );
    } catch (e) {
      rethrow;
    }
  }

  // Get incoming connection requests
  Stream<List<UserModel>> getIncomingRequests(String currentUserId) {
    return _firestore
        .collection('users')
        .where('connectedTo', isEqualTo: currentUserId)
        .where('connectionStatus', isEqualTo: 'pending')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => UserModel.fromMap(doc.data(), doc.id))
            .toList());
  }
  
  // Update user connection status
  Future<void> updateUserConnectionStatus(String userId, String status) async {
    try {
      await _firestore.collection('users').doc(userId).update({
        'connectionStatus': status,
        'connectedTo': null,
      });
    } catch (e) {
      rethrow;
    }
  }
  
  // Helper methods
  void _setLoading(bool loading) {
    if (_isLoading != loading) {
      _isLoading = loading;
      // Defer the notification to avoid calling setState during build
      WidgetsBinding.instance.addPostFrameCallback((_) {
        notifyListeners();
      });
    }
  }

  void _setError(String error) {
    _error = error;
    // Defer notification to avoid setState during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      notifyListeners();
    });
  }

  void _clearError() {
    _error = null;
    // Defer notification to avoid setState during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      notifyListeners();
    });
  }

  void _clearUserData() async {
    // Cancel all Firestore listeners
    _userSubscription?.cancel();
    _userSubscription = null;
    
    // Dispose FCM resources
    try {
      await FCMServiceSimple.dispose();
      print('FCM resources disposed during user data clearing');
    } catch (e) {
      print('Error disposing FCM resources: $e');
    }
    
    // Clear all user data
    _currentUser = null;
    _isLoading = false;
    _error = null;
    
    print('UserService: All user data cleared and listeners canceled');
    
    // Defer notification to avoid setState during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      notifyListeners();
    });
  }

  // Update notification preferences
  Future<bool> updateNotificationPreferences({
    bool? enableNotifications,
    Map<String, bool>? preferences,
  }) async {
    if (_auth.currentUser == null || _currentUser == null) {
      print('Cannot update notification preferences: No authenticated user');
      return false;
    }

    _setLoading(true);
    _clearError();

    try {
      print('Updating notification preferences');
      
      final updateData = <String, dynamic>{};
      
      // Update general notification setting if provided
      if (enableNotifications != null) {
        updateData['notificationsEnabled'] = enableNotifications;
      }
      
      // Update specific notification preferences if provided
      if (preferences != null && preferences.isNotEmpty) {
        // Merge with existing preferences rather than replacing completely
        final currentPrefs = _currentUser!.notificationPreferences;
        final mergedPrefs = Map<String, bool>.from(currentPrefs);
        mergedPrefs.addAll(preferences);
        
        updateData['notificationPreferences'] = mergedPrefs;
      }
      
      // Only update if there are changes to make
      if (updateData.isNotEmpty) {
        await _firestore
            .collection('users')
            .doc(_auth.currentUser!.uid)
            .update(updateData);
        
        // Update local user object
        if (_currentUser != null) {
          if (enableNotifications != null) {
            _currentUser = _currentUser!.copyWith(
              notificationsEnabled: enableNotifications,
            );
          }
          
          if (preferences != null && preferences.isNotEmpty) {
            final currentPrefs = _currentUser!.notificationPreferences;
            final mergedPrefs = Map<String, bool>.from(currentPrefs);
            mergedPrefs.addAll(preferences);
            
            _currentUser = _currentUser!.copyWith(
              notificationPreferences: mergedPrefs,
            );
          }
        }
        
        print('Notification preferences updated successfully');
      } else {
        print('No notification preference changes to update');
      }
      
      return true;
    } catch (e) {
      print('Error updating notification preferences: $e');
      _setError('Failed to update notification preferences: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update FCM token
  Future<bool> updateFCMToken() async {
    if (_auth.currentUser == null) {
      print('Cannot update FCM token: No authenticated user');
      return false;
    }

    try {
      print('Updating FCM token');
      return await FCMServiceSimple.updateUserToken();
    } catch (e) {
      print('Error updating FCM token: $e');
      return false;
    }
  }

  // Check if notifications are enabled for a specific type
  bool isNotificationEnabled(String type) {
    if (_currentUser == null) return false;
    return _currentUser!.isNotificationEnabled(type);
  }

  @override
  void dispose() {
    _userSubscription?.cancel();
    super.dispose();
  }
}
