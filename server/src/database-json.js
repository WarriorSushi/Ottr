const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.json');

// Initialize empty database structure
const initDb = {
  users: [],
  connections: [],
  messages: [],
  connection_requests: []
};

// Ensure database file exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify(initDb, null, 2));
}

// Helper function to read database
const readDb = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return initDb;
  }
};

// Helper function to write database
const writeDb = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
    throw error;
  }
};

// Helper function to generate ID
const generateId = (collection) => {
  const db = readDb();
  const items = db[collection] || [];
  return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
};

// Database helper functions
const dbHelpers = {
  // User operations
  createUser: {
    run: (username) => {
      const db = readDb();
      const id = generateId('users');
      const user = {
        id,
        username,
        created_at: new Date().toISOString(),
        current_connection_id: null
      };
      db.users.push(user);
      writeDb(db);
      return { lastInsertRowid: id };
    }
  },

  getUserByUsername: {
    get: (username) => {
      const db = readDb();
      return db.users.find(user => user.username === username) || null;
    }
  },

  getUserById: {
    get: (id) => {
      const db = readDb();
      return db.users.find(user => user.id === parseInt(id)) || null;
    }
  },

  updateUserConnection: {
    run: (connectionId, userId) => {
      const db = readDb();
      const user = db.users.find(u => u.id === parseInt(userId));
      if (user) {
        user.current_connection_id = connectionId;
        writeDb(db);
      }
    }
  },

  // Connection operations
  createConnection: {
    run: (user1Id, user2Id, status) => {
      const db = readDb();
      const id = generateId('connections');
      const connection = {
        id,
        user1_id: parseInt(user1Id),
        user2_id: parseInt(user2Id),
        status,
        created_at: new Date().toISOString(),
        connected_at: status === 'connected' ? new Date().toISOString() : null
      };
      db.connections.push(connection);
      writeDb(db);
      return { lastInsertRowid: id };
    }
  },

  getConnectionById: {
    get: (id) => {
      const db = readDb();
      return db.connections.find(conn => conn.id === parseInt(id)) || null;
    }
  },

  updateConnectionStatus: {
    run: (status, id) => {
      const db = readDb();
      const connection = db.connections.find(conn => conn.id === parseInt(id));
      if (connection) {
        connection.status = status;
        if (status === 'connected') {
          connection.connected_at = new Date().toISOString();
        }
        writeDb(db);
      }
    }
  },

  getCurrentConnection: {
    get: (userId1, userId2) => {
      const db = readDb();
      const userId = parseInt(userId1);
      const connection = db.connections.find(conn => 
        (conn.user1_id === userId || conn.user2_id === userId) && 
        conn.status === 'connected'
      );
      
      if (connection) {
        const user1 = db.users.find(u => u.id === connection.user1_id);
        const user2 = db.users.find(u => u.id === connection.user2_id);
        return {
          ...connection,
          user1_username: user1?.username,
          user2_username: user2?.username
        };
      }
      return null;
    }
  },

  // Connection request operations
  createConnectionRequest: {
    run: (fromUserId, toUsername, status) => {
      const db = readDb();
      const id = generateId('connection_requests');
      const request = {
        id,
        from_user_id: parseInt(fromUserId),
        to_username: toUsername,
        status,
        created_at: new Date().toISOString()
      };
      db.connection_requests.push(request);
      writeDb(db);
      return { lastInsertRowid: id };
    }
  },

  getConnectionRequestById: {
    get: (id) => {
      const db = readDb();
      return db.connection_requests.find(req => req.id === parseInt(id)) || null;
    }
  },

  getConnectionRequestsByUsername: {
    all: (username) => {
      const db = readDb();
      return db.connection_requests
        .filter(req => req.to_username === username && req.status === 'pending')
        .map(req => {
          const fromUser = db.users.find(u => u.id === req.from_user_id);
          return {
            ...req,
            from_username: fromUser?.username
          };
        });
    }
  },

  updateConnectionRequestStatus: {
    run: (status, id) => {
      const db = readDb();
      const request = db.connection_requests.find(req => req.id === parseInt(id));
      if (request) {
        request.status = status;
        writeDb(db);
      }
    }
  },

  // Message operations
  createMessage: {
    run: (connectionId, senderId, content) => {
      const db = readDb();
      const id = generateId('messages');
      const message = {
        id,
        connection_id: parseInt(connectionId),
        sender_id: parseInt(senderId),
        content,
        timestamp: new Date().toISOString()
      };
      db.messages.push(message);
      writeDb(db);
      return { lastInsertRowid: id };
    }
  },

  getMessagesByConnection: {
    all: (connectionId, limit, offset) => {
      const db = readDb();
      const messages = db.messages
        .filter(msg => msg.connection_id === parseInt(connectionId))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
      
      return messages.map(msg => {
        const sender = db.users.find(u => u.id === msg.sender_id);
        return {
          ...msg,
          sender_username: sender?.username
        };
      });
    }
  },

  getLatestMessages: {
    all: (connectionId, limit) => {
      const db = readDb();
      const messages = db.messages
        .filter(msg => msg.connection_id === parseInt(connectionId))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, parseInt(limit));
      
      return messages.map(msg => {
        const sender = db.users.find(u => u.id === msg.sender_id);
        return {
          ...msg,
          sender_username: sender?.username
        };
      });
    }
  }
};

// Initialize database
const initDatabase = () => {
  console.log('Using JSON database at:', dbPath);
  return { close: () => {} }; // Mock close function for compatibility
};

module.exports = {
  db: { close: () => {} }, // Mock db object
  dbHelpers,
  initDatabase
};