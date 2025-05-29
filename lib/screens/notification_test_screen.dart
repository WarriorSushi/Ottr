import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/user_service.dart';
import '../services/fcm_service.dart';
import '../widgets/app_bar.dart';

/// A utility screen for testing FCM notifications
class NotificationTestScreen extends StatefulWidget {
  static const String routeName = '/notification-test';

  const NotificationTestScreen({Key? key}) : super(key: key);

  @override
  _NotificationTestScreenState createState() => _NotificationTestScreenState();
}

class _NotificationTestScreenState extends State<NotificationTestScreen> {
  bool _isLoading = false;
  String _statusMessage = '';
  final _titleController = TextEditingController(text: 'Test Notification');
  final _bodyController = TextEditingController(text: 'This is a test notification');
  String _selectedType = 'messages';

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  Future<void> _testLocalNotification() async {
    setState(() {
      _isLoading = true;
      _statusMessage = '';
    });

    try {
      // Test local notification display
      await FCMService.showLocalNotification(
        title: _titleController.text,
        body: _bodyController.text,
        payload: '{"type": "$_selectedType", "data": {"test": true}}',
      );

      setState(() {
        _statusMessage = 'Local notification sent successfully!';
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

  Future<void> _updateFCMToken() async {
    setState(() {
      _isLoading = true;
      _statusMessage = '';
    });

    try {
      final success = await FCMService.updateUserToken();

      setState(() {
        if (success) {
          _statusMessage = 'FCM token updated successfully!';
        } else {
          _statusMessage = 'Failed to update FCM token.';
        }
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

  Future<void> _checkNotificationPermissions() async {
    setState(() {
      _isLoading = true;
      _statusMessage = '';
    });

    try {
      final status = await FCMService.checkNotificationPermissions();

      setState(() {
        _statusMessage = 'Notification permissions: $status';
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

  @override
  Widget build(BuildContext context) {
    final userService = Provider.of<UserService>(context);
    final user = userService.currentUser;

    if (user == null) {
      return const Scaffold(
        body: Center(child: Text('User not logged in')),
      );
    }

    return Scaffold(
      appBar: CustomAppBar(
        title: 'Notification Test',
        showBackButton: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // User FCM info
                  Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'FCM Token Information',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          Text('Token: ${user.fcmToken?.substring(0, 15) ?? 'None'}...'),
                          Text('Last Updated: ${user.fcmTokenUpdated?.toString() ?? 'Never'}'),
                          Text('Platform: ${user.platform ?? 'Unknown'}'),
                          Text('Notifications Enabled: ${user.notificationsEnabled ? 'Yes' : 'No'}'),
                          const SizedBox(height: 8),
                          const Text('Notification Preferences:'),
                          ...user.notificationPreferences.entries.map(
                            (entry) => Padding(
                              padding: const EdgeInsets.only(left: 16.0),
                              child: Text('${entry.key}: ${entry.value ? 'Enabled' : 'Disabled'}'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Test notification section
                  const Text(
                    'Test Local Notification',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _titleController,
                    decoration: const InputDecoration(
                      labelText: 'Notification Title',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _bodyController,
                    decoration: const InputDecoration(
                      labelText: 'Notification Body',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _selectedType,
                    decoration: const InputDecoration(
                      labelText: 'Notification Type',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'messages', child: Text('Message')),
                      DropdownMenuItem(value: 'connections', child: Text('Connection')),
                      DropdownMenuItem(value: 'system', child: Text('System')),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _selectedType = value;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _testLocalNotification,
                    icon: const Icon(Icons.notifications_active),
                    label: const Text('Send Test Notification'),
                  ),
                  const SizedBox(height: 24),

                  // Token management
                  const Text(
                    'FCM Token Management',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _updateFCMToken,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Update FCM Token'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _checkNotificationPermissions,
                          icon: const Icon(Icons.security),
                          label: const Text('Check Permissions'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Status message
                  if (_statusMessage.isNotEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _statusMessage.contains('Error')
                            ? Colors.red.shade100
                            : Colors.green.shade100,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: _statusMessage.contains('Error')
                              ? Colors.red
                              : Colors.green,
                        ),
                      ),
                      child: Text(
                        _statusMessage,
                        style: TextStyle(
                          color: _statusMessage.contains('Error')
                              ? Colors.red.shade900
                              : Colors.green.shade900,
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}
