import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class FCMService {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();
  
  static StreamSubscription<RemoteMessage>? _foregroundSubscription;
  static StreamSubscription<RemoteMessage>? _backgroundSubscription;
  static StreamSubscription<String>? _tokenSubscription;
  
  // Notification channels
  static const String _defaultChannelId = 'ottr_default_channel';
  static const String _messageChannelId = 'ottr_messages';
  static const String _connectionChannelId = 'ottr_connections';
  static const String _systemChannelId = 'ottr_system';

  /// Initialize FCM service - MAIN INITIALIZATION METHOD
  static Future<bool> initialize() async {
    try {
      debugPrint('🔔 Initializing FCM Service...');
      
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

      // Initialize local notifications
      await _initializeLocalNotifications();
      
      // Set up message handlers
      await _setupMessageHandlers();
      
      // Get and save FCM token
      await _handleFCMToken();
      
      // Set up token refresh listener
      _setupTokenRefreshHandler();
      
      debugPrint('✅ FCM Service initialized successfully');
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
      debugPrint('❌ Error requesting permissions: $e');
      return false;
    }
  }

  /// Initialize local notifications
  static Future<void> _initializeLocalNotifications() async {
    try {
      // Android settings
      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@drawable/ic_notification');

      // iOS settings (for future iOS support)
      const DarwinInitializationSettings initializationSettingsIOS =
          DarwinInitializationSettings(
        requestSoundPermission: true,
        requestBadgePermission: true,
        requestAlertPermission: true,
      );

      const InitializationSettings initializationSettings =
          InitializationSettings(
        android: initializationSettingsAndroid,
        iOS: initializationSettingsIOS,
      );

      await _localNotifications.initialize(
        initializationSettings,
        onDidReceiveNotificationResponse: _onNotificationTapped,
      );

      // Create notification channels for Android
      await _createNotificationChannels();
      
      debugPrint('✅ Local notifications initialized');
    } catch (e) {
      debugPrint('❌ Error initializing local notifications: $e');
      rethrow;
    }
  }

  /// Create notification channels for Android - REQUIRED FOR ANDROID 8+
  static Future<void> _createNotificationChannels() async {
    if (Platform.isAndroid) {
      try {
        final androidImplementation = _localNotifications
            .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();

        if (androidImplementation != null) {
          // Default channel
          await androidImplementation.createNotificationChannel(
            const AndroidNotificationChannel(
              _defaultChannelId,
              'Default Notifications',
              description: 'Default notifications for Ottr app',
              importance: Importance.high,
              playSound: true,
              enableVibration: true,
            ),
          );

          // Messages channel
          await androidImplementation.createNotificationChannel(
            const AndroidNotificationChannel(
              _messageChannelId,
              'Messages',
              description: 'New message notifications',
              importance: Importance.high,
              playSound: true,
              enableVibration: true,
            ),
          );

          // Connections channel
          await androidImplementation.createNotificationChannel(
            const AndroidNotificationChannel(
              _connectionChannelId,
              'Connections',
              description: 'Connection request and status notifications',
              importance: Importance.high,
              playSound: true,
              enableVibration: true,
            ),
          );

          // System channel
          await androidImplementation.createNotificationChannel(
            const AndroidNotificationChannel(
              _systemChannelId,
              'System',
              description: 'System and maintenance notifications',
              importance: Importance.defaultImportance,
              playSound: false,
              enableVibration: false,
            ),
          );
        }

        debugPrint('✅ Notification channels created');
      } catch (e) {
        debugPrint('❌ Error creating notification channels: $e');
      }
    }
  }

  /// Setup message handlers - HANDLES ALL NOTIFICATION STATES
  static Future<void> _setupMessageHandlers() async {
    try {
      // Handle foreground messages (app is open and active)
      _foregroundSubscription = FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      
      // Handle background messages (app is backgrounded but running)
      _backgroundSubscription = FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);
      
      // Handle messages when app is terminated (app was completely closed)
      final RemoteMessage? initialMessage = await _firebaseMessaging.getInitialMessage();
      if (initialMessage != null) {
        await _handleMessageOpenedApp(initialMessage);
      }
      
      debugPrint('✅ Message handlers set up');
    } catch (e) {
      debugPrint('❌ Error setting up message handlers: $e');
      rethrow;
    }
  }

  /// Handle FCM token
  static Future<void> _handleFCMToken() async {
    try {
      final token = await _firebaseMessaging.getToken();
      if (token != null) {
        await _saveFCMToken(token);
        debugPrint('✅ FCM Token: ${token.substring(0, 20)}...');
      } else {
        debugPrint('❌ Failed to get FCM token');
      }
    } catch (e) {
      debugPrint('❌ Error handling FCM token: $e');
    }
  }

  /// Save FCM token to Firestore and local storage
  static Future<void> _saveFCMToken(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      // Check if token has changed
      final savedToken = prefs.getString('fcm_token');
      if (savedToken == token) {
        debugPrint('🔔 FCM token unchanged, skipping save');
        return;
      }

      // Save to local storage
      await prefs.setString('fcm_token', token);
      await prefs.setInt('fcm_token_timestamp', DateTime.now().millisecondsSinceEpoch);

      // Save to Firestore if user is authenticated
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .update({
          'fcmToken': token,
          'fcmTokenUpdated': FieldValue.serverTimestamp(),
          'platform': Platform.operatingSystem,
        });
        debugPrint('✅ FCM token saved to Firestore');
      } else {
        debugPrint('⚠️ User not authenticated, FCM token saved locally only');
      }
    } catch (e) {
      debugPrint('❌ Error saving FCM token: $e');
    }
  }

  /// Setup token refresh handler
  static void _setupTokenRefreshHandler() {
    _tokenSubscription = _firebaseMessaging.onTokenRefresh.listen(
      (token) async {
        debugPrint('🔄 FCM token refreshed');
        await _saveFCMToken(token);
      },
      onError: (error) {
        debugPrint('❌ Error in token refresh: $error');
      },
    );
  }

  /// Handle foreground messages (when app is open)
  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    try {
      debugPrint('📱 Foreground message received: ${message.messageId}');
      debugPrint('📱 Title: ${message.notification?.title}');
      debugPrint('📱 Body: ${message.notification?.body}');
      debugPrint('📱 Data: ${message.data}');

      // Save message to local database for offline access
      await _saveMessageLocally(message);

      // Show local notification (even when app is open)
      await _showLocalNotification(message);

    } catch (e) {
      debugPrint('❌ Error handling foreground message: $e');
    }
  }

  /// Handle message opened app (when user taps notification)
  static Future<void> _handleMessageOpenedApp(RemoteMessage message) async {
    try {
      debugPrint('🚀 Message opened app: ${message.messageId}');
      debugPrint('🚀 Data: ${message.data}');

      // Handle navigation based on message type
      await _handleNotificationNavigation(message.data);
    } catch (e) {
      debugPrint('❌ Error handling message opened app: $e');
    }
  }

  /// Show local notification
  static Future<void> _showLocalNotification(RemoteMessage message) async {
    try {
      final notificationType = message.data['type'] ?? 'default';
      String channelId;
      
      // Determine channel based on notification type
      switch (notificationType) {
        case 'new_message':
          channelId = _messageChannelId;
          break;
        case 'connection_request':
        case 'connection_accepted':
        case 'connection_disconnected':
          channelId = _connectionChannelId;
          break;
        case 'system':
        case 'maintenance':
          channelId = _systemChannelId;
          break;
        default:
          channelId = _defaultChannelId;
      }

      // Configure notification details
      final AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        channelId,
        _getChannelName(channelId),
        channelDescription: _getChannelDescription(channelId),
        importance: Importance.high,
        priority: Priority.high,
        showWhen: true,
        autoCancel: true,
        color: const Color(0xFF2196F3),
        icon: '@drawable/ic_notification',
      );

      const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );

      final NotificationDetails notificationDetails = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      // Show notification
      await _localNotifications.show(
        message.hashCode,
        message.notification?.title ?? _getDefaultTitle(notificationType),
        message.notification?.body ?? _getDefaultBody(notificationType),
        notificationDetails,
        payload: jsonEncode(message.data),
      );

      debugPrint('✅ Local notification shown');
    } catch (e) {
      debugPrint('❌ Error showing local notification: $e');
    }
  }

  /// Handle notification tap
  static Future<void> _onNotificationTapped(NotificationResponse response) async {
    try {
      debugPrint('🔔 Notification tapped: ${response.payload}');
      
      if (response.payload != null) {
        final data = jsonDecode(response.payload!) as Map<String, dynamic>;
        await _handleNotificationNavigation(data);
      }
    } catch (e) {
      debugPrint('❌ Error handling notification tap: $e');
    }
  }

  /// Handle notification navigation - CUSTOMIZE THIS FOR YOUR APP
  static Future<void> _handleNotificationNavigation(Map<String, dynamic> data) async {
    try {
      final type = data['type'];
      
      // Get the current navigation context
      final context = NavigatorKey.currentContext;
      if (context == null) {
        debugPrint('❌ No navigation context available');
        return;
      }
      
      switch (type) {
        case 'new_message':
          final senderId = data['senderId'];
          if (senderId != null) {
            // Navigate to chat screen - CUSTOMIZE THIS ROUTE
            Navigator.of(context).pushNamed('/chat', arguments: {
              'userId': senderId,
            });
          }
          break;
          
        case 'connection_request':
          // Navigate to connections screen - CUSTOMIZE THIS ROUTE
          Navigator.of(context).pushNamed('/connect');
          break;
          
        case 'connection_accepted':
          final accepterId = data['accepterId'];
          if (accepterId != null) {
            // Navigate to chat screen with new connection - CUSTOMIZE THIS ROUTE
            Navigator.of(context).pushNamed('/chat', arguments: {
              'userId': accepterId,
            });
          }
          break;
          
        case 'connection_disconnected':
          // Navigate to connections screen - CUSTOMIZE THIS ROUTE
          Navigator.of(context).pushNamed('/connect');
          break;
          
        default:
          // Navigate to home screen - CUSTOMIZE THIS ROUTE
          Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
      }
    } catch (e) {
      debugPrint('❌ Error handling notification navigation: $e');
    }
  }

  /// Save message locally for offline access
  static Future<void> _saveMessageLocally(RemoteMessage message) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final messages = prefs.getStringList('cached_notifications') ?? [];
      
      final messageData = {
        'id': message.messageId,
        'title': message.notification?.title,
        'body': message.notification?.body,
        'data': message.data,
        'timestamp': DateTime.now().toIso8601String(),
      };
      
      messages.add(jsonEncode(messageData));
      
      // Keep only last 100 messages to prevent storage bloat
      if (messages.length > 100) {
        messages.removeAt(0);
      }
      
      await prefs.setStringList('cached_notifications', messages);
    } catch (e) {
      debugPrint('❌ Error saving message locally: $e');
    }
  }

  /// Helper methods for notification details
  static String _getChannelName(String channelId) {
    switch (channelId) {
      case _messageChannelId: return 'Messages';
      case _connectionChannelId: return 'Connections';
      case _systemChannelId: return 'System';
      default: return 'Default';
    }
  }

  static String _getChannelDescription(String channelId) {
    switch (channelId) {
      case _messageChannelId: return 'New message notifications';
      case _connectionChannelId: return 'Connection request and status notifications';
      case _systemChannelId: return 'System and maintenance notifications';
      default: return 'Default notifications';
    }
  }

  static String _getDefaultTitle(String type) {
    switch (type) {
      case 'new_message': return 'New Message';
      case 'connection_request': return 'Connection Request';
      case 'connection_accepted': return 'Connection Accepted';
      case 'connection_disconnected': return 'Connection Ended';
      default: return 'Ottr';
    }
  }

  static String _getDefaultBody(String type) {
    switch (type) {
      case 'new_message': return 'You have a new message';
      case 'connection_request': return 'Someone wants to connect with you';
      case 'connection_accepted': return 'Your connection request was accepted';
      case 'connection_disconnected': return 'A connection has ended';
      default: return 'You have a new notification';
    }
  }

  /// PUBLIC METHODS FOR APP USAGE

  /// Get current FCM token
  static Future<String?> getToken() async {
    try {
      return await _firebaseMessaging.getToken();
    } catch (e) {
      debugPrint('❌ Error getting FCM token: $e');
      return null;
    }
  }

  /// Subscribe to topic
  static Future<bool> subscribeToTopic(String topic) async {
    try {
      await _firebaseMessaging.subscribeToTopic(topic);
      debugPrint('✅ Subscribed to topic: $topic');
      return true;
    } catch (e) {
      debugPrint('❌ Error subscribing to topic $topic: $e');
      return false;
    }
  }

  /// Unsubscribe from topic
  static Future<bool> unsubscribeFromTopic(String topic) async {
    try {
      await _firebaseMessaging.unsubscribeFromTopic(topic);
      debugPrint('✅ Unsubscribed from topic: $topic');
      return true;
    } catch (e) {
      debugPrint('❌ Error unsubscribing from topic $topic: $e');
      return false;
    }
  }

  /// Clear all notifications
  static Future<void> clearAllNotifications() async {
    try {
      await _localNotifications.cancelAll();
      debugPrint('✅ All notifications cleared');
    } catch (e) {
      debugPrint('❌ Error clearing notifications: $e');
    }
  }

  /// Update user's FCM token in Firestore
  static Future<bool> updateUserToken() async {
    try {
      final token = await getToken();
      if (token != null) {
        await _saveFCMToken(token);
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('❌ Error updating user token: $e');
      return false;
    }
  }

  /// Check notification permissions status
  static Future<String> checkNotificationPermissions() async {
    try {
      final NotificationSettings settings = await _firebaseMessaging.getNotificationSettings();
      
      // For Android 13+, also check POST_NOTIFICATIONS permission
      if (Platform.isAndroid) {
        final status = await Permission.notification.status;
        if (status != PermissionStatus.granted) {
          return 'Android: ${status.toString()}, FCM: ${settings.authorizationStatus.toString()}';
        }
      }
      
      return settings.authorizationStatus.toString();
    } catch (e) {
      debugPrint('❌ Error checking notification permissions: $e');
      return 'Error: ${e.toString()}';
    }
  }

  /// Show a local notification (for testing)
  static Future<void> showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    try {
      // Determine the channel ID based on the payload type
      String channelId = _defaultChannelId;
      
      if (payload != null) {
        try {
          final Map<String, dynamic> data = jsonDecode(payload);
          final String type = data['type'] ?? '';
          
          if (type == 'messages') {
            channelId = _messageChannelId;
          } else if (type == 'connections') {
            channelId = _connectionChannelId;
          } else if (type == 'system') {
            channelId = _systemChannelId;
          }
        } catch (e) {
          debugPrint('❌ Error parsing notification payload: $e');
        }
      }
      
      // Android notification details
      final AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        channelId,
        _getChannelName(channelId),
        channelDescription: _getChannelDescription(channelId),
        importance: Importance.high,
        priority: Priority.high,
        ticker: 'Ottr Notification',
        styleInformation: BigTextStyleInformation(body),
      );
      
      // iOS notification details
      const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );
      
      // Combined platform notification details
      final NotificationDetails platformDetails = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );
      
      // Show the notification
      await _localNotifications.show(
        DateTime.now().millisecondsSinceEpoch.remainder(100000),
        title,
        body,
        platformDetails,
        payload: payload,
      );
      
      debugPrint('✅ Local notification sent: $title');
    } catch (e) {
      debugPrint('❌ Error showing local notification: $e');
      rethrow;
    }
  }

  /// Dispose of resources
  static Future<void> dispose() async {
    try {
      await _foregroundSubscription?.cancel();
      await _backgroundSubscription?.cancel();
      await _tokenSubscription?.cancel();
      debugPrint('✅ FCM Service disposed');
    } catch (e) {
      debugPrint('❌ Error disposing FCM service: $e');
    }
  }
}

// Global navigation key for navigation from static methods
class NavigatorKey {
  static final GlobalKey<NavigatorState> _key = GlobalKey<NavigatorState>();
  
  static GlobalKey<NavigatorState> get key => _key;
  static BuildContext? get currentContext => _key.currentContext;
}
