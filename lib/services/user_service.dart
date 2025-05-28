import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';

/// Service for managing user data and connections
class UserService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

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
}
