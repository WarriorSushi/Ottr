# Firebase Cloud Messaging (FCM) Notifications Guide for Ottr

## Overview

This guide explains how Firebase Cloud Messaging (FCM) notifications are implemented in the Ottr app. FCM allows the app to receive and display notifications when the app is in the foreground, background, or completely closed.

## Features

- **Real-time notifications** for new messages, connection requests, and system updates
- **Customizable notification preferences** for different notification types
- **Background notification handling** even when the app is closed
- **Automatic token management** to ensure reliable notification delivery

## Implementation Details

### Core Components

1. **FCM Service** (`lib/services/fcm_service.dart`)
   - Manages FCM token generation and updates
   - Handles foreground message display
   - Creates and manages notification channels
   - Provides methods for sending notifications

2. **Background Message Handler** (`lib/services/background_message_handler.dart`)
   - Processes notifications when the app is completely closed
   - Ensures critical notifications are still displayed

3. **User Model** (`lib/models/user_model.dart`)
   - Stores FCM token and notification preferences
   - Tracks when tokens were last updated
   - Provides platform information for device-specific notifications

4. **Notification Settings Screen** (`lib/screens/notification_settings_screen.dart`)
   - Allows users to customize notification preferences
   - Provides toggles for different notification types

### Notification Types

Ottr supports the following notification types:

1. **Messages**: Notifications for new chat messages
2. **Connections**: Notifications for connection requests and updates
3. **System**: Important system notifications and updates

### User Flow

1. When a user registers or logs in, their FCM token is automatically generated and stored in Firestore
2. Users can manage their notification preferences through the Settings > Notification Settings screen
3. When events occur (new messages, connection requests, etc.), notifications are sent to relevant users
4. Notifications are displayed based on the user's preferences and app state

## Technical Implementation

### Token Management

FCM tokens are managed in the following ways:

- Generated during app initialization
- Updated when the token changes or expires
- Stored in the user's Firestore document
- Validated based on timestamp to ensure freshness

### Notification Channels (Android)

On Android, the app creates the following notification channels:

- **Messages**: For chat message notifications
- **Connections**: For connection request notifications
- **System**: For system notifications

### Handling Notification Taps

When a user taps on a notification:

1. The app opens if it was closed
2. The app navigates to the relevant screen based on the notification type
3. For message notifications, the app opens the chat with the sender
4. For connection notifications, the app opens the connect screen

## Testing Notifications

To test FCM notifications:

1. Ensure two users are registered in the app
2. Send a message or connection request from one user to another
3. Verify that the notification is received when the app is in different states:
   - Foreground: Notification should appear as an in-app alert
   - Background: Notification should appear in the system tray
   - Closed: Notification should still appear in the system tray

## Troubleshooting

- **Notifications not appearing**: Check notification permissions in device settings
- **Token not updating**: Check the FCM service logs for errors
- **Background notifications not working**: Ensure the background handler is properly registered

## Security Considerations

- FCM tokens should be treated as sensitive information
- Tokens are only stored in the user's Firestore document
- Notifications should not contain sensitive content in the payload
- Use Firebase Security Rules to protect token data

## Future Improvements

- Implement rich notifications with images
- Add support for notification actions (reply, accept, etc.)
- Implement notification grouping for multiple messages
- Add support for silent notifications for data synchronization
