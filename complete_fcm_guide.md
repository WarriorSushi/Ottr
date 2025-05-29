# Firebase Cloud Messaging (FCM) Implementation Guide for Windsurf AI

## 🎯 IMPORTANT: Instructions for Windsurf Cascade AI

**READ THIS FIRST:** This guide is designed for Windsurf's Cascade AI. Follow each step EXACTLY in order. Do not skip steps or assume anything. Each step has verification commands - run them to ensure success before proceeding.

## 📋 What We're Building

A complete push notification system for the Ottr app with these notification types:
1. **New Message Notifications** - When user receives a message while app is in background
2. **Connection Request Notifications** - When someone sends a connection request  
3. **Connection Accepted Notifications** - When someone accepts your connection request
4. **Connection Disconnected Notifications** - When someone disconnects
5. **System Notifications** - For maintenance, updates, or announcements

## 🚀 STEP 1: Update Dependencies

### 1.1 Open `pubspec.yaml` file
**AI INSTRUCTION:** Replace the entire dependencies section with this exact code:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Core Firebase - EXACT VERSIONS
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.9
  firebase_auth: ^4.15.3
  cloud_firestore: ^4.13.6
  
  # Local notifications - EXACT VERSION
  flutter_local_notifications: ^16.3.0
  
  # Permissions - EXACT VERSION
  permission_handler: ^11.2.0
  
  # Storage and state management - EXACT VERSIONS
  shared_preferences: ^2.2.2
  provider: ^6.1.1
  
  # Utilities - EXACT VERSIONS
  timezone: ^0.9.2
  path_provider: ^2.1.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
```
#### note:
🔧 STEP 1: Update Your pubspec.yaml File
AI INSTRUCTION: Replace the entire dependencies section in your pubspec.yaml file (starting from dependencies: down to just before dev_dependencies:) with this exact content:
yamldependencies:
  flutter:
    sdk: flutter

  # The following adds the Cupertino Icons font to your application.
  # Use with the CupertinoIcons class for iOS style icons.
  cupertino_icons: ^1.0.8

  # Firebase dependencies (EXISTING + NEW FCM)
  firebase_core: ^2.24.2
  firebase_auth: ^4.15.3
  cloud_firestore: ^4.13.6
  firebase_messaging: ^14.7.9  # NEW - FCM Core

  # FCM Local Notifications (NEW)
  flutter_local_notifications: ^16.3.0  # NEW - Local notifications
  permission_handler: ^11.2.0           # NEW - Permissions

  # UI and utility packages (EXISTING)
  provider: ^6.1.1
  intl: ^0.19.0
  flutter_spinkit: ^5.2.0
  timeago: ^3.6.0
  shared_preferences: ^2.2.2

  # FCM Utilities (NEW)
  timezone: ^0.9.2      # NEW - For notification scheduling
  path_provider: ^2.1.2 # NEW - For file operations
VERIFICATION COMMAND: After making the change, run:
bashflutter pub get
Expected Output: All packages should download successfully without conflicts.

🎯 What Changed in Your pubspec.yaml
Added Dependencies (New for FCM):

firebase_messaging: ^14.7.9 - Core FCM functionality
flutter_local_notifications: ^16.3.0 - Show notifications when app is open
permission_handler: ^11.2.0 - Handle Android 13+ notification permissions
timezone: ^0.9.2 - For notification scheduling (if needed later)
path_provider: ^2.1.2 - For file operations (if needed later)

Preserved Your Existing Setup:

✅ All your current Firebase dependencies
✅ Your UI packages (provider, spinkit, timeago, etc.)
✅ Your flutter_launcher_icons configuration
✅ Your assets configuration
✅ Your app name and description


🚀 Next Steps After pubspec.yaml Update
AI INSTRUCTION: Once you've updated the pubspec.yaml and run flutter pub get successfully, continue with the FCM implementation guide starting from STEP 2: Android Configuration.
The rest of the implementation guide I provided earlier will work perfectly with your existing app structure. Your current Firebase setup (core, auth, firestore) is already compatible and will work seamlessly with the new FCM functionality.
Important Notes:

Keep your existing code - The FCM implementation won't break any of your current functionality
Your Firebase project - Use the same Firebase project you're already using
Your launcher icons - Will remain unchanged
Your existing screens - Will work with the FCM navigation system
####
### 1.2 Run dependency installation
**AI INSTRUCTION:** Execute this command in the terminal:
```bash
flutter pub get
```

**VERIFICATION:** Check that no errors appear and all packages download successfully.

---

## 🤖 STEP 2: Android Configuration (CRITICAL - Follow Exactly)

### 2.1 Update `android/app/build.gradle`
**AI INSTRUCTION:** Open the file `android/app/build.gradle` and replace the entire `android` block and `dependencies` block with this:

```gradle
android {
    compileSdk 34
    namespace "com.yourcompany.ottr"
    
    defaultConfig {
        applicationId "com.yourcompany.ottr"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode flutterVersionCode.toInteger()
        versionName flutterVersionName
        multiDexEnabled true
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.debug
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.multidex:multidex:2.0.1'
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
    implementation 'androidx.work:work-runtime:2.8.1'
}
```

### 2.2 Create ProGuard Rules File
**AI INSTRUCTION:** Create a new file at `android/app/proguard-rules.pro` with this exact content:

```pro
# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# FCM
-keep class com.google.firebase.messaging.** { *; }
-keepclassmembers class com.google.firebase.messaging.** { *; }

# Flutter
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }
```

### 2.3 Update Android Manifest
**AI INSTRUCTION:** Open `android/app/src/main/AndroidManifest.xml` and replace the ENTIRE content with this:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- FCM Permissions - REQUIRED -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />

    <application
        android:label="Ottr"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">
        
        <!-- FCM Default Configuration -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_notification" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/colorPrimary" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="ottr_default_channel" />
        
        <!-- Firebase Auto-initialization -->
        <meta-data
            android:name="firebase_messaging_auto_init_enabled"
            android:value="true" />
        <meta-data
            android:name="firebase_analytics_collection_enabled"
            android:value="true" />

        <activity
            android:exported="true"
            android:launchMode="singleTop"
            android:name=".MainActivity"
            android:theme="@style/LaunchTheme">
            
            <meta-data
              android:name="io.flutter.embedding.android.NormalTheme"
              android:resource="@style/NormalTheme" />
              
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
            
            <!-- CRITICAL: Handle notification taps -->
            <intent-filter>
                <action android:name="FLUTTER_NOTIFICATION_CLICK" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>

        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
</manifest>
```

### 2.4 Create Notification Icon
**AI INSTRUCTION:** Create the directory structure and files:

1. Create directory: `android/app/src/main/res/drawable/`
2. In that directory, create file `ic_notification.xml` with this content:

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24"
    android:tint="?attr/colorOnPrimary">
  <path
      android:fillColor="@android:color/white"
      android:pathData="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.89,2 2,2zM18,16v-5c0,-3.07 -1.64,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.63,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"/>
</vector>
```

### 2.5 Create Colors Resource File
**AI INSTRUCTION:** 
1. Create directory (if it doesn't exist): `android/app/src/main/res/values/`
2. In that directory, create file `colors.xml` with this content:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#2196F3</color>
    <color name="colorPrimaryDark">#1976D2</color>
    <color name="colorAccent">#03DAC5</color>
</resources>
```

**VERIFICATION:** Run this command to check Android configuration:
```bash
flutter clean && flutter pub get
```

---

## 📱 STEP 3: Create FCM Service (MOST IMPORTANT FILE)

### 3.1 Create FCM Service File
**AI INSTRUCTION:** Create a new file at `lib/services/fcm_service.dart` with this EXACT content:

```dart
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
          final pairId = data['pairId'];
          if (senderId != null && pairId != null) {
            // Navigate to chat screen - CUSTOMIZE THIS ROUTE
            Navigator.of(context).pushNamed('/chat', arguments: {
              'senderId': senderId,
              'pairId': pairId,
            });
          }
          break;
          
        case 'connection_request':
          // Navigate to connections screen - CUSTOMIZE THIS ROUTE
          Navigator.of(context).pushNamed('/connections');
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
          Navigator.of(context).pushNamed('/connections');
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
```

**VERIFICATION:** Check that the file was created successfully by running:
```bash
flutter analyze lib/services/fcm_service.dart
```

---

## 🔧 STEP 4: Create Background Message Handler

### 4.1 Create Background Handler File
**AI INSTRUCTION:** Create a new file at `lib/services/background_message_handler.dart` with this content:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

/// Background message handler (MUST be top-level function)
/// This handles notifications when the app is completely closed
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    // Initialize Firebase if not already initialized
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp();
    }
    
    debugPrint('🔄 Background message received: ${message.messageId}');
    debugPrint('🔄 Title: ${message.notification?.title}');
    debugPrint('🔄 Body: ${message.notification?.body}');
    debugPrint('🔄 Data: ${message.data}');
    
    // Handle the background message
    // Note: Don't show notifications here as they're handled by the system
    // You can update badge counts, save to local storage, etc.
    
  } catch (e) {
    debugPrint('❌ Error handling background message: $e');
  }
}
```

**VERIFICATION:** Check that the file was created:
```bash
ls -la lib/services/background_message_handler.dart
```

---

## 🚀 STEP 5: Update Main App File

### 5.1 Update `lib/main.dart`
**AI INSTRUCTION:** Replace the ENTIRE content of `lib/main.dart` with this:

```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';
import 'services/fcm_service.dart';
import 'services/background_message_handler.dart';

// Import your existing screens - REPLACE THESE WITH YOUR ACTUAL SCREEN IMPORTS
// import 'screens/splash_screen.dart';
// import 'screens/auth/login_screen.dart';
// import 'screens/home_screen.dart';
// etc.

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    // Initialize Firebase
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    
    // Set background message handler - CRITICAL FOR BACKGROUND NOTIFICATIONS
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    
    runApp(const OttrApp());
    
  } catch (e) {
    debugPrint('❌ Error initializing app: $e');
    runApp(const ErrorApp());
  }
}

class OttrApp extends StatelessWidget {
  const OttrApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ottr',
      navigatorKey: NavigatorKey.key, // CRITICAL: Global navigation key for FCM
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2196F3)),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF2196F3),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: const AppInitializer(),
      routes: {
        // CUSTOMIZE THESE ROUTES FOR YOUR APP
        '/home': (context) => const PlaceholderScreen(title: 'Home'),
        '/chat': (context) => const PlaceholderScreen(title: 'Chat'),
        '/connections': (context) => const PlaceholderScreen(title: 'Connections'),
        '/settings': (context) => const PlaceholderScreen(title: 'Settings'),
      },
      onGenerateRoute: (settings) {
        // Handle dynamic routes with parameters
        if (settings.name == '/chat' && settings.arguments != null) {
          return MaterialPageRoute(
            builder: (context) => PlaceholderScreen(
              title: 'Chat',
              arguments: settings.arguments as Map<String, dynamic>?,
            ),
          );
        }
        return null;
      },
    );
  }
}

class AppInitializer extends StatefulWidget {
  const AppInitializer({Key? key}) : super(key: key);

  @override
  State<AppInitializer> createState() => _AppInitializerState();
}

class _AppInitializerState extends State<AppInitializer> {
  bool _isInitialized = false;
  String? _initializationError;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    try {
      debugPrint('🚀 Starting app initialization...');
      
      // Initialize FCM service - MOST IMPORTANT STEP
      final fcmInitialized = await FCMService.initialize();
      if (!fcmInitialized) {
        debugPrint('⚠️ FCM initialization failed, but app will continue');
      }
      
      // Add a small delay to ensure all services are ready
      await Future.delayed(const Duration(milliseconds: 500));
      
      setState(() {
        _isInitialized = true;
      });
      
      debugPrint('✅ App initialization completed successfully');
      
    } catch (e) {
      debugPrint('❌ App initialization error: $e');
      setState(() {
        _initializationError = e.toString();
        _isInitialized = true; // Continue despite error
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Initializing Ottr...'),
              SizedBox(height: 8),
              Text(
                'Setting up notifications...',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    if (_initializationError != null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.warning_amber, size: 64, color: Colors.orange),
              const SizedBox(height: 16),
              const Text(
                'Initialization Warning',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Some features may not work properly.\n$_initializationError',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const MainAppScreen()),
                ),
                child: const Text('Continue Anyway'),
              ),
            ],
          ),
        ),
      );
    }

    // Success - go to main app
    return const MainAppScreen();
  }
}

// TEMPORARY PLACEHOLDER SCREENS - REPLACE WITH YOUR ACTUAL SCREENS
class MainAppScreen extends StatelessWidget {
  const MainAppScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ottr - FCM Initialized'),
        backgroundColor: const Color(0xFF2196F3),
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.notifications_active,
              size: 64,
              color: Color(0xFF2196F3),
            ),
            const SizedBox(height: 16),
            const Text(
              'FCM Successfully Initialized!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Push notifications are now ready',
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => _testNotification(context),
              child: const Text('Test Notifications'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _showFCMToken(context),
              child: const Text('Show FCM Token'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _testNotification(BuildContext context) async {
    try {
      // This is a simple test - in production, notifications come from your server
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Test notification system is ready! Send a test from Firebase Console.'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _showFCMToken(BuildContext context) async {
    try {
      final token = await FCMService.getToken();
      if (token != null) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('FCM Token'),
            content: SelectableText(token),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error getting token: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

class PlaceholderScreen extends StatelessWidget {
  final String title;
  final Map<String, dynamic>? arguments;
  
  const PlaceholderScreen({
    Key? key,
    required this.title,
    this.arguments,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: const Color(0xFF2196F3),
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '$title Screen',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            if (arguments != null) ...[
              const SizedBox(height: 16),
              const Text('Arguments:'),
              Text(arguments.toString()),
            ],
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Go Back'),
            ),
          ],
        ),
      ),
    );
  }
}

class ErrorApp extends StatelessWidget {
  const ErrorApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              const Text(
                'Failed to Initialize App',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text('Please restart the application.'),
            ],
          ),
        ),
      ),
    );
  }
}
```

**VERIFICATION:** Check the main.dart file:
```bash
flutter analyze lib/main.dart
```

---

## 📊 STEP 6: Update User Model (If You Have One)

### 6.1 Update User Model
**AI INSTRUCTION:** If you have a user model file (like `lib/models/user_model.dart`), add these FCM-related fields. If you don't have this file, create it:

```dart
import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String email;
  final String username;
  final String? connectedTo;
  final String connectionStatus;
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

  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return UserModel(
      uid: doc.id,
      email: data['email'] ?? '',
      username: data['username'] ?? '',
      connectedTo: data['connectedTo'],
      connectionStatus: data['connectionStatus'] ?? 'none',
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      fcmToken: data['fcmToken'],
      fcmTokenUpdated: (data['fcmTokenUpdated'] as Timestamp?)?.toDate(),
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

  Map<String, dynamic> toFirestore() {
    return {
      'email': email,
      'username': username,
      'connectedTo': connectedTo,
      'connectionStatus': connectionStatus,
      'createdAt': Timestamp.fromDate(createdAt),
      'fcmToken': fcmToken,
      'fcmTokenUpdated': fcmTokenUpdated != null 
          ? Timestamp.fromDate(fcmTokenUpdated!) 
          : null,
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
}
```

---

## 🔥 STEP 7: Test the Implementation

### 7.1 Build and Run
**AI INSTRUCTION:** Execute these commands in order:

```bash
# Clean the project
flutter clean

# Get dependencies
flutter pub get

# Build and run (make sure a device/emulator is connected)
flutter run
```

**VERIFICATION:** 
- App should launch without errors
- You should see "FCM Successfully Initialized!" message
- Check console logs for "✅ FCM Service initialized successfully"

### 7.2 Test FCM Token Generation
**AI INSTRUCTION:** In the running app:
1. Tap the "Show FCM Token" button
2. Copy the token that appears
3. Save this token - you'll need it for testing notifications

**VERIFICATION:** Token should be a long string starting with something like "dxxxxx" or "fxxxxx"

### 7.3 Test Notification from Firebase Console
**AI INSTRUCTION:** Go to Firebase Console → Cloud Messaging → Send your first message:

1. **Message title:** "Test Notification"
2. **Message text:** "Your FCM is working!"
3. **Target:** Select "Single device"
4. **FCM registration token:** Paste the token you copied
5. **Additional options:**
   - Set custom data: `type` = `test`
6. Click **Send**

**VERIFICATION:** You should receive a notification on your device

---

## 🌐 STEP 8: Firebase Console Setup

### 8.1 Enable Required APIs
**AI INSTRUCTION:** Go to [Google Cloud Console](https://console.cloud.google.com/):

1. Select your Firebase project
2. Go to "APIs & Services" → "Library"
3. Search and enable these APIs:
   - **Firebase Cloud Messaging API**
   - **Cloud Functions API** 
   - **Cloud Firestore API**
   - **Firebase Authentication API**

**VERIFICATION:** All APIs should show "API enabled" status

### 8.2 Get Service Account Key (For Cloud Functions)
**AI INSTRUCTION:** In Firebase Console:
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Keep this file secure - you'll need it for Cloud Functions

---

## 🔧 STEP 9: Integration with Your Existing App

### 9.1 Integration Steps
**AI INSTRUCTION:** To integrate with your existing app:

1. **Update your authentication service** to call `FCMService.updateUserToken()` after login
2. **Update your chat/messaging service** to include FCM token handling
3. **Replace placeholder screens** in main.dart with your actual screens
4. **Update navigation routes** in the FCM service to match your app's routes

### 9.2 Example Auth Service Integration
**AI INSTRUCTION:** In your auth service, add this after successful login:

```dart
// After successful login
await FCMService.updateUserToken();

// When user logs out
await FCMService.dispose();
```

### 9.3 Example Message Service Integration
**AI INSTRUCTION:** When sending messages, ensure the recipient has a valid FCM token in Firestore.

---

## 🧪 STEP 10: Advanced Testing & Troubleshooting

### 10.1 Debug Mode Testing
**AI INSTRUCTION:** Add these debug commands to test different scenarios:

```bash
# Test in debug mode
flutter run --debug

# Test in release mode
flutter run --release

# Check device logs (Android)
adb logcat | grep -i flutter

# Check FCM logs specifically
adb logcat | grep -i "fcm\|firebase\|notification"
```

### 10.2 Common Issues & Solutions

**Issue: "Firebase options not found"**
**Solution:** Run `flutterfire configure` and ensure `firebase_options.dart` exists

**Issue: "Notifications not appearing"**
**Solution:** Check notification permissions and channel creation

**Issue: "Token null or empty"**
**Solution:** Ensure Google Play Services are updated and device has internet

**Issue: "Navigation not working from notification"**
**Solution:** Verify NavigatorKey is properly set in MaterialApp

### 10.3 Production Checklist
**AI INSTRUCTION:** Before going to production:

- [ ] Test on physical device (not just emulator)
- [ ] Test notifications in all app states (foreground, background, terminated)
- [ ] Test notification navigation
- [ ] Verify FCM tokens are being saved to Firestore
- [ ] Test permission requests on different Android versions
- [ ] Verify notification channels are working
- [ ] Test token refresh functionality

---

## 🚀 STEP 11: Cloud Functions (Optional but Recommended)

### 11.1 Initialize Cloud Functions
**AI INSTRUCTION:** If you want server-side notification sending:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize functions
firebase init functions

# Choose TypeScript
# Install dependencies with npm
```

### 11.2 Basic Cloud Function
**AI INSTRUCTION:** In `functions/src/index.ts`, add this basic function:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const sendNotificationOnNewMessage = functions.firestore
  .document('messages/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const messageData = snap.data();
    const recipientToken = messageData.recipientFCMToken;
    
    if (recipientToken) {
      const payload = {
        notification: {
          title: 'New Message',
          body: messageData.text,
        },
        data: {
          type: 'new_message',
          senderId: messageData.senderId,
        },
        token: recipientToken,
      };
      
      await admin.messaging().send(payload);
    }
  });
```

### 11.3 Deploy Cloud Functions
**AI INSTRUCTION:** Deploy your functions:

```bash
cd functions
npm run build
firebase deploy --only functions
```

---

## ✅ FINAL VERIFICATION CHECKLIST

**AI INSTRUCTION:** Before marking this implementation complete, verify all these items:

### Core Functionality
- [ ] App launches without FCM-related errors
- [ ] FCM token is generated and displayed
- [ ] Local notifications work when app is foreground
- [ ] Background notifications work when app is backgrounded
- [ ] Terminated notifications work when app is closed
- [ ] Notification tapping opens correct screens
- [ ] FCM tokens are saved to Firestore (if user is authenticated)

### Permissions
- [ ] Notification permissions are requested and granted
- [ ] Android 13+ POST_NOTIFICATIONS permission works
- [ ] Permission denial is handled gracefully

### Android Configuration
- [ ] All required dependencies are added
- [ ] Android manifest has all required permissions
- [ ] Notification channels are created
- [ ] Icons and colors are properly configured
- [ ] ProGuard rules are in place

### Integration
- [ ] NavigatorKey is properly set for navigation from notifications
- [ ] Background message handler is registered
- [ ] FCM service initializes on app start
- [ ] Token refresh is handled automatically

### Error Handling
- [ ] All try-catch blocks are in place
- [ ] Detailed logging for debugging
- [ ] Graceful degradation when FCM fails
- [ ] Invalid token cleanup

---

## 🎉 SUCCESS!

If all verification steps pass, your FCM implementation is complete and ready for production! 

**Next Steps:**
1. Replace placeholder screens with your actual app screens
2. Customize notification content and navigation
3. Set up Cloud Functions for server-side notification sending
4. Test thoroughly on different devices and Android versions
5. Monitor FCM token refresh rates and update frequency

**Important Notes for Production:**
- Always test on physical devices, not just emulators
- Monitor Firebase Console for delivery statistics
- Set up proper error logging and monitoring
- Consider implementing notification analytics
- Regular token cleanup for inactive users

**Support:**
- Check Firebase Console → Cloud Messaging for delivery reports
- Use Firebase Crashlytics for error monitoring
- Monitor device logs for detailed debugging