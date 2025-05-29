import 'dart:async';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

/// Simplified FCM Service for token management and basic notification handling
/// This version doesn't use flutter_local_notifications to avoid compatibility issues
class FCMServiceSimple {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  
  static StreamSubscription<RemoteMessage>? _foregroundSubscription;
  static StreamSubscription<String>? _tokenSubscription;
  
  /// Initialize FCM service - MAIN INITIALIZATION METHOD
  static Future<bool> initialize() async {
    try {
      debugPrint('🔔 Initializing Simplified FCM Service...');
      
      // Check if FCM is supported
      if (!_isSupported()) {
        debugPrint('❌ FCM not supported on this platform');
        return false;
      }

      // Request permissions FIRST
      final permissionGranted = await _requestPermissions();
      if (!permissionGranted) {
        debugPrint('❌ FCM permissions not granted');
        return false;
      }
      
      // Set up message handlers
      _setupMessageHandlers();
      
      // Get and save FCM token
      await _handleFCMToken();
      
      // Set up token refresh listener
      _setupTokenRefreshHandler();
      
      debugPrint('✅ Simplified FCM Service initialized successfully');
      return true;
      
    } catch (e, stackTrace) {
      debugPrint('❌ Error initializing FCM: $e');
      debugPrint('Stack trace: $stackTrace');
      return false;
    }
  }

  /// Check if FCM is supported on current platform
  static bool _isSupported() {
    return !kIsWeb && (Platform.isAndroid || Platform.isIOS);
  }

  /// Request notification permissions - CRITICAL FOR ANDROID 13+
  static Future<bool> _requestPermissions() async {
    try {
      // Request FCM permissions
      final NotificationSettings settings = await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        announcement: false,
      );

      debugPrint('🔔 FCM Permission Status: ${settings.authorizationStatus}');

      if (settings.authorizationStatus != AuthorizationStatus.authorized) {
        debugPrint('❌ FCM permission denied');
        return false;
      }

      // For Android 13+ (API level 33+), also request POST_NOTIFICATIONS
      if (Platform.isAndroid) {
        final status = await Permission.notification.request();
        if (status != PermissionStatus.granted) {
          debugPrint('❌ Android notification permission denied');
          return false;
        }
      }

      return true;
    } catch (e) {
      debugPrint('❌ Error requesting FCM permissions: $e');
      return false;
    }
  }

  /// Set up message handlers for different app states
  static void _setupMessageHandlers() {
    // Handler for foreground messages
    _foregroundSubscription = FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('📩 Foreground message received: ${message.messageId}');
      debugPrint('Title: ${message.notification?.title}');
      debugPrint('Body: ${message.notification?.body}');
      debugPrint('Data: ${message.data}');
      
      // Note: For foreground messages, we would normally show a local notification
      // Since we're avoiding flutter_local_notifications for now, we're just logging
      // When you resolve the compatibility issues, you can add local notifications back
    });

    // Handler for when notification is tapped and app is in background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('🔔 App opened from background notification: ${message.messageId}');
      debugPrint('Title: ${message.notification?.title}');
      debugPrint('Body: ${message.notification?.body}');
      debugPrint('Data: ${message.data}');
      
      // Handle notification tap (e.g., navigate to specific screen)
      _handleNotificationTap(message);
    });

    debugPrint('✅ FCM message handlers set up');
  }

  /// Handle notification tap
  static void _handleNotificationTap(RemoteMessage message) {
    try {
      final data = message.data;
      final notificationType = data['type'];
      
      debugPrint('Processing notification tap of type: $notificationType');
      
      // You can add specific handling logic here based on notification type
      // For example, navigate to a specific screen
    } catch (e) {
      debugPrint('❌ Error handling notification tap: $e');
    }
  }

  /// Get and save FCM token
  static Future<void> _handleFCMToken() async {
    try {
      final token = await _firebaseMessaging.getToken();
      debugPrint('📱 FCM Token: ${token?.substring(0, 20)}...');
      
      if (token != null) {
        await _saveFCMTokenToFirestore(token);
      }
    } catch (e) {
      debugPrint('❌ Error handling FCM token: $e');
    }
  }

  /// Set up token refresh handler
  static void _setupTokenRefreshHandler() {
    _tokenSubscription = FirebaseMessaging.instance.onTokenRefresh.listen((String token) {
      debugPrint('🔄 FCM token refreshed: ${token.substring(0, 20)}...');
      _saveFCMTokenToFirestore(token);
    });
  }

  /// Save FCM token to Firestore
  static Future<void> _saveFCMTokenToFirestore(String token) async {
    try {
      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser == null) {
        debugPrint('❌ Cannot save FCM token: No authenticated user');
        return;
      }
      
      await FirebaseFirestore.instance
          .collection('users')
          .doc(currentUser.uid)
          .update({
        'fcmToken': token,
        'fcmTokenUpdated': FieldValue.serverTimestamp(),
        'platform': Platform.isAndroid ? 'android' : 'ios',
      });
      
      debugPrint('✅ FCM token saved to Firestore');
    } catch (e) {
      debugPrint('❌ Error saving FCM token to Firestore: $e');
    }
  }

  /// Update user token (can be called manually)
  static Future<bool> updateUserToken() async {
    try {
      await _handleFCMToken();
      return true;
    } catch (e) {
      debugPrint('❌ Error updating user token: $e');
      return false;
    }
  }

  /// Check FCM permission status
  static Future<String> checkPermissionStatus() async {
    try {
      final settings = await _firebaseMessaging.getNotificationSettings();
      return settings.authorizationStatus.toString();
    } catch (e) {
      debugPrint('❌ Error checking permission status: $e');
      return 'Error: ${e.toString()}';
    }
  }

  /// Clean up resources
  static Future<void> dispose() async {
    try {
      _foregroundSubscription?.cancel();
      _tokenSubscription?.cancel();
      debugPrint('✅ FCM service resources disposed');
    } catch (e) {
      debugPrint('❌ Error disposing FCM service: $e');
    }
  }
}
