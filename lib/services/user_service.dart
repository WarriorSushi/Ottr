import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';

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

  // Initialize user service and set up listeners
  Future<void> initialize() async {
    print('Initializing UserService...');
    
    final user = _auth.currentUser;
    if (user != null) {
      await loadUserProfile(user.uid);
      _setupUserListener(user.uid);
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
    } catch (e) {
      rethrow;
    }
  }

  // Accept connection request
  Future<void> acceptConnectionRequest(String currentUserId, String requesterId) async {
    try {
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
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  void _clearUserData() {
    _userSubscription?.cancel();
    _currentUser = null;
    _isLoading = false;
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _userSubscription?.cancel();
    super.dispose();
  }
}
