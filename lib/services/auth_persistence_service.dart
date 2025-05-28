import 'package:shared_preferences/shared_preferences.dart';

/// Service for handling authentication persistence between app sessions
class AuthPersistenceService {
  // Keys for SharedPreferences
  static const String _authTokenKey = 'auth_token';
  static const String _userIdKey = 'user_id';
  static const String _emailKey = 'email';
  
  // Save authentication data
  Future<void> saveAuthData({
    required String userId,
    required String email,
    String? authToken,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    
    await prefs.setString(_userIdKey, userId);
    await prefs.setString(_emailKey, email);
    
    if (authToken != null) {
      await prefs.setString(_authTokenKey, authToken);
    }
    
    print('Auth data saved to persistent storage: $userId');
  }
  
  // Get saved user ID
  Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userIdKey);
  }
  
  // Get saved email
  Future<String?> getEmail() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_emailKey);
  }
  
  // Get saved auth token
  Future<String?> getAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_authTokenKey);
  }
  
  // Clear all auth data (for logout)
  Future<void> clearAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    
    await prefs.remove(_userIdKey);
    await prefs.remove(_emailKey);
    await prefs.remove(_authTokenKey);
    
    print('Auth data cleared from persistent storage');
  }
  
  // Check if user is authenticated based on stored data
  Future<bool> isAuthenticated() async {
    final userId = await getUserId();
    return userId != null && userId.isNotEmpty;
  }
}
