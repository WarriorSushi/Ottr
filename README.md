# OTTR - One-to-One Exclusive Messenger

Ottr is a minimal Android chat app for exclusive 1:1 messaging, built with Flutter and Firebase. Perfect for couples, dating app users, or anyone who wants focused, distraction-free communication.

## Features

- **One-to-One Exclusive Chat** – each user can connect with only one other user at a time.
- **Username-Based Connection** – connect by entering another user's username.
- **Real-time Messaging** – powered by Firebase Firestore.
- **Minimal & Clean UI** – no media, no distractions, just pure conversation.
- **Connection Requests** – send and accept connection requests seamlessly.

## Tech Stack

- **Flutter (Dart)** – frontend UI & logic
- **Firebase Auth** – secure email/password authentication
- **Firestore** – real-time database for user data & chat messages
- **Material Design** – clean, familiar Android UI patterns

## Project Structure

```
lib/
 ├── main.dart                 # App entry point
 ├── constants.dart            # Colors, styles, strings
 ├── firebase_options.dart     # Firebase configuration
 ├── screens/                  # UI screens
 │   ├── splash_screen.dart    # Initial loading screen
 │   ├── auth_screen.dart      # Login/register screen
 │   ├── username_screen.dart  # Username setup screen
 │   ├── connect_screen.dart   # Connection management screen
 │   └── chat_screen.dart      # Chat interface
 ├── models/                   # Data models
 │   ├── user_model.dart       # User data model
 │   └── message_model.dart    # Message data model
 ├── services/                 # Firebase services
 │   ├── auth_service.dart     # Authentication service
 │   ├── user_service.dart     # User management service
 │   └── chat_service.dart     # Chat functionality service
 └── widgets/                  # Reusable widgets
     ├── message_bubble.dart   # Chat message UI component
     └── custom_button.dart    # Styled button component
```

## Setup Instructions

### Prerequisites

- Flutter SDK (latest version)
- Firebase project setup
- Android Studio or VS Code with Flutter extensions

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Add an Android app to your Firebase project
3. Download the `google-services.json` file and place it in the `android/app` directory
4. Enable Email/Password authentication in the Firebase console
5. Create Firestore database in test mode

### Update Firebase Configuration

Replace the placeholder values in `lib/firebase_options.dart` with your actual Firebase project configuration.

### Running the App

```bash
# Get dependencies
flutter pub get

# Run the app
flutter run
```

## Testing

To fully test the app's functionality, you'll need to:

1. Create two user accounts on two different devices/emulators
2. Test the connection request flow between the accounts
3. Test real-time messaging between connected users
4. Test disconnecting and reconnecting with different users

## Future Enhancements

- QR code scanning for easier connections
- Push notifications
- Media sharing capabilities
- iOS version
- Profile customization

## License

This project is for educational purposes only.

