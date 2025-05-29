import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'constants.dart';
import 'firebase_options.dart';
import 'screens/splash_screen.dart';
import 'services/auth_service.dart';
import 'services/user_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const OttrApp());
}

class OttrApp extends StatelessWidget {
  const OttrApp({Key? key}) : super(key: key);

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
    ),
    );
  }
}
