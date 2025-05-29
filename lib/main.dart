import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:provider/provider.dart';
import 'constants.dart';
import 'navigator_key.dart';
import 'firebase_options.dart';
import 'screens/splash_screen.dart';
import 'screens/notification_settings_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/notification_test_screen.dart';
import 'services/auth_service.dart';
import 'services/user_service.dart';
import 'services/fcm_service_simple.dart';
import 'services/background_message_handler.dart';

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
    runApp(const OttrApp()); // Still run the app even if FCM fails
  }
}

class OttrApp extends StatefulWidget {
  const OttrApp({Key? key}) : super(key: key);

  @override
  State<OttrApp> createState() => _OttrAppState();
}

class _OttrAppState extends State<OttrApp> {
  @override
  void initState() {
    super.initState();
    // Initialize FCM after the app is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeFCM();
    });
  }

  Future<void> _initializeFCM() async {
    try {
      // Initialize FCM service
      final fcmInitialized = await FCMServiceSimple.initialize();
      if (!fcmInitialized) {
        debugPrint('⚠️ FCM initialization failed, but app will continue');
      } else {
        debugPrint('✅ FCM initialized successfully');
      }
    } catch (e) {
      debugPrint('❌ Error initializing FCM: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<AuthService>(
          create: (_) => AuthService(),
        ),
        ChangeNotifierProvider<UserService>(
          create: (context) => UserService(),
          lazy: false, // Initialize immediately
        ),
      ],
      child: MaterialApp(
      navigatorKey: NavigatorKey.key, // CRITICAL: Global navigation key for FCM
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: AppConstants.primaryColor,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppConstants.primaryColor,
          primary: AppConstants.primaryColor,
          secondary: AppConstants.accentColor,
          onPrimary: AppConstants.darkColor, // Ensuring text is visible on light backgrounds
          onSecondary: AppConstants.darkColor,
        ),
        scaffoldBackgroundColor: AppConstants.lightColor,
        appBarTheme: AppBarTheme(
          backgroundColor: AppConstants.primaryColor,
          foregroundColor: AppConstants.charcoalColor, // Charcoal text for consistency
          elevation: 0,
          shape: Border(
            bottom: BorderSide(
              color: AppConstants.borderColor.withOpacity(0.5),
              width: 1.0,
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: AppConstants.borderColor, width: 1.0),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: AppConstants.borderColor, width: 1.0),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: AppConstants.primaryColor, width: 1.5),
          ),
          filled: true,
          fillColor: Colors.white,
          labelStyle: TextStyle(color: AppConstants.charcoalColor),
          hintStyle: TextStyle(color: AppConstants.charcoalColor.withOpacity(0.7)),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppConstants.primaryColor,
            foregroundColor: AppConstants.charcoalColor, // Charcoal text for consistency
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
              side: BorderSide(color: AppConstants.borderColor, width: 1.0),
            ),
            padding: const EdgeInsets.symmetric(vertical: 16),
            elevation: 0, // Flat design with borders instead of elevation
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppConstants.charcoalColor, // Charcoal text for consistency
            side: BorderSide(color: AppConstants.borderColor, width: 1.0),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: AppConstants.charcoalColor, // Charcoal text for consistency
          ),
        ),
        // Note: We'll handle card styling directly in widgets instead of using cardTheme
        // due to compatibility issues with the current Flutter version
        // Container theme (via BoxDecoration in code)
        // Text theme to ensure all text is charcoal color
        textTheme: TextTheme(
          displayLarge: TextStyle(color: AppConstants.charcoalColor),
          displayMedium: TextStyle(color: AppConstants.charcoalColor),
          displaySmall: TextStyle(color: AppConstants.charcoalColor),
          headlineLarge: TextStyle(color: AppConstants.charcoalColor),
          headlineMedium: TextStyle(color: AppConstants.charcoalColor),
          headlineSmall: TextStyle(color: AppConstants.charcoalColor),
          titleLarge: TextStyle(color: AppConstants.charcoalColor),
          titleMedium: TextStyle(color: AppConstants.charcoalColor),
          titleSmall: TextStyle(color: AppConstants.charcoalColor),
          bodyLarge: TextStyle(color: AppConstants.charcoalColor),
          bodyMedium: TextStyle(color: AppConstants.charcoalColor),
          bodySmall: TextStyle(color: AppConstants.charcoalColor),
          labelLarge: TextStyle(color: AppConstants.charcoalColor),
          labelMedium: TextStyle(color: AppConstants.charcoalColor),
          labelSmall: TextStyle(color: AppConstants.charcoalColor),
        ),
      ),
      home: const SplashScreen(),
      routes: {
        NotificationSettingsScreen.routeName: (context) => const NotificationSettingsScreen(),
        SettingsScreen.routeName: (context) => const SettingsScreen(),
        NotificationTestScreen.routeName: (context) => const NotificationTestScreen(),
      },
    ),
    );
  }
}
