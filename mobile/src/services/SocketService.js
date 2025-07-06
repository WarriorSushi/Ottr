import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentUser = null;
    this.eventListeners = new Map();
  }

  connect(serverUrl = 'http://192.168.31.33:3000') {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server');
      this.isConnected = false;
      this.emit('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.emit('connection_error', error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('socket_error', error);
    });

    this.socket.on('joined', (data) => {
      console.log('Successfully joined user room');
      this.emit('user_joined', data);
    });

    this.socket.on('new_message', (message) => {
      console.log('New message received');
      this.emit('message_received', message);
    });

    this.socket.on('user_typing', (data) => {
      this.emit('typing_indicator', data);
    });

    this.socket.on('new_connection_request', (request) => {
      console.log('New connection request received');
      this.emit('connection_request_received', request);
    });

    this.socket.on('connection_established', (data) => {
      console.log('Connection established');
      this.emit('connection_established', data);
    });

    this.socket.on('connection_disconnected', (data) => {
      console.log('Connection disconnected');
      this.emit('connection_disconnected', data);
    });

    this.socket.on('user_online', (data) => {
      console.log('User came online');
      this.emit('user_status_changed', { ...data, online: true });
    });

    this.socket.on('user_offline', (data) => {
      console.log('User went offline');
      this.emit('user_status_changed', { ...data, online: false });
    });

    this.socket.on('message_reaction', (data) => {
      console.log('Message reaction received');
      this.emit('message_reaction', data);
    });

    this.socket.on('message_delivered', (data) => {
      console.log('Message delivered');
      this.emit('message_delivered', data);
    });

    this.socket.on('message_read', (data) => {
      console.log('Message read');
      this.emit('message_read', data);
    });
  }

  joinUser(userData) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    this.currentUser = userData;
    this.socket.emit('join_user', userData);
  }

  sendMessage(messageData) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    this.socket.emit('send_message', messageData);
    return true;
  }

  startTyping(connectionId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('typing_start', { connectionId });
  }

  stopTyping(connectionId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('typing_stop', { connectionId });
  }

  notifyConnectionRequestSent(data) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('connection_request_sent', data);
  }

  notifyConnectionAccepted(data) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('connection_accepted', data);
  }

  disconnectConnection(data) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('disconnect_connection', data);
  }

  sendReaction(reactionData) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }
    
    this.socket.emit('send_reaction', reactionData);
    return true;
  }

  sendReadReceipt(readReceiptData) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }
    
    this.socket.emit('message_read_receipt', readReceiptData);
    return true;
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.eventListeners.has(event)) return;
    
    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
    
    if (listeners.length === 0) {
      this.eventListeners.delete(event);
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event) {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentUser = null;
    this.eventListeners.clear();
  }

  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      currentUser: this.currentUser,
    };
  }
}

export default new SocketService();