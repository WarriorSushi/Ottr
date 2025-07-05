import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Alert, AppRegistry, Animated } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import ConnectionScreen from './src/screens/ConnectionScreen';
import ChatScreen from './src/screens/ChatScreen';
import StorageService from './src/services/StorageService';
import SocketService from './src/services/SocketService';
import ApiService from './src/services/ApiService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentConnection, setCurrentConnection] = useState(null);
  const [initialMessages, setInitialMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (!showSplash) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showSplash]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const initializeApp = async () => {
    try {
      const userData = await StorageService.getUserData();
      
      if (userData) {
        setCurrentUser(userData);
        
        // Connect to socket and wait for connection
        SocketService.connect();
        
        // Set up a listener to join user room once connected
        const handleConnection = () => {
          SocketService.joinUser({
            userId: userData.id,
            username: userData.username
          });
          SocketService.off('connection_status', handleConnection);
        };
        
        SocketService.on('connection_status', (status) => {
          if (status.connected) {
            handleConnection();
          }
        });
        
        // If already connected, join immediately
        if (SocketService.getConnectionStatus().connected) {
          SocketService.joinUser({
            userId: userData.id,
            username: userData.username
          });
        }
        
        const connectionData = await ApiService.getCurrentConnection(userData.id);
        if (connectionData.connection) {
          setCurrentConnection(connectionData.connection);
          setInitialMessages(connectionData.recent_messages || []);
        }
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'Failed to initialize app. Please restart.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserRegistered = async (user, connection) => {
    try {
      console.log('handleUserRegistered called');
      setIsLoading(true);
      
      setCurrentUser(user);
      
      // Connect to socket and wait for connection
      SocketService.connect();
      
      // Set up a listener to join user room once connected
      const handleConnection = () => {
        SocketService.joinUser({
          userId: user.id,
          username: user.username
        });
        SocketService.off('connection_status', handleConnection);
      };
      
      SocketService.on('connection_status', (status) => {
        if (status.connected) {
          handleConnection();
        }
      });
      
      // If already connected, join immediately
      if (SocketService.getConnectionStatus().connected) {
        SocketService.joinUser({
          userId: user.id,
          username: user.username
        });
      }
      
      if (connection) {
        setCurrentConnection(connection);
        setInitialMessages([]);
      }
      
      // Small delay to ensure state updates are processed
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
      
    } catch (error) {
      console.error('Error in handleUserRegistered:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to process user registration. Please try again.');
    }
  };

  const handleConnectionEstablished = (connection, messages = []) => {
    setCurrentConnection(connection);
    setInitialMessages(messages);
  };

  const handleDisconnect = async () => {
    try {
      console.log('handleDisconnect called');
      setIsLoading(true);
      
      setCurrentConnection(null);
      setInitialMessages([]);
      
      // Small delay to ensure clean transition
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
      
    } catch (error) {
      console.error('Error in handleDisconnect:', error);
      setIsLoading(false);
    }
  };

  const getCurrentScreen = () => {
    if (!currentUser) {
      return (
        <WelcomeScreen onUserRegistered={handleUserRegistered} />
      );
    }
    
    if (!currentConnection) {
      return (
        <ConnectionScreen 
          user={currentUser}
          onConnectionEstablished={handleConnectionEstablished}
        />
      );
    }
    
    return (
      <ChatScreen
        user={currentUser}
        connection={currentConnection}
        initialMessages={initialMessages}
        onDisconnect={handleDisconnect}
      />
    );
  };

  if (showSplash) {
    return <SplashScreen onSplashComplete={handleSplashComplete} />;
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
        {getCurrentScreen()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screenContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
});

// Register the app component
AppRegistry.registerComponent('main', () => App);