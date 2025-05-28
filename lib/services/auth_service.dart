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

  // Sign in with email and password
  Future<UserCredential> signInWithEmailAndPassword(
      String email, String password) async {
    try {
      UserCredential result = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      return result;
    } catch (e) {
      rethrow;
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      return await _auth.signOut();
    } catch (e) {
      rethrow;
    }
  }
}
