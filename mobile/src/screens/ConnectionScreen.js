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
import { StateAnimations, FeedbackAnimations } from '../utils/LottieLibrary';
import { useTheme } from '../contexts/ThemeContext';

const ConnectionScreen = ({ user, onConnectionEstablished }) => {
  console.log('🔌 ConnectionScreen RENDERING for user:', user?.username || 'NULL USER');
  const { theme, isDark } = useTheme();
  console.log('🎨 ConnectionScreen theme loaded:', isDark ? 'dark' : 'light');
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
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} translucent={false} />
        
        {/* Dark Background */}
        <LinearGradient
          colors={[theme.background, theme.surfaceSecondary, theme.background]}
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
              title={refreshing ? 'Refreshing...' : 'Pull to refresh'}
              titleColor="#1E1E1E"
            />
          }
        >
          {/* Header with Logo and Welcome */}
          <View style={[styles.header, { backgroundColor: theme.surface }]}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/logo-main.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Hello, {user.username}!</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Ready to connect?</Text>
          </View>

          {/* Send Connection Request Section */}
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Send Connection Request</Text>
            <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
              Enter a username to send them a connection request
            </Text>
            <UsernameInput
              onValidUsername={handleSendConnectionRequest}
              isLoading={isLoading}
              placeholder="Enter username to connect"
            />
          </View>

          {/* Pending Requests Section */}
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Pending Requests ({connectionRequests.length})
            </Text>
            
            {connectionRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <LottieView
                  {...StateAnimations.empty()}
                />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  No pending connection requests
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.textMuted }]}>
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

          {/* Footer */}
          <View style={[styles.footer, { backgroundColor: theme.surfaceSecondary }]}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              You can only have one active connection at a time.{'\n'}
              Accept a request to start chatting!
            </Text>
          </View>
        </ScrollView>
        
        {/* Connection Animation Overlay */}
        {showConnectionAnimation && (
          <View style={styles.animationOverlay}>
            <View style={[styles.animationContainer, { backgroundColor: theme.surface }]}>
              <LottieView
                {...FeedbackAnimations.celebration()}
                style={styles.celebrationAnimation}
              />
              <LottieView
                {...FeedbackAnimations.connection()}
              />
              <Text style={[styles.connectionText, { color: theme.text }]}>Connection Established!</Text>
              <Text style={[styles.connectionSubtext, { color: theme.textSecondary }]}>Redirecting to chat...</Text>
            </View>
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
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  header: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 16,
    fontWeight: '400',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateAnimation: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  footer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
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
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  celebrationAnimation: {
    position: 'absolute',
    width: 200,
    height: 200,
    top: -50,
    left: -50,
  },
  connectionAnimation: {
    width: 100,
    height: 60,
    marginBottom: 20,
  },
  connectionText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  connectionSubtext: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ConnectionScreen;