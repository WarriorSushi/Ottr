/// Message model representing a chat message in the Ottr app
class MessageModel {
  final String id;
  final String senderId;
  final String message;
  final DateTime timestamp;

  MessageModel({
    required this.id,
    required this.senderId,
    required this.message,
    required this.timestamp,
  });

  /// Create a MessageModel from a Firestore document
  factory MessageModel.fromMap(Map<String, dynamic> data, String id) {
    return MessageModel(
      id: id,
      senderId: data['senderId'] ?? '',
      message: data['message'] ?? '',
      timestamp: data['timestamp']?.toDate() ?? DateTime.now(),
    );
  }

  /// Convert MessageModel to a Map for Firestore
  Map<String, dynamic> toMap() {
    return {
      'senderId': senderId,
      'message': message,
      'timestamp': timestamp,
    };
  }
}
