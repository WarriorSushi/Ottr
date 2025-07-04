const express = require('express');
const { getDbHelpers } = require('../database');

const router = express.Router();

// POST /api/connection-request - Send connection request
router.post('/connection-request', async (req, res) => {
  try {
    const dbHelpers = getDbHelpers();
    const { fromUserId, toUsername } = req.body;

    if (!fromUserId || !toUsername) {
      return res.status(400).json({ error: 'From user ID and target username are required' });
    }

    // Validate fromUserId
    const fromUser = dbHelpers.getUserById.get(fromUserId);
    if (!fromUser) {
      return res.status(404).json({ error: 'From user not found' });
    }

    // Check if user is trying to connect to themselves
    if (fromUser.username === toUsername) {
      return res.status(400).json({ error: 'Cannot send connection request to yourself' });
    }

    // Check if target user exists
    const toUser = dbHelpers.getUserByUsername.get(toUsername);
    if (!toUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Check if fromUser already has an active connection
    const existingConnection = dbHelpers.getCurrentConnection.get(fromUserId, fromUserId);
    if (existingConnection) {
      return res.status(400).json({ error: 'You already have an active connection' });
    }

    // Check if toUser already has an active connection
    const targetConnection = dbHelpers.getCurrentConnection.get(toUser.id, toUser.id);
    if (targetConnection) {
      return res.status(400).json({ error: 'Target user already has an active connection' });
    }

    // Check for existing pending request from this user to target
    const existingRequest = dbHelpers.getConnectionRequestsByUsername.all(fromUser.username)
      .find(req => req.to_username === toUsername && req.status === 'pending');
    
    if (existingRequest) {
      return res.status(400).json({ error: 'Connection request already pending' });
    }

    // Create connection request
    const result = dbHelpers.createConnectionRequest.run(fromUserId, toUsername, 'pending');
    
    res.status(201).json({
      message: 'Connection request sent successfully',
      requestId: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ error: 'Failed to send connection request' });
  }
});

// GET /api/connection-requests/:username - Get pending requests for user
router.get('/connection-requests/:username', async (req, res) => {
  try {
    const dbHelpers = getDbHelpers();
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Verify user exists
    const user = dbHelpers.getUserByUsername.get(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const requests = dbHelpers.getConnectionRequestsByUsername.all(username);
    
    res.json({
      requests: requests.map(req => ({
        id: req.id,
        from_user_id: req.from_user_id,
        from_username: req.from_username,
        to_username: req.to_username,
        status: req.status,
        created_at: req.created_at
      }))
    });

  } catch (error) {
    console.error('Error getting connection requests:', error);
    res.status(500).json({ error: 'Failed to get connection requests' });
  }
});

// POST /api/connection-request/:requestId/accept - Accept connection request
router.post('/connection-request/:requestId/accept', async (req, res) => {
  try {
    const dbHelpers = getDbHelpers();
    const { requestId } = req.params;
    const { userId } = req.body;

    if (!requestId || !userId) {
      return res.status(400).json({ error: 'Request ID and user ID are required' });
    }

    // Get the connection request
    const request = dbHelpers.getConnectionRequestById.get(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Connection request is not pending' });
    }

    // Verify the accepting user
    const acceptingUser = dbHelpers.getUserById.get(userId);
    if (!acceptingUser || acceptingUser.username !== request.to_username) {
      return res.status(403).json({ error: 'Unauthorized to accept this request' });
    }

    // Check if either user already has an active connection
    const user1Connection = dbHelpers.getCurrentConnection.get(request.from_user_id, request.from_user_id);
    const user2Connection = dbHelpers.getCurrentConnection.get(acceptingUser.id, acceptingUser.id);
    
    if (user1Connection || user2Connection) {
      return res.status(400).json({ error: 'One or both users already have an active connection' });
    }

    // Create the connection
    const connectionResult = dbHelpers.createConnection.run(request.from_user_id, acceptingUser.id, 'connected');
    const connectionId = connectionResult.lastInsertRowid;

    // Update connection status
    dbHelpers.updateConnectionStatus.run('connected', connectionId);

    // Update users' current connection
    dbHelpers.updateUserConnection.run(connectionId, request.from_user_id);
    dbHelpers.updateUserConnection.run(connectionId, acceptingUser.id);

    // Update request status
    dbHelpers.updateConnectionRequestStatus.run('accepted', requestId);

    // Get the created connection
    const connection = dbHelpers.getConnectionById.get(connectionId);

    res.json({
      message: 'Connection request accepted',
      connection: {
        id: connection.id,
        user1_id: connection.user1_id,
        user2_id: connection.user2_id,
        status: connection.status,
        created_at: connection.created_at,
        connected_at: connection.connected_at
      }
    });

  } catch (error) {
    console.error('Error accepting connection request:', error);
    res.status(500).json({ error: 'Failed to accept connection request' });
  }
});

// POST /api/connection-request/:requestId/reject - Reject connection request
router.post('/connection-request/:requestId/reject', async (req, res) => {
  try {
    const dbHelpers = getDbHelpers();
    const { requestId } = req.params;
    const { userId } = req.body;

    if (!requestId || !userId) {
      return res.status(400).json({ error: 'Request ID and user ID are required' });
    }

    // Get the connection request
    const request = dbHelpers.getConnectionRequestById.get(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Connection request is not pending' });
    }

    // Verify the rejecting user
    const rejectingUser = dbHelpers.getUserById.get(userId);
    if (!rejectingUser || rejectingUser.username !== request.to_username) {
      return res.status(403).json({ error: 'Unauthorized to reject this request' });
    }

    // Update request status
    dbHelpers.updateConnectionRequestStatus.run('rejected', requestId);

    res.json({ message: 'Connection request rejected' });

  } catch (error) {
    console.error('Error rejecting connection request:', error);
    res.status(500).json({ error: 'Failed to reject connection request' });
  }
});

// POST /api/connection/:connectionId/disconnect - Disconnect from connection
router.post('/connection/:connectionId/disconnect', async (req, res) => {
  try {
    const dbHelpers = getDbHelpers();
    const { connectionId } = req.params;
    const { userId } = req.body;

    if (!connectionId || !userId) {
      return res.status(400).json({ error: 'Connection ID and user ID are required' });
    }

    // Get the connection
    const connection = dbHelpers.getConnectionById.get(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (connection.status !== 'connected') {
      return res.status(400).json({ error: 'Connection is not active' });
    }

    // Verify user is part of this connection
    if (connection.user1_id !== parseInt(userId) && connection.user2_id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Unauthorized to disconnect this connection' });
    }

    // Update connection status
    dbHelpers.updateConnectionStatus.run('disconnected', connectionId);

    // Clear users' current connection
    dbHelpers.updateUserConnection.run(null, connection.user1_id);
    dbHelpers.updateUserConnection.run(null, connection.user2_id);

    res.json({ message: 'Disconnected successfully' });

  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// GET /api/connection/:userId/current - Get current connection for user
router.get('/connection/:userId/current', async (req, res) => {
  try {
    const dbHelpers = getDbHelpers();
    const { userId } = req.params;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    // Verify user exists
    const user = dbHelpers.getUserById.get(parseInt(userId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const connection = dbHelpers.getCurrentConnection.get(parseInt(userId), parseInt(userId));
    
    if (connection) {
      // Get recent messages for this connection
      const recentMessages = dbHelpers.getLatestMessages.all(connection.id, 50);
      
      res.json({
        connection: {
          id: connection.id,
          user1_id: connection.user1_id,
          user2_id: connection.user2_id,
          user1_username: connection.user1_username,
          user2_username: connection.user2_username,
          status: connection.status,
          created_at: connection.created_at,
          connected_at: connection.connected_at
        },
        recent_messages: recentMessages.reverse() // Reverse to show oldest first
      });
    } else {
      res.json({ connection: null, recent_messages: [] });
    }

  } catch (error) {
    console.error('Error getting current connection:', error);
    res.status(500).json({ error: 'Failed to get current connection' });
  }
});

// GET /api/messages/:connectionId - Get messages for connection with pagination
router.get('/messages/:connectionId', async (req, res) => {
  try {
    const dbHelpers = getDbHelpers();
    const { connectionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!connectionId || isNaN(connectionId)) {
      return res.status(400).json({ error: 'Valid connection ID is required' });
    }

    // Verify connection exists
    const connection = dbHelpers.getConnectionById.get(parseInt(connectionId));
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const messages = dbHelpers.getMessagesByConnection.all(
      parseInt(connectionId), 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({ messages });

  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

module.exports = router;