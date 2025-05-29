# Username Persistence Bug Fix Guide

## 🐛 Problem Description
After signing out and signing back in, the app forgets the username and may redirect users to the username setup screen instead of the main app. This creates a poor user experience and breaks the app's core functionality.

## 🔍 Root Cause Analysis
The issue occurs because:
1. The authentication flow doesn't properly retrieve and cache the user's profile data from Firestore after successful login
2. UserService may not be properly initialized or listening to auth state changes
3. Navigation logic may not be checking user profile completeness correctly
4. State management between AuthService and UserService is not synchronized

## 🛠️ Solution Implementation

### Step 1: Enhance AuthService (`services/auth_service.dart`)

```dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // Get current user
  User? get currentUser => _auth.currentUser;
  
  // Auth state stream
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Add this method to fetch user profile after login
  Future<UserModel?> getCurrentUserProfile() async {
    try {
      final user = _auth.currentUser;
      if (user == null) {
        print('No authenticated user found');
        return null;
      }

      print('Fetching user profile for UID: ${user.uid}');
      final doc = await _firestore
          .collection('users')
          .doc(user.uid)
          .get();

      if (doc.exists && doc.data() != null) {
        final userModel = UserModel.fromFirestore(doc);
        print('User profile loaded: ${userModel.username}');
        return userModel;
      } else {
        print('User document does not exist in Firestore');
        return null;
      }
    } catch (e) {
      print('Error fetching user profile: $e');
      return null;
    }
  }

  // Enhanced login method with profile fetching
  Future<UserModel?> signInWithEmailAndPassword(String email, String password) async {
    try {
      print('Attempting to sign in user: $email');
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      if (credential.user != null) {
        print('Authentication successful, fetching user profile...');
        // Small delay to ensure Firestore is ready
        await Future.delayed(Duration(milliseconds: 500));
        
        // Fetch and return user profile
        final userProfile = await getCurrentUserProfile();
        if (userProfile != null) {
          print('Login completed successfully with profile');
          return userProfile;
        } else {
          print('Warning: User authenticated but profile not found');
          // Return minimal user data for new users
          return UserModel(
            uid: credential.user!.uid,
            email: email,
            username: '', // Empty username indicates setup needed
            connectionStatus: 'none',
            createdAt: DateTime.now(),
          );
        }
      }
      return null;
    } on FirebaseAuthException catch (e) {
      print('Firebase Auth Error: ${e.code} - ${e.message}');
      throw e;
    } catch (e) {
      print('Unexpected error during sign in: $e');
      rethrow;
    }
  }

  // Enhanced register method
  Future<UserModel?> createUserWithEmailAndPassword(String email, String password) async {
    try {
      print('Creating new user account: $email');
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user != null) {
        print('User created, setting up Firestore document...');
        
        // Create user document in Firestore
        final userData = {
          'email': email,
          'username': '', // Empty initially, to be set later
          'createdAt': FieldValue.serverTimestamp(),
          'connectionStatus': 'none',
          'connectedTo': null,
          'fcmToken': null, // Will be set when FCM is initialized
        };

        await _firestore
            .collection('users')
            .doc(credential.user!.uid)
            .set(userData);

        print('Firestore document created successfully');

        // Return user model with empty username (indicates setup needed)
        return UserModel(
          uid: credential.user!.uid,
          email: email,
          username: '', // Will trigger username setup flow
          connectionStatus: 'none',
          createdAt: DateTime.now(),
        );
      }
      return null;
    } on FirebaseAuthException catch (e) {
      print('Firebase Auth Error during registration: ${e.code} - ${e.message}');
      throw e;
    } catch (e) {
      print('Unexpected error during registration: $e');
      rethrow;
    }
  }

  // Sign out method
  Future<void> signOut() async {
    try {
      print('Signing out user...');
      await _auth.signOut();
      print('Sign out successful');
    } catch (e) {
      print('Error during sign out: $e');
      rethrow;
    }
  }

  // Password reset
  Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } catch (e) {
      print('Error sending password reset email: $e');
      rethrow;
    }
  }

  // Check if user has completed profile setup
  Future<bool> hasCompletedProfile() async {
    try {
      final userProfile = await getCurrentUserProfile();
      return userProfile != null && userProfile.username.isNotEmpty;
    } catch (e) {
      print('Error checking profile completion: $e');
      return false;
    }
  }
}
```

### Step 2: Enhanced UserService (`services/user_service.dart`)

```dart
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';

class UserService extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  UserModel? _currentUser;
  bool _isLoading = false;
  String? _error;
  StreamSubscription<DocumentSnapshot>? _userSubscription;

  // Getters
  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasUsername => _currentUser?.username?.isNotEmpty ?? false;
  bool get isLoggedIn => _auth.currentUser != null && _currentUser != null;

  // Initialize user service and set up listeners
  Future<void> initialize() async {
    print('Initializing UserService...');
    
    final user = _auth.currentUser;
    if (user != null) {
      await loadUserProfile(user.uid);
      _setupUserListener(user.uid);
    }
    
    // Listen to auth state changes
    _auth.authStateChanges().listen((User? user) async {
      if (user != null) {
        print('Auth state changed: User logged in (${user.uid})');
        await loadUserProfile(user.uid);
        _setupUserListener(user.uid);
      } else {
        print('Auth state changed: User logged out');
        _clearUserData();
      }
    });
  }

  // Load user profile from Firestore
  Future<void> loadUserProfile([String? userId]) async {
    final uid = userId ?? _auth.currentUser?.uid;
    if (uid == null) {
      print('Cannot load profile: No user ID provided');
      return;
    }

    _setLoading(true);
    _clearError();

    try {
      print('Loading user profile for UID: $uid');
      final doc = await _firestore
          .collection('users')
          .doc(uid)
          .get();

      if (doc.exists && doc.data() != null) {
        _currentUser = UserModel.fromFirestore(doc);
        print('User profile loaded successfully: ${_currentUser!.username}');
      } else {
        print('User document not found, creating minimal profile...');
        // Create minimal profile for authenticated user without Firestore doc
        _currentUser = UserModel(
          uid: uid,
          email: _auth.currentUser?.email ?? '',
          username: '',
          connectionStatus: 'none',
          createdAt: DateTime.now(),
        );
      }
    } catch (e) {
      print('Error loading user profile: $e');
      _setError('Failed to load user profile: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Set up real-time listener for user document
  void _setupUserListener(String userId) {
    _userSubscription?.cancel();
    
    _userSubscription = _firestore
        .collection('users')
        .doc(userId)
        .snapshots()
        .listen(
      (DocumentSnapshot doc) {
        if (doc.exists && doc.data() != null) {
          print('User document updated via listener');
          _currentUser = UserModel.fromFirestore(doc);
          notifyListeners();
        }
      },
      onError: (error) {
        print('Error in user document listener: $error');
        _setError('Connection error: ${error.toString()}');
      }
    );
  }

  // Update username and refresh profile
  Future<bool> updateUsername(String username) async {
    if (_auth.currentUser == null) {
      print('Cannot update username: No authenticated user');
      return false;
    }

    _setLoading(true);
    _clearError();

    try {
      print('Updating username to: $username');
      
      // Check if username is already taken
      final existingUserQuery = await _firestore
          .collection('users')
          .where('username', isEqualTo: username)
          .limit(1)
          .get();

      if (existingUserQuery.docs.isNotEmpty && 
          existingUserQuery.docs.first.id != _auth.currentUser!.uid) {
        _setError('Username is already taken');
        return false;
      }

      // Update username in Firestore
      await _firestore
          .collection('users')
          .doc(_auth.currentUser!.uid)
          .update({
            'username': username,
            'updatedAt': FieldValue.serverTimestamp(),
          });

      // Update local user object
      if (_currentUser != null) {
        _currentUser = UserModel(
          uid: _currentUser!.uid,
          email: _currentUser!.email,
          username: username,
          connectedTo: _currentUser!.connectedTo,
          connectionStatus: _currentUser!.connectionStatus,
          createdAt: _currentUser!.createdAt,
          fcmToken: _currentUser!.fcmToken,
        );
      }

      print('Username updated successfully');
      return true;
    } catch (e) {
      print('Error updating username: $e');
      _setError('Failed to update username: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update connection status
  Future<bool> updateConnectionStatus(String status, {String? connectedUserId}) async {
    if (_auth.currentUser == null) return false;

    try {
      final updateData = {
        'connectionStatus': status,
        'updatedAt': FieldValue.serverTimestamp(),
      };

      if (connectedUserId != null) {
        updateData['connectedTo'] = connectedUserId;
      } else if (status == 'none') {
        updateData['connectedTo'] = null;
      }

      await _firestore
          .collection('users')
          .doc(_auth.currentUser!.uid)
          .update(updateData);

      return true;
    } catch (e) {
      print('Error updating connection status: $e');
      _setError('Failed to update connection status');
      return false;
    }
  }

  // Get user by username
  Future<UserModel?> getUserByUsername(String username) async {
    try {
      final query = await _firestore
          .collection('users')
          .where('username', isEqualTo: username)
          .limit(1)
          .get();

      if (query.docs.isNotEmpty) {
        return UserModel.fromFirestore(query.docs.first);
      }
      return null;
    } catch (e) {
      print('Error getting user by username: $e');
      return null;
    }
  }

  // Helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  void _clearUserData() {
    _userSubscription?.cancel();
    _currentUser = null;
    _isLoading = false;
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _userSubscription?.cancel();
    super.dispose();
  }
}
```

### Step 3: Enhanced SplashScreen (`screens/splash_screen.dart`)

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/user_service.dart';
import 'auth/login_screen.dart';
import 'auth/username_setup_screen.dart';
import 'main_screen.dart';

class SplashScreen extends StatefulWidget {
  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    try {
      print('Initializing app...');
      
      // Initialize UserService
      final userService = Provider.of<UserService>(context, listen: false);
      await userService.initialize();
      
      // Small delay for splash screen effect
      await Future.delayed(Duration(milliseconds: 2000));
      
      // Navigate based on authentication and profile status
      await _navigateToAppropriateScreen();
      
    } catch (e) {
      print('Error during app initialization: $e');
      // Show error dialog or navigate to login
      _navigateToLogin();
    }
  }

  Future<void> _navigateToAppropriateScreen() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    final userService = Provider.of<UserService>(context, listen: false);
    
    try {
      // Check if user is authenticated
      if (authService.currentUser == null) {
        print('No authenticated user, navigating to login');
        _navigateToLogin();
        return;
      }

      print('User is authenticated, checking profile completeness...');
      
      // Check if user profile is loaded and complete
      if (userService.currentUser == null) {
        print('User profile not loaded, loading now...');
        await userService.loadUserProfile();
      }

      // Wait a moment for UserService to be ready
      await Future.delayed(Duration(milliseconds: 500));

      if (userService.currentUser == null) {
        print('Failed to load user profile, navigating to login');
        _navigateToLogin();
      } else if (!userService.hasUsername) {
        print('User exists but no username, navigating to username setup');
        _navigateToUsernameSetup();
      } else {
        print('User profile complete, navigating to main app');
        _navigateToMain();
      }
      
    } catch (e) {
      print('Error checking user status: $e');
      _navigateToLogin();
    }
  }

  void _navigateToLogin() {
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => LoginScreen()),
      );
    }
  }

  void _navigateToUsernameSetup() {
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => UsernameSetupScreen()),
      );
    }
  }

  void _navigateToMain() {
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => MainScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.blue,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // App logo or icon
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                Icons.chat,
                size: 50,
                color: Colors.blue,
              ),
            ),
            SizedBox(height: 20),
            Text(
              'Ottr',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            SizedBox(height: 20),
            // Loading indicator
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}
```

### Step 4: Enhanced UserModel (`models/user_model.dart`)

```dart
import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String email;
  final String username;
  final String? connectedTo;
  final String connectionStatus;
  final DateTime createdAt;
  final String? fcmToken;
  final DateTime? updatedAt;

  UserModel({
    required this.uid,
    required this.email,
    required this.username,
    this.connectedTo,
    required this.connectionStatus,
    required this.createdAt,
    this.fcmToken,
    this.updatedAt,
  });

  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return UserModel(
      uid: doc.id,
      email: data['email'] ?? '',
      username: data['username'] ?? '',
      connectedTo: data['connectedTo'],
      connectionStatus: data['connectionStatus'] ?? 'none',
      createdAt: data['createdAt'] != null 
          ? (data['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      fcmToken: data['fcmToken'],
      updatedAt: data['updatedAt'] != null
          ? (data['updatedAt'] as Timestamp).toDate()
          : null,
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
      'updatedAt': updatedAt != null ? Timestamp.fromDate(updatedAt!) : null,
    };
  }

  // Helper methods
  bool get hasUsername => username.isNotEmpty;
  bool get isConnected => connectionStatus == 'connected';
  bool get hasPendingConnection => connectionStatus == 'pending';

  // Create copy with updated fields
  UserModel copyWith({
    String? email,
    String? username,
    String? connectedTo,
    String? connectionStatus,
    String? fcmToken,
    DateTime? updatedAt,
  }) {
    return UserModel(
      uid: this.uid,
      email: email ?? this.email,
      username: username ?? this.username,
      connectedTo: connectedTo ?? this.connectedTo,
      connectionStatus: connectionStatus ?? this.connectionStatus,
      createdAt: this.createdAt,
      fcmToken: fcmToken ?? this.fcmToken,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() {
    return 'UserModel(uid: $uid, email: $email, username: $username, connectionStatus: $connectionStatus)';
  }
}
```

### Step 5: Update main.dart

```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';
import 'services/auth_service.dart';
import 'services/user_service.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<AuthService>(
          create: (_) => AuthService(),
        ),
        ChangeNotifierProvider<UserService>(
          create: (_) => UserService(),
        ),
      ],
      child: MaterialApp(
        title: 'Ottr',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.blue,
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        home: SplashScreen(),
      ),
    );
  }
}
```

## 🧪 Testing Steps

### 1. Test Authentication Flow
```dart
// Add this test method to your test file
void testAuthenticationFlow() async {
  // Test 1: Login with existing user
  final authService = AuthService();
  final userService = UserService();
  
  // Login
  final user = await authService.signInWithEmailAndPassword('test@example.com', 'password');
  assert(user != null, 'Login should succeed');
  
  // Check if profile is loaded
  await userService.initialize();
  assert(userService.currentUser != null, 'User profile should be loaded');
  assert(userService.hasUsername, 'Username should be available');
}
```

### 2. Manual Testing Checklist
- [ ] Sign up new user → Username setup screen appears
- [ ] Complete username setup → Navigate to main app
- [ ] Sign out → Navigate to login screen
- [ ] Sign in again → Should go directly to main app (not username setup)
- [ ] Force close app after login → Restart should maintain login state
- [ ] Test with poor network connection
- [ ] Test offline behavior

## 🚨 Important Notes

1. **Provider Package**: Ensure you have `provider: ^6.1.1` in pubspec.yaml
2. **Error Handling**: All methods now include comprehensive error handling
3. **Logging**: Added detailed logging for debugging
4. **State Management**: UserService now properly manages state with ChangeNotifier
5. **Real-time Updates**: User document changes are now reflected in real-time
6. **Memory Management**: Proper cleanup of listeners in dispose methods

## 🐛 Debugging Tips

If the issue persists:

1. **Check Firebase Console**: Verify user documents exist in Firestore
2. **Enable Debug Logging**: Add this to main() before Firebase initialization:
   ```dart
   FirebaseFirestore.instance.settings = Settings(persistenceEnabled: true);
   ```
3. **Test Network Connectivity**: Ensure device has internet connection
4. **Clear App Data**: Uninstall and reinstall app to test fresh state
5. **Check Firestore Rules**: Ensure users can read their own documents

This enhanced implementation should completely resolve the username persistence bug with robust error handling and proper state management.