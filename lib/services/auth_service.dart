import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';

/// Service for handling Firebase authentication
class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Get current user
  User? get currentUser => _auth.currentUser;

  // Auth state changes stream
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Get user data stream
  Stream<UserModel?> getUserStream(String uid) {
    return _firestore.collection('users').doc(uid).snapshots().map(
          (snapshot) => snapshot.exists
              ? UserModel.fromMap(snapshot.data()!, snapshot.id)
              : null,
        );
  }

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
        final userModel = UserModel.fromMap(doc.data()!, doc.id);
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

  // Register with email and password
  Future<User?> registerWithEmailAndPassword(
      String email, String password) async {
    try {
      print('Attempting to register user with email: $email');
      UserCredential result = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      print('Registration successful: ${result.user?.uid}');
      
      // Add a small delay to ensure Firebase Auth state is fully updated
      await Future.delayed(const Duration(milliseconds: 500));
      return result.user;
    } on FirebaseAuthException catch (e) {
      // Handle Firebase-specific errors
      print('FirebaseAuthException: ${e.code} - ${e.message}');
      throw e;
    } catch (e) {
      // Handle the PigeonUserDetails error specifically
      print('Registration error type: ${e.runtimeType}');
      print('Registration error message: ${e.toString()}');
      
      if (e.toString().contains('PigeonUserDetails') || 
          e.toString().contains('List<Object?>')) {
        // The user might have been created despite the error
        // Try to get the current user
        await Future.delayed(const Duration(milliseconds: 1000));
        User? user = _auth.currentUser;
        if (user != null) {
          print('Retrieved current user despite error: ${user.uid}');
          return user;
        }
      }
      throw e;
    }
  }

  // Create user document in Firestore
  Future<void> createUserDocument(
      String uid, String email, String username) async {
    try {
      await _firestore.collection('users').doc(uid).set({
        'email': email,
        'username': username,
        'connectedTo': null,
        'connectionStatus': 'none',
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      rethrow;
    }
  }

  // Check if username is available
  Future<bool> isUsernameAvailable(String username) async {
    try {
      final QuerySnapshot result = await _firestore
          .collection('users')
          .where('username', isEqualTo: username)
          .limit(1)
          .get();
      return result.docs.isEmpty;
    } catch (e) {
      rethrow;
    }
  }

  // Enhanced sign in with email and password with profile fetching
  Future<UserModel?> signInWithEmailAndPassword(
      String email, String password) async {
    try {
      print('Attempting to sign in user with email: $email');
      UserCredential result = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      if (result.user != null) {
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
            uid: result.user!.uid,
            email: email,
            username: '', // Empty username indicates setup needed
            connectionStatus: 'none',
            createdAt: DateTime.now(),
          );
        }
      }
      return null;
    } on FirebaseAuthException catch (e) {
      // Handle Firebase-specific errors
      print('FirebaseAuthException: ${e.code} - ${e.message}');
      throw e;
    } catch (e) {
      // Handle the PigeonUserDetails error specifically
      print('Sign in error type: ${e.runtimeType}');
      print('Sign in error message: ${e.toString()}');
      
      if (e.toString().contains('PigeonUserDetails') || 
          e.toString().contains('List<Object?>')) {
        // The user might have been authenticated despite the error
        // Try to get the current user
        await Future.delayed(const Duration(milliseconds: 1000));
        User? user = _auth.currentUser;
        if (user != null) {
          print('Retrieved current user despite error: ${user.uid}');
          // Try to get user profile
          return await getCurrentUserProfile();
        }
      }
      throw e;
    }
  }

  // Sign out
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
