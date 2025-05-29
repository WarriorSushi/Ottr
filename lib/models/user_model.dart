/// User model representing a user in the Ottr app
class UserModel {
  final String uid;
  final String email;
  final String username;
  final String? connectedTo;
  final String connectionStatus; // none, pending, connected
  final DateTime createdAt;
  
  // FCM-related fields
  final String? fcmToken;
  final DateTime? fcmTokenUpdated;
  final String? platform;
  final bool notificationsEnabled;
  final Map<String, bool> notificationPreferences;

  UserModel({
    required this.uid,
    required this.email,
    required this.username,
    this.connectedTo,
    required this.connectionStatus,
    required this.createdAt,
    this.fcmToken,
    this.fcmTokenUpdated,
    this.platform,
    this.notificationsEnabled = true,
    this.notificationPreferences = const {
      'messages': true,
      'connections': true,
      'system': true,
    },
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
      fcmToken: data['fcmToken'],
      fcmTokenUpdated: data['fcmTokenUpdated']?.toDate(),
      platform: data['platform'],
      notificationsEnabled: data['notificationsEnabled'] ?? true,
      notificationPreferences: Map<String, bool>.from(
        data['notificationPreferences'] ?? {
          'messages': true,
          'connections': true,
          'system': true,
        },
      ),
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
      'fcmToken': fcmToken,
      'fcmTokenUpdated': fcmTokenUpdated,
      'platform': platform,
      'notificationsEnabled': notificationsEnabled,
      'notificationPreferences': notificationPreferences,
    };
  }
  
  /// Check if user has valid FCM token
  bool get hasValidFCMToken {
    if (fcmToken == null || fcmToken!.isEmpty) return false;
    
    // Check if token is older than 30 days
    if (fcmTokenUpdated != null) {
      final daysSinceUpdate = DateTime.now().difference(fcmTokenUpdated!).inDays;
      return daysSinceUpdate < 30;
    }
    
    return true;
  }

  /// Check if specific notification type is enabled
  bool isNotificationEnabled(String type) {
    if (!notificationsEnabled) return false;
    return notificationPreferences[type] ?? false;
  }

  /// Create a copy of UserModel with updated fields
  UserModel copyWith({
    String? uid,
    String? email,
    String? username,
    String? connectedTo,
    String? connectionStatus,
    DateTime? createdAt,
    String? fcmToken,
    DateTime? fcmTokenUpdated,
    String? platform,
    bool? notificationsEnabled,
    Map<String, bool>? notificationPreferences,
  }) {
    return UserModel(
      uid: uid ?? this.uid,
      email: email ?? this.email,
      username: username ?? this.username,
      connectedTo: connectedTo ?? this.connectedTo,
      connectionStatus: connectionStatus ?? this.connectionStatus,
      createdAt: createdAt ?? this.createdAt,
      fcmToken: fcmToken ?? this.fcmToken,
      fcmTokenUpdated: fcmTokenUpdated ?? this.fcmTokenUpdated,
      platform: platform ?? this.platform,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      notificationPreferences: notificationPreferences ?? this.notificationPreferences,
    );
  }
}
