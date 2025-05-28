import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/message_model.dart';

/// Service for handling chat messages
class ChatService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Get chat messages stream
  Stream<List<MessageModel>> getMessages(String userId, String otherUserId) {
    // Create a pair ID (lexicographically ordered)
    String pairId = userId.compareTo(otherUserId) < 0
        ? '${userId}_$otherUserId'
        : '${otherUserId}_$userId';

    return _firestore
        .collection('messages')
        .doc(pairId)
        .collection('chats')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => MessageModel.fromMap(doc.data(), doc.id))
            .toList());
  }

  // Send a message
  Future<void> sendMessage(
      String senderId, String receiverId, String message) async {
    try {
      // Create a pair ID (lexicographically ordered)
      String pairId = senderId.compareTo(receiverId) < 0
          ? '${senderId}_$receiverId'
          : '${receiverId}_$senderId';

      // Create a new message document
      await _firestore
          .collection('messages')
          .doc(pairId)
          .collection('chats')
          .add({
        'senderId': senderId,
        'message': message,
        'timestamp': FieldValue.serverTimestamp(),
      });

      // Update last activity
      await _firestore.collection('messages').doc(pairId).update({
        'lastActivity': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      rethrow;
    }
  }
}
