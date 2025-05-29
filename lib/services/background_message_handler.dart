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
