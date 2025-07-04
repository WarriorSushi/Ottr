const API_BASE_URL = 'http://192.168.31.33:3000/api';

class ApiService {
  async register(username) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(username) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async checkUsername(username) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/${username}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Username check failed');
      }

      return data;
    } catch (error) {
      console.error('Username check error:', error);
      throw error;
    }
  }

  async sendConnectionRequest(fromUserId, toUsername) {
    try {
      const response = await fetch(`${API_BASE_URL}/connection-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fromUserId, toUsername }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send connection request');
      }

      return data;
    } catch (error) {
      console.error('Connection request error:', error);
      throw error;
    }
  }

  async getConnectionRequests(username) {
    try {
      const response = await fetch(`${API_BASE_URL}/connection-requests/${username}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get connection requests');
      }

      return data;
    } catch (error) {
      console.error('Get connection requests error:', error);
      throw error;
    }
  }

  async acceptConnectionRequest(requestId, userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/connection-request/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept connection request');
      }

      return data;
    } catch (error) {
      console.error('Accept connection request error:', error);
      throw error;
    }
  }

  async rejectConnectionRequest(requestId, userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/connection-request/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject connection request');
      }

      return data;
    } catch (error) {
      console.error('Reject connection request error:', error);
      throw error;
    }
  }

  async disconnectConnection(connectionId, userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/connection/${connectionId}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect');
      }

      return data;
    } catch (error) {
      console.error('Disconnect error:', error);
      throw error;
    }
  }

  async getCurrentConnection(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/connection/${userId}/current`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get current connection');
      }

      return data;
    } catch (error) {
      console.error('Get current connection error:', error);
      throw error;
    }
  }

  async getMessages(connectionId, limit = 50, offset = 0) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${connectionId}?limit=${limit}&offset=${offset}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get messages');
      }

      return data;
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  }
}

export default new ApiService();