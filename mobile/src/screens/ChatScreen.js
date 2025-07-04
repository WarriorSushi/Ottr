import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  Modal 
} from 'react-native';
import MessageBubble from '../components/MessageBubble';
import SocketService from '../services/SocketService';
import ApiService from '../services/ApiService';
import StorageService from '../services/StorageService';

const ChatScreen = ({ user, connection, initialMessages = [], onDisconnect }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [otherUserOnline, setOtherUserOnline] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const flatListRef = useRef();
  const typingTimeoutRef = useRef();

  const otherUser = connection.user1_id === user.id 
    ? { id: connection.user2_id, username: connection.user2_username }
    : { id: connection.user1_id, username: connection.user1_username };

  useEffect(() => {
    setupSocketListeners();
    
    return () => {
      SocketService.off('message_received', handleNewMessage);
      SocketService.off('typing_indicator', handleTypingIndicator);
      SocketService.off('connection_disconnected', handleConnectionDisconnected);
      SocketService.off('user_status_changed', handleUserStatusChanged);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const setupSocketListeners = () => {
    SocketService.on('message_received', handleNewMessage);
    SocketService.on('typing_indicator', handleTypingIndicator);
    SocketService.on('connection_disconnected', handleConnectionDisconnected);
    SocketService.on('user_status_changed', handleUserStatusChanged);
  };

  const handleNewMessage = (message) => {
    if (message.connection_id === connection.id) {
      setMessages(prev => [...prev, message]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleTypingIndicator = (data) => {
    if (data.userId !== user.id) {
      setOtherUserTyping(data.typing);
    }
  };

  const handleConnectionDisconnected = (data) => {
    console.log('Connection disconnected event received:', data);
    setIsConnected(false);
    Alert.alert(
      'Connection Ended',
      data.message || 'Your connection has been ended',
      [
        {
          text: 'OK',
          onPress: () => {
            console.log('User pressed OK, calling onDisconnect');
            onDisconnect();
          }
        }
      ]
    );
  };

  const handleUserStatusChanged = (data) => {
    if (data.userId === otherUser.id) {
      setOtherUserOnline(data.online);
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() || !isConnected) return;

    const messageData = {
      connectionId: connection.id,
      senderId: user.id,
      content: inputText.trim()
    };

    const success = SocketService.sendMessage(messageData);
    
    if (success) {
      setInputText('');
      handleStopTyping();
    } else {
      Alert.alert('Error', 'Failed to send message. Please check your connection.');
    }
  };

  const handleInputChange = (text) => {
    setInputText(text);
    
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      SocketService.startTyping(connection.id);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      SocketService.stopTyping(connection.id);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to end this connection? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.disconnectConnection(connection.id, user.id);
              SocketService.disconnectConnection({
                connectionId: connection.id,
                userId: user.id
              });
              onDisconnect();
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.sender_id === user.id;
    const showUsername = !isOwnMessage && 
      (index === 0 || messages[index - 1].sender_id !== item.sender_id);
    
    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showUsername={showUsername}
      />
    );
  };

  const getConnectionStatus = () => {
    if (!isConnected) return 'Disconnected';
    if (!otherUserOnline) return 'Offline';
    if (otherUserTyping) return 'Typing...';
    return 'Online';
  };

  const getStatusColor = () => {
    if (!isConnected) return '#dc3545';
    if (!otherUserOnline) return '#6c757d';
    if (otherUserTyping) return '#28a745';
    return '#28a745';
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{otherUser.username}</Text>
          <Text style={[styles.headerStatus, { color: getStatusColor() }]}>
            {getConnectionStatus()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettingsModal(true)}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `${item.id || index}`}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={handleInputChange}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
          editable={isConnected}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || !isConnected) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || !isConnected}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settings</Text>
            
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={() => {
                setShowSettingsModal(false);
                handleDisconnect();
              }}
            >
              <Text style={styles.disconnectButtonText}>End Connection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  settingsButtonText: {
    fontSize: 20,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    backgroundColor: 'white',
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  disconnectButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  disconnectButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ChatScreen;