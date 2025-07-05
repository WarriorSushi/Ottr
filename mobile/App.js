import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Alert, AppRegistry, Animated } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import ConnectionScreen from './src/screens/ConnectionScreen';
import ChatScreen from './src/screens/ChatScreen';
import StorageService from './src/services/StorageService';
import SocketService from './src/services/SocketService';
import ApiService from './src/services/ApiService';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

function AppContent() {
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentConnection, setCurrentConnection] = useState(null);
  const [initialMessages, setInitialMessages] = useState([]);
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Connecting you to your OTTR");
  const fadeAnim = new Animated.Value(1); // Start visible instead of 0

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
    console.log('🎭 Splash completed, isLoading:', isLoading);
    if (!isLoading) {
      setShowSplash(false);
    }
  };

  const initializeApp = async () => {
    try {
      const userData = await StorageService.getUserData();
      
      if (userData) {
        setCurrentUser(userData);
        
        // Connect to socket and wait for connection (async, non-blocking)
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
        
        // Load connection data in background without blocking UI
        ApiService.getCurrentConnection(userData.id)
          .then(connectionData => {
            if (connectionData.connection) {
              setCurrentConnection(connectionData.connection);
              setInitialMessages(connectionData.recent_messages || []);
            }
          })
          .catch(error => {
            console.error('Error loading connection data:', error);
          });
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      // Don't show alert during initialization for better UX
    }
  };

  const handleUserRegistered = async (user, connection) => {
    try {
      console.log('🎬 handleUserRegistered called - Starting beautiful loading animation');
      
      // Show beautiful loading animation
      setLoadingText("Connecting you to your OTTR");
      console.log('🔄 Setting isLoading to true, loadingText:', "Connecting you to your OTTR");
      setIsLoading(true);
      setShowSplash(true);
      
      setCurrentUser(user);
      
      // Connect to socket (async, non-blocking)
      SocketService.connect();
      
      // Set up a listener to join user room once connected
      const handleConnection = () => {
        SocketService.joinUser({
          userId: user.id,
          username: user.username
        });
        SocketService.off('connection_status', handleConnection);
        
        // Transition to next screen after connection
        setTimeout(() => {
          setIsLoading(false);
          setShowSplash(false);
        }, 1500);
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
        setTimeout(() => {
          setIsLoading(false);
          setShowSplash(false);
        }, 1500);
      }
      
      if (connection) {
        setCurrentConnection(connection);
        setInitialMessages([]);
      }
      
    } catch (error) {
      console.error('Error in handleUserRegistered:', error);
      setIsLoading(false);
      setShowSplash(false);
      Alert.alert('Error', 'Failed to process user registration. Please try again.');
    }
  };

  const handleConnectionEstablished = (connection, messages = []) => {
    // Show loading animation for connection establishment
    setLoadingText("Opening your chat");
    setIsLoading(true);
    setShowSplash(true);
    
    setCurrentConnection(connection);
    setInitialMessages(messages);
    
    // Smooth transition to chat
    setTimeout(() => {
      setIsLoading(false);
      setShowSplash(false);
    }, 1200);
  };

  const handleDisconnect = async () => {
    try {
      console.log('🔌 handleDisconnect called');
      console.log('   - BEFORE: currentUser:', currentUser?.username || 'NULL');
      console.log('   - BEFORE: currentConnection:', currentConnection?.id || 'NULL');
      
      // Clear connection state
      setCurrentConnection(null);
      setInitialMessages([]);
      
      console.log('   - AFTER: Connection should be null, user should remain');
      console.log('✅ handleDisconnect completed');
      
    } catch (error) {
      console.error('Error in handleDisconnect:', error);
      setCurrentConnection(null);
      setInitialMessages([]);
    }
  };

  const getCurrentScreen = () => {
    console.log('🔍 getCurrentScreen DEBUG:');
    console.log('   - currentUser:', currentUser ? `${currentUser.username} (id: ${currentUser.id})` : 'NULL');
    console.log('   - currentConnection:', currentConnection ? `id: ${currentConnection.id}` : 'NULL');
    console.log('   - showSplash:', showSplash);
    
    if (!currentUser) {
      console.log('🔄 RENDERING: WelcomeScreen (no user)');
      return (
        <WelcomeScreen onUserRegistered={handleUserRegistered} />
      );
    }
    
    if (!currentConnection) {
      console.log('🔄 RENDERING: ConnectionScreen for user:', currentUser.username);
      return (
        <ConnectionScreen 
          key={`connection-${currentUser.id}`}
          user={currentUser}
          onConnectionEstablished={handleConnectionEstablished}
        />
      );
    }
    
    console.log('🔄 RENDERING: ChatScreen for connection:', currentConnection.id);
    return (
      <ChatScreen
        key={`chat-${currentConnection.id}`}
        user={currentUser}
        connection={currentConnection}
        initialMessages={initialMessages}
        onDisconnect={handleDisconnect}
      />
    );
  };

  if (showSplash) {
    console.log('🎭 RENDERING: SplashScreen (isLoading:', isLoading, ')');
    return (
      <SplashScreen 
        onSplashComplete={handleSplashComplete} 
        isLoading={isLoading}
        loadingText={loadingText}
      />
    );
  }

  console.log('🎨 RENDERING: Main App Container');
  const screenToRender = getCurrentScreen();
  console.log('🎯 Screen component to render:', screenToRender?.type?.name || 'Unknown');

  // Fallback safety check
  if (!screenToRender) {
    console.log('🚨 NO SCREEN TO RENDER - Using ConnectionScreen fallback');
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
        <View style={styles.screenContainer}>
          <ConnectionScreen 
            user={currentUser || { id: 'fallback', username: 'User' }}
            onConnectionEstablished={handleConnectionEstablished}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <View style={styles.screenContainer}>
        {screenToRender}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

// Register the app component
AppRegistry.registerComponent('main', () => App);