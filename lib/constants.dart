import 'package:flutter/material.dart';

/// App-wide constants including colors, text styles, and string resources
class AppConstants {
  // Colors
  static const Color primaryColor = Color(0xFF3D5A80);
  static const Color accentColor = Color(0xFF98C1D9);
  static const Color lightColor = Color(0xFFE0FBFC);
  static const Color darkColor = Color(0xFF293241);
  static const Color errorColor = Color(0xFFEE6C4D);
  
  // Text Styles
  static const TextStyle headingStyle = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: darkColor,
  );
  
  static const TextStyle subheadingStyle = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w500,
    color: darkColor,
  );
  
  static const TextStyle bodyStyle = TextStyle(
    fontSize: 16,
    color: darkColor,
  );
  
  static const TextStyle buttonTextStyle = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  );
  
  // String Resources
  static const String appName = 'Ottr';
  static const String appTagline = 'One-to-One Exclusive Messenger';
  
  // Auth Strings
  static const String emailHint = 'Email';
  static const String passwordHint = 'Password';
  static const String loginButton = 'Login';
  static const String registerButton = 'Register';
  static const String noAccountText = "Don't have an account? ";
  static const String haveAccountText = 'Already have an account? ';
  
  // Username Strings
  static const String usernameSetupTitle = 'Choose Your Username';
  static const String usernameHint = 'Username (3-20 characters)';
  static const String usernameSubmitButton = 'Continue';
  static const String usernameAvailable = 'Username available!';
  static const String usernameTaken = 'Username already taken';
  
  // Connection Strings
  static const String connectTitle = 'Connect with Someone';
  static const String connectHint = 'Enter their username';
  static const String connectButton = 'Send Connection Request';
  static const String disconnectButton = 'Disconnect';
  static const String pendingStatus = 'Connection request pending...';
  static const String connectedStatus = 'Connected with ';
  
  // Chat Strings
  static const String messageHint = 'Type a message...';
  static const String sendButton = 'Send';
  
  // Error Messages
  static const String userNotFound = 'Username not found - check spelling';
  static const String userUnavailable = 'User is currently connected to someone else';
  static const String requestSent = 'Connection request sent! Waiting for response...';
  static const String alreadyConnected = "You're already connected to someone. Disconnect first.";
  static const String networkError = 'Please check your internet connection';
}
