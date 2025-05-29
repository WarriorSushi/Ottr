# Firebase Cloud Messaging (FCM) Testing Guide for Ottr

## Overview

This guide provides step-by-step instructions for testing the FCM notification implementation in the Ottr app. Follow these procedures to verify that notifications are working correctly in different app states.

## Prerequisites

- Two devices or emulators with the Ottr app installed
- Firebase project properly configured
- FCM implementation completed as per the FCM_NOTIFICATIONS_GUIDE.md

## Test Environment Setup

1. **Device Setup**:
   - Device A: Primary test device (sender)
   - Device B: Secondary test device (receiver)

2. **User Accounts**:
   - Create two test user accounts
   - User A on Device A
   - User B on Device B

## Testing Procedures

### 1. Basic FCM Token Generation

**Objective**: Verify that FCM tokens are generated and stored correctly.

**Steps**:
1. Install the app on both devices
2. Register/login with test accounts on both devices
3. Navigate to Settings > Notification Test (in debug mode)
4. Verify that FCM token information is displayed
5. Check Firestore to confirm tokens are stored in user documents

**Expected Results**:
- Both devices should display valid FCM tokens
- Tokens should be stored in Firestore user documents
- Token timestamps should be recent

### 2. Notification Permission Handling

**Objective**: Verify that notification permissions are properly requested and handled.

**Steps**:
1. On Device B, navigate to Settings > Notification Test
2. Tap "Check Permissions" button
3. Verify permission status
4. If permissions are denied, test the app's behavior when trying to send notifications

**Expected Results**:
- Permission status should be displayed correctly
- If permissions are granted, status should show "authorized"
- If permissions are denied, app should handle this gracefully

### 3. Local Notification Testing

**Objective**: Verify that local notifications can be displayed correctly.

**Steps**:
1. On Device B, navigate to Settings > Notification Test
2. Enter test notification details
3. Select different notification types (message, connection, system)
4. Tap "Send Test Notification" button

**Expected Results**:
- Local notifications should appear with correct title and body
- Different notification types should use appropriate channels on Android
- Tapping the notification should navigate to the appropriate screen

### 4. Foreground Notification Testing

**Objective**: Verify that notifications are handled correctly when the app is in the foreground.

**Steps**:
1. Keep Device B in the foreground (app open and visible)
2. From Device A, send a message or connection request to User B
3. Observe notification behavior on Device B

**Expected Results**:
- In-app notification should be displayed
- Notification should contain correct sender and message information
- App should update UI to reflect the new message/request

### 5. Background Notification Testing

**Objective**: Verify that notifications are handled correctly when the app is in the background.

**Steps**:
1. Put Device B in the background (app running but not visible)
2. From Device A, send a message or connection request to User B
3. Observe notification behavior on Device B

**Expected Results**:
- System notification should appear in the notification tray
- Notification should contain correct sender and message information
- Tapping the notification should open the app to the relevant screen

### 6. Terminated App Notification Testing

**Objective**: Verify that notifications are handled correctly when the app is completely closed.

**Steps**:
1. Completely close the app on Device B (force stop or swipe from recents)
2. From Device A, send a message or connection request to User B
3. Observe notification behavior on Device B

**Expected Results**:
- System notification should appear in the notification tray
- Notification should contain correct sender and message information
- Tapping the notification should launch the app and navigate to the relevant screen

### 7. Notification Preference Testing

**Objective**: Verify that notification preferences are respected.

**Steps**:
1. On Device B, navigate to Settings > Notification Settings
2. Disable notifications for specific types (e.g., messages)
3. From Device A, send notifications of different types to User B
4. Re-enable notifications and test again

**Expected Results**:
- When preferences are disabled, notifications of that type should not appear
- When preferences are enabled, notifications should appear normally
- Global notification toggle should override individual type settings

### 8. Token Refresh Testing

**Objective**: Verify that FCM tokens are refreshed correctly.

**Steps**:
1. On Device B, navigate to Settings > Notification Test
2. Note the current FCM token
3. Tap "Update FCM Token" button
4. Verify that token information is updated

**Expected Results**:
- FCM token should be refreshed
- New token should be stored in Firestore
- Token timestamp should be updated

### 9. Multiple Device Testing

**Objective**: Verify that notifications work correctly across multiple devices for the same user.

**Steps**:
1. Login with User B on a third device (Device C)
2. From Device A, send a message or connection request to User B
3. Observe notification behavior on both Device B and Device C

**Expected Results**:
- Notifications should appear on all devices where User B is logged in
- Reading/responding on one device should update state across all devices

### 10. Edge Case Testing

**Objective**: Verify that the notification system handles edge cases correctly.

**Test Cases**:
1. **Network Changes**: Test notifications when switching between WiFi and cellular data
2. **App Updates**: Test notifications after updating the app
3. **Long Messages**: Test notifications with very long message content
4. **Rapid Notifications**: Test sending multiple notifications in quick succession
5. **Device Restart**: Test notifications after device restart

**Expected Results**:
- Notifications should be delivered reliably in all scenarios
- App should handle edge cases gracefully without crashing

## Troubleshooting

### Common Issues and Solutions

1. **Notifications not appearing**:
   - Check notification permissions in device settings
   - Verify FCM token is valid and up-to-date
   - Check that notification channels are created correctly on Android

2. **Token not updating**:
   - Check network connectivity
   - Verify Firebase configuration
   - Check for any errors in the FCM service logs

3. **Background notifications not working**:
   - Ensure background handler is properly registered
   - Check for battery optimization settings that might be blocking notifications
   - Verify that the app manifest has proper permissions

4. **Notification taps not navigating correctly**:
   - Check the notification payload format
   - Verify that the navigation logic in `_handleNotificationNavigation` is correct
   - Ensure the global navigator key is properly set up

### Debugging Tools

1. **Firebase Console**: Use the Firebase Console to send test messages directly
2. **FCM Debug Logs**: Enable debug logging in the FCM service
3. **Notification Test Screen**: Use the built-in test screen to diagnose issues
4. **Device Logs**: Check device logs for any FCM-related errors

## Conclusion

By following this testing guide, you should be able to verify that the FCM notification system in the Ottr app is working correctly. If you encounter any issues, refer to the troubleshooting section or consult the FCM documentation for further assistance.
