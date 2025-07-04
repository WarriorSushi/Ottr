const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const createTables = () => {
  // Users table
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      current_connection_id INTEGER
    )
  `;

  // Connections table
  const createConnectionsTable = `
    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'connected', 'disconnected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      connected_at DATETIME,
      FOREIGN KEY (user1_id) REFERENCES users(id),
      FOREIGN KEY (user2_id) REFERENCES users(id)
    )
  `;

  // Messages table
  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (connection_id) REFERENCES connections(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    )
  `;

  // Connection requests table
  const createConnectionRequestsTable = `
    CREATE TABLE IF NOT EXISTS connection_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_username TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id)
    )
  `;

  try {
    db.exec(createUsersTable);
    db.exec(createConnectionsTable);
    db.exec(createMessagesTable);
    db.exec(createConnectionRequestsTable);
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

// Database helper functions (will be initialized after tables are created)
let dbHelpers = {};

// Function to get initialized dbHelpers
const getDbHelpers = () => {
  if (!dbHelpers.createUser) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbHelpers;
};

// Initialize database
const initDatabase = () => {
  createTables();
  
  // Initialize prepared statements after tables are created
  dbHelpers = {
    // User operations
    createUser: db.prepare('INSERT INTO users (username) VALUES (?)'),
    getUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
    getUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
    updateUserConnection: db.prepare('UPDATE users SET current_connection_id = ? WHERE id = ?'),

    // Connection operations
    createConnection: db.prepare('INSERT INTO connections (user1_id, user2_id, status) VALUES (?, ?, ?)'),
    getConnectionById: db.prepare('SELECT * FROM connections WHERE id = ?'),
    updateConnectionStatus: db.prepare('UPDATE connections SET status = ?, connected_at = CURRENT_TIMESTAMP WHERE id = ?'),
    getCurrentConnection: db.prepare(`
      SELECT c.*, u1.username as user1_username, u2.username as user2_username 
      FROM connections c 
      JOIN users u1 ON c.user1_id = u1.id 
      JOIN users u2 ON c.user2_id = u2.id 
      WHERE (c.user1_id = ? OR c.user2_id = ?) AND c.status = 'connected'
    `),

    // Connection request operations
    createConnectionRequest: db.prepare('INSERT INTO connection_requests (from_user_id, to_username, status) VALUES (?, ?, ?)'),
    getConnectionRequestById: db.prepare('SELECT * FROM connection_requests WHERE id = ?'),
    getConnectionRequestsByUsername: db.prepare(`
      SELECT cr.*, u.username as from_username 
      FROM connection_requests cr 
      JOIN users u ON cr.from_user_id = u.id 
      WHERE cr.to_username = ? AND cr.status = 'pending'
    `),
    updateConnectionRequestStatus: db.prepare('UPDATE connection_requests SET status = ? WHERE id = ?'),

    // Message operations
    createMessage: db.prepare('INSERT INTO messages (connection_id, sender_id, content) VALUES (?, ?, ?)'),
    getMessagesByConnection: db.prepare(`
      SELECT m.*, u.username as sender_username 
      FROM messages m 
      JOIN users u ON m.sender_id = u.id 
      WHERE m.connection_id = ? 
      ORDER BY m.timestamp ASC 
      LIMIT ? OFFSET ?
    `),
    getLatestMessages: db.prepare(`
      SELECT m.*, u.username as sender_username 
      FROM messages m 
      JOIN users u ON m.sender_id = u.id 
      WHERE m.connection_id = ? 
      ORDER BY m.timestamp DESC 
      LIMIT ?
    `)
  };
  
  return db;
};

module.exports = {
  db,
  getDbHelpers,
  initDatabase
};