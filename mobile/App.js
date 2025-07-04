import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Alert, AppRegistry } from 'react-native';
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

  useEffect(() => {
    initializeApp();
  }, []);

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

  const handleUserRegistered = (user, connection) => {
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
    }
  };

  const handleConnectionEstablished = (connection, messages = []) => {
    setCurrentConnection(connection);
    setInitialMessages(messages);
  };

  const handleDisconnect = async () => {
    console.log('handleDisconnect called - clearing connection');
    setCurrentConnection(null);
    setInitialMessages([]);
    
    // Don't check for new connections - just go back to Connection screen
    console.log('User should now see Connection screen');
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {/* You could add a loading spinner here */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {getCurrentScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Register the app component
AppRegistry.registerComponent('main', () => App);