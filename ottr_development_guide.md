# OTTR - One-to-One Exclusive Messenger
## Development Instructions for Claude Code

### Project Overview
Build a React Native app called OTTR that allows users to connect with exactly one person at a time for exclusive messaging. Users set a unique username, send connection requests, and chat in real-time. When connected, the app opens directly to the chat screen.

### Tech Stack & Versions (July 2025)
**Frontend:**
- React Native 0.80.1 (latest stable)
- Expo SDK 53.0.17 (supports React Native 0.79, but use canary for 0.80 support)
- React 19.1.0 (included with React Native 0.80)

**Backend:**
- Node.js 20+ (Node 18 reached EOL April 2025)
- Socket.io 4.8.1 (server & client)
- Express.js (latest)

**Database:**
- Start with better-sqlite3 12.2.0 (faster than node-sqlite3)
- Migrate to PostgreSQL later if needed

**Hosting:**
- Railway or Render (free tiers)

### Project Structure
```
ottr/
├── mobile/                 # React Native app
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── services/
│   │   └── utils/
│   ├── app.json
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── socket/
│   ├── database.db
│   └── package.json
└── README.md
```

### Development Phases

## Phase 1: Backend Setup (Week 1)

### 1.1 Initialize Server Project
```bash
mkdir ottr && cd ottr
mkdir server && cd server
npm init -y
npm install express socket.io better-sqlite3 cors dotenv
npm install -D nodemon
```

### 1.2 Database Schema
Create these tables in SQLite:

**users table:**
- id (INTEGER PRIMARY KEY)
- username (TEXT UNIQUE NOT NULL)
- created_at (DATETIME DEFAULT CURRENT_TIMESTAMP)
- current_connection_id (INTEGER, can be NULL)

**connections table:**
- id (INTEGER PRIMARY KEY) 
- user1_id (INTEGER)
- user2_id (INTEGER)
- status (TEXT: 'pending', 'connected', 'disconnected')
- created_at (DATETIME DEFAULT CURRENT_TIMESTAMP)
- connected_at (DATETIME)

**messages table:**
- id (INTEGER PRIMARY KEY)
- connection_id (INTEGER)
- sender_id (INTEGER)
- content (TEXT NOT NULL)
- timestamp (DATETIME DEFAULT CURRENT_TIMESTAMP)

**connection_requests table:**
- id (INTEGER PRIMARY KEY)
- from_user_id (INTEGER)
- to_username (TEXT)
- status (TEXT: 'pending', 'accepted', 'rejected')
- created_at (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 1.3 Core Server Files

**server/src/app.js:**
- Express server setup
- CORS configuration
- Socket.io integration
- Database initialization
- Error handling middleware

**server/src/database.js:**
- SQLite database connection
- Table creation scripts
- Database helper functions

**server/src/routes/auth.js:**
- POST /api/register - Create username
- POST /api/login - Login with username
- GET /api/user/:username - Check if username exists

**server/src/routes/connections.js:**
- POST /api/connection-request - Send connection request
- GET /api/connection-requests/:userId - Get pending requests
- POST /api/connection-request/:requestId/accept - Accept request
- POST /api/connection-request/:requestId/reject - Reject request
- POST /api/connection/:connectionId/disconnect - Disconnect
- GET /api/connection/:userId/current - Get current connection

**server/src/socket/socketHandlers.js:**
- Handle real-time messaging
- Connection status updates
- User online/offline status
- Message delivery confirmation

### 1.4 API Endpoints Requirements

**Authentication:**
- Username uniqueness validation
- Simple session/token management
- User lookup functionality

**Connection Management:**
- Send connection requests by username
- Accept/reject requests
- Disconnect from current connection
- Prevent multiple simultaneous connections

**Messaging:**
- Real-time message sending/receiving
- Message persistence
- Message history retrieval
- Connection status (online/offline)

## Phase 2: Mobile App Setup (Week 1-2)

### 2.1 Initialize React Native Project
```bash
cd ../ && mkdir mobile && cd mobile
# Use Expo for easier setup
npx create-expo-app . --template
npm install socket.io-client @react-native-async-storage/async-storage
```

### 2.2 App Structure

**mobile/src/screens/**
- WelcomeScreen.js - Initial username setup
- ConnectionScreen.js - Send/manage connection requests  
- ChatScreen.js - Main messaging interface
- SettingsScreen.js - Disconnect option

**mobile/src/components/**
- MessageBubble.js - Individual message display
- ConnectionRequest.js - Request item component
- UsernameInput.js - Username input with validation

**mobile/src/services/**
- SocketService.js - Socket.io client management
- ApiService.js - HTTP API calls
- StorageService.js - AsyncStorage wrapper

### 2.3 Key Features Implementation

**Username Setup Flow:**
1. Check if username exists in AsyncStorage
2. If not, show WelcomeScreen for username creation
3. Validate username uniqueness via API
4. Store username locally and navigate to ConnectionScreen

**Connection Request Flow:**
1. Input target username
2. Validate target exists via API
3. Send connection request
4. Show pending state
5. Handle acceptance/rejection via socket

**Chat Interface:**
1. Auto-connect to socket on app open
2. Join connection room
3. Real-time message sending/receiving
4. Message history loading
5. Connection status indicators

**Settings & Disconnect:**
1. Settings button in chat header
2. Disconnect confirmation dialog
3. Clear current connection
4. Return to ConnectionScreen

### 2.4 Navigation Structure
```
App
├── WelcomeScreen (if no username)
└── MainNavigator
    ├── ConnectionScreen (if no active connection)
    └── ChatScreen (if connected)
        └── SettingsModal
```

## Phase 3: Real-time Messaging (Week 2)

### 3.1 Socket.io Integration

**Client-side events:**
- `connect` - Join user to their personal room
- `send_message` - Send message to connection
- `disconnect_user` - Handle disconnection
- `typing_start/stop` - Typing indicators

**Server-side events:**
- `new_message` - Broadcast message to connection
- `connection_request` - Notify of incoming request
- `connection_accepted` - Notify request acceptance
- `user_disconnected` - Notify of disconnection
- `user_online/offline` - Status updates

### 3.2 Message Management
- Message queuing for offline users
- Message delivery confirmations
- Timestamp synchronization
- Message ordering and display

### 3.3 Connection State Management
- Track user online status
- Handle reconnection scenarios
- Sync connection state across devices
- Prevent duplicate connections

## Implementation Guidelines for Claude Code

### Code Quality Standards
1. **Use TypeScript where possible** for better type safety
2. **Implement proper error handling** - try/catch blocks, error boundaries
3. **Add input validation** - both client and server side
4. **Use consistent naming conventions** - camelCase for JS, snake_case for DB
5. **Add logging** - console.log for development, proper logging for production

### Performance Considerations
1. **Implement message pagination** - Load 50 messages initially, infinite scroll
2. **Use React.memo** for message components to prevent unnecessary re-renders
3. **Debounce API calls** - especially username validation
4. **Optimize database queries** - Use indexes on frequently queried columns
5. **Implement connection pooling** if scaling beyond SQLite

### Security Best Practices
1. **Sanitize all inputs** - Prevent XSS and injection attacks
2. **Rate limit API endpoints** - Prevent spam and abuse
3. **Validate socket.io events** - Don't trust client data
4. **Use environment variables** for configuration
5. **Implement basic authentication** - Simple token-based auth

### Testing Strategy
1. **Test each API endpoint** individually
2. **Test socket connections** with multiple clients
3. **Test offline/online scenarios** 
4. **Test edge cases** - long messages, special characters, network issues
5. **Test on multiple devices** - iOS simulator, Android emulator

### Development Workflow
1. **Start with backend** - Get API and socket.io working first
2. **Test with Postman/curl** before building frontend
3. **Build screens incrementally** - One screen at a time
4. **Test frequently** - After each major feature
5. **Use React Native Debugger** for debugging

### Common Pitfalls to Avoid
1. **Don't use localStorage** - Use AsyncStorage in React Native
2. **Handle network errors gracefully** - Show user-friendly messages
3. **Prevent race conditions** - Especially in socket event handlers
4. **Don't expose sensitive data** - Keep API keys server-side
5. **Handle app state changes** - Background/foreground transitions

### Token Efficiency Tips
1. **Ask for complete file structure first** - Get the skeleton right
2. **Implement one feature at a time** - Don't try to build everything at once
3. **Use established patterns** - Follow React Native and Node.js conventions
4. **Reuse code where possible** - Create utility functions and components
5. **Test incrementally** - Catch issues early before they compound

### Deployment Considerations
1. **Environment variables** for different stages (dev/prod)
2. **Database migrations** for schema changes
3. **Socket.io scaling** - Use Redis adapter for multiple servers later
4. **Mobile app building** - Use EAS Build for production
5. **Monitoring** - Add basic logging and error tracking

### Future Enhancement Ideas (Post-MVP)
1. **Push notifications** - For offline message delivery
2. **Media sharing** - Images, voice messages
3. **Message reactions** - Emoji reactions
4. **Read receipts** - Show when messages are read
5. **Dark mode** - Theme switching
6. **Message encryption** - End-to-end encryption
7. **Web version** - React web app using same backend

This guide provides a comprehensive roadmap for building OTTR efficiently. Focus on getting the core functionality working first (username setup, connection requests, basic messaging) before adding polish and advanced features.