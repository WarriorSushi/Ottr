# OTTR - One-to-One Exclusive Messenger

A React Native app that allows users to connect with exactly one person at a time for exclusive messaging. Users set a unique username, send connection requests, and chat in real-time.

## Features

- **Exclusive Connections**: Connect with only one person at a time
- **Real-time Messaging**: Instant messaging using Socket.io
- **Connection Requests**: Send and receive connection requests by username
- **Simple Authentication**: Username-based authentication system
- **Typing Indicators**: See when the other person is typing
- **Online/Offline Status**: Know when your connection is online
- **Message History**: Persistent message storage

## Tech Stack

**Frontend:**
- React Native 0.79.5
- Expo SDK 53.0.17
- Socket.io Client 4.8.1
- AsyncStorage for local data

**Backend:**
- Node.js with Express
- Socket.io 4.8.1 for real-time communication
- Better-SQLite3 for database
- CORS support

## Project Structure

```
ottr/
├── mobile/                 # React Native app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # App screens
│   │   ├── services/       # API and Socket services
│   │   └── utils/          # Utility functions
│   ├── App.js             # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── socket/         # Socket.io event handlers
│   │   ├── app.js          # Express app setup
│   │   └── database.js     # SQLite database setup
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (for mobile development)
- iOS Simulator or Android Emulator (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ottr
   ```

2. **Set up the server**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   The server will start on http://localhost:3000

3. **Set up the mobile app**
   ```bash
   cd ../mobile
   npm install
   npm start
   ```
   Follow the Expo CLI instructions to run on your preferred platform

### Usage

1. **Create a Username**: Enter a unique username when you first open the app
2. **Send Connection Request**: Enter another user's username to send them a connection request
3. **Accept/Reject Requests**: Manage incoming connection requests
4. **Start Chatting**: Once connected, enjoy real-time messaging
5. **Disconnect**: Use the settings menu to end your current connection

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login existing user
- `GET /api/auth/user/:username` - Check if username exists

### Connections
- `POST /api/connection-request` - Send connection request
- `GET /api/connection-requests/:username` - Get pending requests
- `POST /api/connection-request/:requestId/accept` - Accept request
- `POST /api/connection-request/:requestId/reject` - Reject request
- `POST /api/connection/:connectionId/disconnect` - Disconnect
- `GET /api/connection/:userId/current` - Get current connection

### Messages
- `GET /api/messages/:connectionId` - Get message history

## Socket Events

### Client Events
- `join_user` - Join user room
- `send_message` - Send message
- `typing_start/stop` - Typing indicators
- `disconnect_connection` - Disconnect from connection

### Server Events
- `new_message` - Receive new message
- `connection_request` - New connection request
- `connection_established` - Connection accepted
- `user_online/offline` - User status updates
- `user_typing` - Typing indicators

## Database Schema

### Users Table
- id (Primary Key)
- username (Unique)
- created_at
- current_connection_id

### Connections Table
- id (Primary Key)
- user1_id, user2_id
- status (pending/connected/disconnected)
- created_at, connected_at

### Messages Table
- id (Primary Key)
- connection_id, sender_id
- content, timestamp

### Connection Requests Table
- id (Primary Key)
- from_user_id, to_username
- status (pending/accepted/rejected)
- created_at

## Development

### Running Tests
```bash
# Server tests
cd server
npm test

# Mobile tests  
cd mobile
npm test
```

### Building for Production
```bash
# Server
cd server
npm start

# Mobile (using EAS Build)
cd mobile
npx eas build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.