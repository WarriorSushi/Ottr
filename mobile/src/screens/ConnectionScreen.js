import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity 
} from 'react-native';
import UsernameInput from '../components/UsernameInput';
import ConnectionRequest from '../components/ConnectionRequest';
import ApiService from '../services/ApiService';
import SocketService from '../services/SocketService';

const ConnectionScreen = ({ user, onConnectionEstablished }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);

  useEffect(() => {
    loadConnectionRequests();
    setupSocketListeners();
    
    return () => {
      SocketService.off('connection_request_received', handleNewConnectionRequest);
      SocketService.off('connection_established', handleConnectionEstablished);
    };
  }, []);

  const setupSocketListeners = () => {
    SocketService.on('connection_request_received', handleNewConnectionRequest);
    SocketService.on('connection_established', handleConnectionEstablished);
  };

  const handleNewConnectionRequest = (request) => {
    setConnectionRequests(prev => [request, ...prev]);
  };

  const handleConnectionEstablished = async (data) => {
    try {
      const connectionData = await ApiService.getCurrentConnection(user.id);
      if (connectionData.connection) {
        onConnectionEstablished(connectionData.connection, connectionData.recent_messages);
      }
    } catch (error) {
      console.error('Error getting connection after establishment:', error);
    }
  };

  const loadConnectionRequests = async () => {
    try {
      const response = await ApiService.getConnectionRequests(user.username);
      setConnectionRequests(response.requests);
    } catch (error) {
      console.error('Error loading connection requests:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConnectionRequests();
    setRefreshing(false);
  };

  const handleSendConnectionRequest = async (targetUsername) => {
    setIsLoading(true);
    
    try {
      const targetCheck = await ApiService.checkUsername(targetUsername);
      
      if (!targetCheck.exists) {
        Alert.alert('Error', 'User not found');
        setIsLoading(false);
        return;
      }

      const response = await ApiService.sendConnectionRequest(user.id, targetUsername);
      
      SocketService.notifyConnectionRequestSent({
        toUsername: targetUsername,
        fromUsername: user.username,
        requestId: response.requestId
      });
      
      Alert.alert(
        'Request Sent',
        `Connection request sent to ${targetUsername}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Failed to send connection request',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setProcessingRequest(requestId);
    
    try {
      const response = await ApiService.acceptConnectionRequest(requestId, user.id);
      
      SocketService.notifyConnectionAccepted({
        connectionId: response.connection.id,
        user1Id: response.connection.user1_id,
        user2Id: response.connection.user2_id
      });
      
      setConnectionRequests(prev => prev.filter(req => req.id !== requestId));
      
      const connectionData = await ApiService.getCurrentConnection(user.id);
      if (connectionData.connection) {
        onConnectionEstablished(connectionData.connection, connectionData.recent_messages);
      }
      
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Failed to accept connection request',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setProcessingRequest(requestId);
    
    try {
      await ApiService.rejectConnectionRequest(requestId, user.id);
      setConnectionRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Failed to reject connection request',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessingRequest(null);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Hello, {user.username}!</Text>
        <Text style={styles.subtitle}>Ready to connect?</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Connection Request</Text>
        <Text style={styles.sectionDescription}>
          Enter a username to send them a connection request
        </Text>
        <UsernameInput
          onValidUsername={handleSendConnectionRequest}
          isLoading={isLoading}
          placeholder="Enter username to connect"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Pending Requests ({connectionRequests.length})
        </Text>
        
        {connectionRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No pending connection requests
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Pull to refresh or send a request to get started
            </Text>
          </View>
        ) : (
          connectionRequests.map((request) => (
            <ConnectionRequest
              key={request.id}
              request={request}
              onAccept={handleAcceptRequest}
              onReject={handleRejectRequest}
              isProcessing={processingRequest === request.id}
            />
          ))
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          You can only have one active connection at a time.{'\n'}
          Accept a request to start chatting!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ConnectionScreen;