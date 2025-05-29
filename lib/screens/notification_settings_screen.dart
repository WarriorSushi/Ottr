import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/user_service.dart';

import '../widgets/app_bar.dart';

class NotificationSettingsScreen extends StatefulWidget {
  static const String routeName = '/notification-settings';

  const NotificationSettingsScreen({Key? key}) : super(key: key);

  @override
  _NotificationSettingsScreenState createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  bool _isLoading = false;
  late bool _notificationsEnabled;
  late Map<String, bool> _notificationPreferences;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  void _loadSettings() {
    final userService = Provider.of<UserService>(context, listen: false);
    final user = userService.currentUser;

    if (user != null) {
      setState(() {
        _notificationsEnabled = user.notificationsEnabled;
        _notificationPreferences = Map<String, bool>.from(user.notificationPreferences);
      });
    }
  }

  Future<void> _saveSettings() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final userService = Provider.of<UserService>(context, listen: false);
      final success = await userService.updateNotificationPreferences(
        enableNotifications: _notificationsEnabled,
        preferences: _notificationPreferences,
      );

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notification settings saved')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to save notification settings')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
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
        title: 'Notification Settings',
        showBackButton: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Master toggle for all notifications
                  SwitchListTile(
                    title: const Text('Enable All Notifications'),
                    subtitle: const Text(
                        'Turn on or off all notifications from Ottr'),
                    value: _notificationsEnabled,
                    onChanged: (value) {
                      setState(() {
                        _notificationsEnabled = value;
                      });
                    },
                  ),
                  const Divider(),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8.0),
                    child: Text(
                      'Notification Types',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  // Individual notification types
                  ..._buildNotificationTypeToggles(),
                  const SizedBox(height: 24),
                  // Save button
                  Center(
                    child: ElevatedButton(
                      onPressed: _saveSettings,
                      child: const Text('Save Settings'),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  List<Widget> _buildNotificationTypeToggles() {
    // Define notification types and their descriptions
    final notificationTypes = {
      'messages': 'Receive notifications for new messages',
      'connections': 'Receive notifications for connection requests and updates',
      'system': 'Receive important system notifications',
    };

    return notificationTypes.entries.map((entry) {
      final type = entry.key;
      final description = entry.value;

      // Initialize preference if it doesn't exist
      if (!_notificationPreferences.containsKey(type)) {
        _notificationPreferences[type] = true;
      }

      return SwitchListTile(
        title: Text(_getNotificationTypeName(type)),
        subtitle: Text(description),
        value: _notificationsEnabled && _notificationPreferences[type]!,
        onChanged: _notificationsEnabled
            ? (value) {
                setState(() {
                  _notificationPreferences[type] = value;
                });
              }
            : null,
      );
    }).toList();
  }

  String _getNotificationTypeName(String type) {
    switch (type) {
      case 'messages':
        return 'Messages';
      case 'connections':
        return 'Connection Updates';
      case 'system':
        return 'System Notifications';
      default:
        return type.substring(0, 1).toUpperCase() + type.substring(1);
    }
  }
}
