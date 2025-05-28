import 'package:flutter/material.dart';

/// App-wide constants including colors, text styles, and string resources
class AppConstants {
  // Colors
  static const Color primaryColor = Color(0xFFB5EAD7); // Pastel Mint
  static const Color accentColor = Color(0xFFFFDAC1); // Pastel Peach
  static const Color lightColor = Color(0xFFFFF9F5); // Very Light Peach
  static const Color darkColor = Color(0xFF2D3436); // Dark Gray (kept for text)
  static const Color errorColor = Color(0xFFFF9AA2); // Pastel Red
  static const Color successColor = Color(0xFFC7CEEA); // Pastel Blue
  static const Color borderColor = Color(
    0xFFE2F0CB,
  ); // Light Pastel Green Border
  static const Color charcoalColor = Color(
    0xFF333333,
  ); // Charcoal for text on light backgrounds

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFFB5EAD7), Color(0xFFC7CEEA)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient backgroundGradient = LinearGradient(
    colors: [Color(0xFFFFF9F5), Color(0xFFFFDAC1), Color(0xFFB5EAD7)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    stops: [0.1, 0.5, 0.9],
  );

  static const LinearGradient buttonGradient = LinearGradient(
    colors: [Color(0xFFC7CEEA), Color(0xFFB5EAD7)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  // Shadows
  static BoxShadow defaultShadow = BoxShadow(
    color: accentColor.withOpacity(0.15),
    spreadRadius: 0,
    blurRadius: 4,
    offset: Offset(0, 2),
  );

  // Text Styles
  static const TextStyle headingStyle = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: darkColor,
    letterSpacing: 0.5,
  );

  static const TextStyle subheadingStyle = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w500, // Medium for subtle hierarchy
    color: charcoalColor,
  );

  static const TextStyle bodyStyle = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400, // Regular for body text
    color: charcoalColor,
  );

  static const TextStyle buttonTextStyle = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600, // Semi-bold for buttons
    color: charcoalColor,
  );

  static TextStyle taglineStyle = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400, // Regular for tagline
    color: charcoalColor,
    letterSpacing: 0.5,
    height: 1.5,
  );

  static TextStyle errorTextStyle = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500, // Medium for errors
    color: errorColor,
    height: 1.5,
  );

  // Button Styles
  static final ButtonStyle primaryButtonStyle = ElevatedButton.styleFrom(
    foregroundColor: darkColor,
    backgroundColor: Colors.transparent,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
    elevation: 0,
  );

  // Input Decoration
  static InputDecoration getInputDecoration(
    String label, {
    Widget? prefixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      prefixIcon: prefixIcon,
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: borderColor, width: 1.0),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryColor, width: 1.5),
      ),
      labelStyle: TextStyle(color: darkColor.withOpacity(0.7), fontSize: 14),
      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
    );
  }

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
  static const String cancelRequestButton = 'Cancel Request';
  static const String disconnectButton = 'Disconnect';
  static const String pendingStatus = 'Connection request pending...';
  static const String connectedStatus = 'Connected with ';

  // Chat Strings
  static const String messageHint = 'Type a message...';
  static const String sendButton = 'Send';

  // Error Messages
  static const String userNotFound = 'Username not found - check spelling';
  static const String userUnavailable =
      'User is currently connected to someone else';
  static const String requestSent =
      'Connection request sent! Waiting for response...';
  static const String requestCancelled = 'Connection request cancelled.';
  static const String alreadyConnected =
      "You're already connected to someone. Disconnect first.";
  static const String networkError = 'Please check your internet connection';

  // Animal Love Facts
  static const List<String> animalLoveFacts = [
    "Otters hold hands while sleeping to stay together.",
    "Penguins propose with pebbles.",
    "Elephants comfort upset family members by stroking them.",
    "Swans mate for life, symbolizing loyalty.",
    "Beavers raise young together and share family duties.",
    "Puffins gently rub beaks (\"billing\") to bond.",
    "Wolves protect and nurture their pack as family.",
    "Gibbons sing romantic duets to strengthen bonds.",
    "Albatrosses perform synchronized dances with lifelong partners.",
    "Foxes lovingly groom and play with their cubs.",
    "Prairie dogs greet family with tiny kisses.",
    "Dolphins stay close and care for injured pod members.",
    "Parrots bond for life, cuddling and grooming each other.",
    "Barn owls cuddle and groom regularly to reinforce affection.",
    "Lions nuzzle and rub heads to maintain pride bonds.",
    "Squirrels cuddle tightly together in cold weather.",
    "Manatees embrace gently to show affection.",
    "Meerkats babysit each other's pups as a community.",
    "Cows form strong bonds and have best friends.",
    "Emperor penguins share parenting equally",
  ];
}
