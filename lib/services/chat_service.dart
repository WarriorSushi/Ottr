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
      
      // Get receiver's FCM token to send notification
      try {
        final receiverDoc = await _firestore.collection('users').doc(receiverId).get();
        if (receiverDoc.exists && receiverDoc.data() != null) {
          final receiverData = receiverDoc.data()!;
          final fcmToken = receiverData['fcmToken'] as String?;
          final notificationsEnabled = receiverData['notificationsEnabled'] as bool? ?? true;
          final notificationPrefs = receiverData['notificationPreferences'] as Map<String, dynamic>?;
          
          // Check if receiver has enabled message notifications
          final messagesEnabled = notificationPrefs?['messages'] as bool? ?? true;
          
          if (fcmToken != null && notificationsEnabled && messagesEnabled) {
            // Get sender's username for the notification
            final senderDoc = await _firestore.collection('users').doc(senderId).get();
            String senderName = 'Someone';
            if (senderDoc.exists && senderDoc.data() != null) {
              senderName = senderDoc.data()!['username'] as String? ?? 'Someone';
            }
            
            // In a production app, this would be handled by a Cloud Function
            // For now, we'll just log that a notification would be sent
            print('Would send FCM notification to $receiverId with token: ${fcmToken.substring(0, 10)}...');
            print('Notification content: New message from $senderName');
          }
        }
      } catch (e) {
        // Don't let notification errors affect the message sending
        print('Error preparing notification: $e');
      }
    } catch (e) {
      rethrow;
    }
  }
}
