import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  RefreshControl,
  StatusBar,
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import UsernameInput from '../components/UsernameInput';
import ConnectionRequest from '../components/ConnectionRequest';
import ApiService from '../services/ApiService';
import SocketService from '../services/SocketService';

const ConnectionScreen = ({ user, onConnectionEstablished }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [showConnectionAnimation, setShowConnectionAnimation] = useState(false);

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
      setShowConnectionAnimation(true);
      
      setTimeout(async () => {
        const connectionData = await ApiService.getCurrentConnection(user.id);
        if (connectionData.connection) {
          onConnectionEstablished(connectionData.connection, connectionData.recent_messages);
        }
      }, 2000);
    } catch (error) {
      console.error('Error getting connection after establishment:', error);
      setShowConnectionAnimation(false);
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
      
      setShowConnectionAnimation(true);
      
      setTimeout(async () => {
        const connectionData = await ApiService.getCurrentConnection(user.id);
        if (connectionData.connection) {
          onConnectionEstablished(connectionData.connection, connectionData.recent_messages);
        }
      }, 2000);
      
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
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#A8E6FF" translucent={false} />
        
        {/* Crystal Aqua Background */}
        <LinearGradient
          colors={['#A8E6FF', '#4DD3F4', '#A8E6FF']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#1E1E1E"
              colors={['#4DD3F4']}
            />
          }
        >
          {/* Header with Logo and Welcome */}
          <BlurView intensity={30} style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/logo-main.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Hello, {user.username}!</Text>
            <Text style={styles.subtitle}>Ready to connect?</Text>
          </BlurView>

          {/* Send Connection Request Section */}
          <BlurView intensity={40} style={styles.section}>
            <Text style={styles.sectionTitle}>Send Connection Request</Text>
            <Text style={styles.sectionDescription}>
              Enter a username to send them a connection request
            </Text>
            <UsernameInput
              onValidUsername={handleSendConnectionRequest}
              isLoading={isLoading}
              placeholder="Enter username to connect"
            />
          </BlurView>

          {/* Pending Requests Section */}
          <BlurView intensity={40} style={styles.section}>
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
          </BlurView>

          {/* Footer */}
          <BlurView intensity={20} style={styles.footer}>
            <Text style={styles.footerText}>
              You can only have one active connection at a time.{'\n'}
              Accept a request to start chatting!
            </Text>
          </BlurView>
        </ScrollView>
        
        {/* Connection Animation Overlay */}
        {showConnectionAnimation && (
          <View style={styles.animationOverlay}>
            <BlurView intensity={50} style={styles.animationContainer}>
              <LottieView
                source={require('../../assets/animations/connection.json')}
                autoPlay
                loop={false}
                style={styles.connectionAnimation}
              />
              <Text style={styles.connectionText}>Connection Established!</Text>
              <Text style={styles.connectionSubtext}>Redirecting to chat...</Text>
            </BlurView>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A8E6FF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 20,
    lineHeight: 18,
    fontWeight: '400',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  footerText: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 15,
    fontWeight: '400',
  },
  animationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  animationContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  connectionAnimation: {
    width: 100,
    height: 60,
    marginBottom: 20,
  },
  connectionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  connectionSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ConnectionScreen;