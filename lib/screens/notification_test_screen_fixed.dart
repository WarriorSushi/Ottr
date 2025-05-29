import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/user_service.dart';
import '../services/fcm_service_simple.dart';
import '../widgets/app_bar.dart';

/// A utility screen for testing FCM notifications - simplified version
class NotificationTestScreen extends StatefulWidget {
  static const String routeName = '/notification-test';

  const NotificationTestScreen({Key? key}) : super(key: key);

  @override
  _NotificationTestScreenState createState() => _NotificationTestScreenState();
}

class _NotificationTestScreenState extends State<NotificationTestScreen> {
  bool _isLoading = false;
  String _statusMessage = '';

  @override
  void dispose() {
    super.dispose();
  }

  // Update FCM token
  Future<void> _updateFCMToken() async {
    setState(() {
      _isLoading = true;
      _statusMessage = '';
    });

    try {
      // Call the simplified FCM service
      final success = await FCMServiceSimple.updateUserToken();

      setState(() {
        _statusMessage = success 
            ? 'FCM token updated successfully!'
            : 'Failed to update FCM token';
      });
    } catch (e) {
      setState(() {
        _statusMessage = 'Error: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  // Check permission status
  Future<void> _checkPermissionStatus() async {
    setState(() {
      _isLoading = true;
      _statusMessage = '';
    });

    try {
      final status = await FCMServiceSimple.checkPermissionStatus();
      setState(() {
        _statusMessage = 'Permission status: $status';
      });
    } catch (e) {
      setState(() {
        _statusMessage = 'Error: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  // Get token info from user profile
  Future<void> _getTokenInfo() async {
    setState(() {
      _isLoading = true;
      _statusMessage = '';
    });

    try {
      final userService = Provider.of<UserService>(context, listen: false);
      final currentUser = userService.currentUser;
      
      if (currentUser != null && currentUser.fcmToken != null) {
        final token = currentUser.fcmToken!;
        final displayToken = token.length > 20 
            ? '${token.substring(0, 20)}...' 
            : token;
            
        setState(() {
          _statusMessage = 'Token: $displayToken\n\nLast updated: ${currentUser.fcmTokenUpdated?.toString() ?? 'Unknown'}';
        });
      } else {
        setState(() {
          _statusMessage = 'No FCM token available. Try updating the token first.';
        });
      }
    } catch (e) {
      setState(() {
        _statusMessage = 'Error: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final userService = Provider.of<UserService>(context);
    final currentUser = userService.currentUser;
    
    if (currentUser == null) {
      return const Scaffold(
        body: Center(child: Text('User not logged in')),
      );
    }
    
    return Scaffold(
      appBar: CustomAppBar(
        title: 'Notification Testing',
        showBackButton: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'FCM Token Information',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'User: ${currentUser.username}',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 8),
                    if (currentUser.fcmToken != null) ...[  
                      Text(
                        'Token: ${currentUser.fcmToken!.length > 20 ? currentUser.fcmToken!.substring(0, 20) + "..." : currentUser.fcmToken}',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      Text(
                        'Last Updated: ${currentUser.fcmTokenUpdated?.toString() ?? "Unknown"}',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      Text(
                        'Platform: ${currentUser.platform ?? "Unknown"}',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ] else
                      Text(
                        'No FCM token available',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'FCM Token Management',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _isLoading ? null : _updateFCMToken,
                      child: Text('Update FCM Token'),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: _isLoading ? null : _getTokenInfo,
                      child: Text('Get Token Info'),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: _isLoading ? null : _checkPermissionStatus,
                      child: Text('Check Permissions'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Status',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: _isLoading
                          ? const Center(child: CircularProgressIndicator())
                          : _statusMessage.isEmpty
                              ? const Text('No status to display')
                              : Text(_statusMessage),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Note: This simplified version only supports FCM token management. Local notifications are temporarily disabled due to compatibility issues.',
              style: Theme.of(context).textTheme.bodySmall!.copyWith(
                    fontStyle: FontStyle.italic,
                    color: Colors.grey[700],
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
