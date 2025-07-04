const express = require('express');
const { getDbHelpers } = require('../database');

const router = express.Router();

// POST /api/auth/register - Create username
router.post('/register', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    // Check for valid characters (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    // Check if username already exists
    const existingUser = getDbHelpers().getUserByUsername.get(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Create new user
    const dbHelpers = getDbHelpers();
    const result = dbHelpers.createUser.run(username);
    const newUser = dbHelpers.getUserById.get(result.lastInsertRowid);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        created_at: newUser.created_at
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// POST /api/auth/login - Login with username
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find user
    const user = getDbHelpers().getUserByUsername.get(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current connection if any
    const dbHelpers = getDbHelpers();
    const currentConnection = dbHelpers.getCurrentConnection.get(user.id, user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at,
        current_connection_id: user.current_connection_id
      },
      currentConnection: currentConnection || null
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// GET /api/auth/user/:username - Check if username exists
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = getDbHelpers().getUserByUsername.get(username);
    
    if (user) {
      res.json({
        exists: true,
        user: {
          id: user.id,
          username: user.username,
          created_at: user.created_at
        }
      });
    } else {
      res.json({ exists: false });
    }

  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'Failed to check username' });
  }
});

// GET /api/auth/user/id/:userId - Get user by ID
router.get('/user/id/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    const user = getDbHelpers().getUserById.get(parseInt(userId));
    
    if (user) {
      res.json({
        user: {
          id: user.id,
          username: user.username,
          created_at: user.created_at,
          current_connection_id: user.current_connection_id
        }
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }

  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;