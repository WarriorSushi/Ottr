/// User model representing a user in the Ottr app
class UserModel {
  final String uid;
  final String email;
  final String username;
  final String? connectedTo;
  final String connectionStatus; // none, pending, connected
  final DateTime createdAt;

  UserModel({
    required this.uid,
    required this.email,
    required this.username,
    this.connectedTo,
    required this.connectionStatus,
    required this.createdAt,
  });

  /// Create a UserModel from a Firestore document
  factory UserModel.fromMap(Map<String, dynamic> data, String id) {
    return UserModel(
      uid: id,
      email: data['email'] ?? '',
      username: data['username'] ?? '',
      connectedTo: data['connectedTo'],
      connectionStatus: data['connectionStatus'] ?? 'none',
      createdAt: data['createdAt']?.toDate() ?? DateTime.now(),
    );
  }

  /// Convert UserModel to a Map for Firestore
  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'username': username,
      'connectedTo': connectedTo,
      'connectionStatus': connectionStatus,
      'createdAt': createdAt,
    };
  }

  /// Create a copy of UserModel with updated fields
  UserModel copyWith({
    String? uid,
    String? email,
    String? username,
    String? connectedTo,
    String? connectionStatus,
    DateTime? createdAt,
  }) {
    return UserModel(
      uid: uid ?? this.uid,
      email: email ?? this.email,
      username: username ?? this.username,
      connectedTo: connectedTo ?? this.connectedTo,
      connectionStatus: connectionStatus ?? this.connectionStatus,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
