const { getDbHelpers } = require('../database');

const socketHandlers = (socket, io, db) => {
  let currentUser = null;
  let currentConnectionId = null;

  // User joins their personal room when connecting
  socket.on('join_user', (userData) => {
    try {
      const { userId, username } = userData;
      
      // Validate user
      const user = getDbHelpers().getUserById.get(userId);
      if (!user || user.username !== username) {
        socket.emit('error', { message: 'Invalid user credentials' });
        return;
      }

      currentUser = user;
      socket.currentUser = user; // Store on socket for later access
      socket.join(`user_${userId}`);
      
      // Join connection room if user has an active connection
      const connection = getDbHelpers().getCurrentConnection.get(userId, userId);
      if (connection) {
        currentConnectionId = connection.id;
        socket.join(`connection_${connection.id}`);
        
        // Notify the other user that this user is online
        const otherUserId = connection.user1_id === userId ? connection.user2_id : connection.user1_id;
        socket.to(`user_${otherUserId}`).emit('user_online', {
          userId: userId,
          username: username
        });
      }

      console.log(`User ${username} (${userId}) connected and joined rooms`);
      socket.emit('joined', { 
        message: 'Successfully connected',
        currentConnection: connection 
      });

    } catch (error) {
      console.error('Error in join_user:', error);
      socket.emit('error', { message: 'Failed to join user room' });
    }
  });

  // Handle sending messages
  socket.on('send_message', (messageData) => {
    try {
      const { connectionId, senderId, content } = messageData;

      if (!currentUser || currentUser.id !== senderId) {
        socket.emit('error', { message: 'Unauthorized to send message' });
        return;
      }

      if (!content || content.trim().length === 0) {
        socket.emit('error', { message: 'Message content cannot be empty' });
        return;
      }

      if (content.length > 1000) {
        socket.emit('error', { message: 'Message too long (max 1000 characters)' });
        return;
      }

      // Verify connection exists and user is part of it
      const connection = getDbHelpers().getConnectionById.get(connectionId);
      if (!connection || connection.status !== 'connected') {
        socket.emit('error', { message: 'Invalid or inactive connection' });
        return;
      }

      if (connection.user1_id !== senderId && connection.user2_id !== senderId) {
        socket.emit('error', { message: 'Unauthorized to send message to this connection' });
        return;
      }

      // Save message to database
      const result = getDbHelpers().createMessage.run(connectionId, senderId, content.trim());
      const messageId = result.lastInsertRowid;

      // Get the saved message with sender info
      const savedMessage = {
        id: messageId,
        connection_id: connectionId,
        sender_id: senderId,
        sender_username: currentUser.username,
        content: content.trim(),
        timestamp: new Date().toISOString()
      };

      // Send message to all users in the connection room
      io.to(`connection_${connectionId}`).emit('new_message', savedMessage);

      console.log(`Message sent in connection ${connectionId} by user ${currentUser.username}`);

    } catch (error) {
      console.error('Error in send_message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    try {
      const { connectionId } = data;
      
      if (!currentUser || !currentConnectionId || currentConnectionId !== connectionId) {
        return;
      }

      // Notify other users in the connection (excluding sender)
      socket.to(`connection_${connectionId}`).emit('user_typing', {
        userId: currentUser.id,
        username: currentUser.username,
        typing: true
      });

    } catch (error) {
      console.error('Error in typing_start:', error);
    }
  });

  socket.on('typing_stop', (data) => {
    try {
      const { connectionId } = data;
      
      if (!currentUser || !currentConnectionId || currentConnectionId !== connectionId) {
        return;
      }

      // Notify other users in the connection (excluding sender)
      socket.to(`connection_${connectionId}`).emit('user_typing', {
        userId: currentUser.id,
        username: currentUser.username,
        typing: false
      });

    } catch (error) {
      console.error('Error in typing_stop:', error);
    }
  });

  // Handle connection requests via socket
  socket.on('connection_request_sent', (data) => {
    try {
      const { toUsername, fromUsername, requestId } = data;
      
      // Notify the target user about the new connection request
      const targetUser = getDbHelpers().getUserByUsername.get(toUsername);
      if (targetUser) {
        io.to(`user_${targetUser.id}`).emit('new_connection_request', {
          id: requestId,
          from_username: fromUsername,
          to_username: toUsername,
          status: 'pending',
          created_at: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Error in connection_request_sent:', error);
    }
  });

  // Handle connection acceptance via socket
  socket.on('connection_accepted', (data) => {
    try {
      const { connectionId, user1Id, user2Id } = data;
      
      // Make both users join the connection room
      io.sockets.sockets.forEach((clientSocket) => {
        if (clientSocket.currentUser) {
          if (clientSocket.currentUser.id === user1Id || clientSocket.currentUser.id === user2Id) {
            clientSocket.join(`connection_${connectionId}`);
            clientSocket.currentConnectionId = connectionId;
          }
        }
      });
      
      // Notify both users about the accepted connection
      io.to(`user_${user1Id}`).emit('connection_established', {
        connectionId,
        message: 'Connection established!'
      });
      
      io.to(`user_${user2Id}`).emit('connection_established', {
        connectionId,
        message: 'Connection established!'
      });

      console.log(`Connection ${connectionId} established between users ${user1Id} and ${user2Id}`);
      console.log(`Both users added to connection_${connectionId} room`);

    } catch (error) {
      console.error('Error in connection_accepted:', error);
    }
  });

  // Handle disconnection from connection
  socket.on('disconnect_connection', (data) => {
    try {
      const { connectionId, userId } = data;
      
      if (!currentUser || currentUser.id !== userId) {
        socket.emit('error', { message: 'Unauthorized to disconnect connection' });
        return;
      }

      // Get connection info before disconnecting
      const connection = getDbHelpers().getConnectionById.get(connectionId);
      if (connection) {
        // Always notify the other user about disconnection (regardless of status)
        const otherUserId = connection.user1_id === userId ? connection.user2_id : connection.user1_id;
        
        console.log(`Notifying user ${otherUserId} that ${currentUser.username} disconnected`);
        io.to(`user_${otherUserId}`).emit('connection_disconnected', {
          message: `${currentUser.username} ended the connection`,
          disconnectedBy: currentUser.username
        });

        // Leave the connection room
        socket.leave(`connection_${connectionId}`);
        currentConnectionId = null;

        console.log(`User ${currentUser.username} manually disconnected from connection ${connectionId}`);
      }

    } catch (error) {
      console.error('Error in disconnect_connection:', error);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    try {
      if (currentUser && currentConnectionId) {
        const dbHelpers = getDbHelpers();
        const connection = dbHelpers.getConnectionById.get(currentConnectionId);
        
        if (connection && connection.status === 'connected') {
          const otherUserId = connection.user1_id === currentUser.id ? connection.user2_id : connection.user1_id;
          
          // Automatically disconnect the connection
          dbHelpers.updateConnectionStatus.run('disconnected', currentConnectionId);
          
          // Clear users' current connection
          dbHelpers.updateUserConnection.run(null, connection.user1_id);
          dbHelpers.updateUserConnection.run(null, connection.user2_id);
          
          // Notify the other user that connection has been ended
          io.to(`user_${otherUserId}`).emit('connection_disconnected', {
            message: `${currentUser.username} disconnected. Connection ended.`,
            disconnectedBy: currentUser.username
          });
          
          console.log(`User ${currentUser.username} disconnected - connection ${currentConnectionId} automatically ended`);
        }
      }

      console.log(`User ${currentUser ? currentUser.username : 'unknown'} (${socket.id}) disconnected`);
    } catch (error) {
      console.error('Error in disconnect handler:', error);
    }
  });

  // Handle reconnection
  socket.on('reconnect', () => {
    try {
      if (currentUser && currentConnectionId) {
        // Rejoin connection room
        socket.join(`connection_${currentConnectionId}`);
        
        // Notify the other user that this user is back online
        const connection = getDbHelpers().getConnectionById.get(currentConnectionId);
        if (connection && connection.status === 'connected') {
          const otherUserId = connection.user1_id === currentUser.id ? connection.user2_id : connection.user1_id;
          socket.to(`user_${otherUserId}`).emit('user_online', {
            userId: currentUser.id,
            username: currentUser.username
          });
        }
      }

      console.log(`User ${currentUser ? currentUser.username : 'unknown'} reconnected`);
    } catch (error) {
      console.error('Error in reconnect handler:', error);
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
};

module.exports = socketHandlers;