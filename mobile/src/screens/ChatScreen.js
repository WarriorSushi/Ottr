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
  Modal,
  Dimensions,
  StatusBar,
  Keyboard
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import MessageBubble from '../components/MessageBubble';
import SocketService from '../services/SocketService';
import ApiService from '../services/ApiService';
import { CommunicationAnimations } from '../utils/LottieLibrary';

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
    setupKeyboardListeners();
    
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

  // Auto-scroll to top (latest message) when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // For inverted list, scroll to top shows latest message
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 50);
    }
  }, [messages.length]);

  const setupSocketListeners = () => {
    SocketService.on('message_received', handleNewMessage);
    SocketService.on('typing_indicator', handleTypingIndicator);
    SocketService.on('connection_disconnected', handleConnectionDisconnected);
    SocketService.on('user_status_changed', handleUserStatusChanged);
  };

  const setupKeyboardListeners = () => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // Auto-scroll when keyboard opens
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Auto-scroll when keyboard closes
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    });
    
    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  };



  const handleNewMessage = (message) => {
    if (message.connection_id === connection.id) {
      // Check for duplicates before adding
      setMessages(prev => {
        const isDuplicate = prev.some(msg => 
          msg.id === message.id || 
          (msg.content === message.content && 
           msg.sender_id === message.sender_id && 
           Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 1000)
        );
        
        if (isDuplicate) {
          return prev;
        }
        
        return [...prev, message];
      });
      
      // Auto-scroll to top (latest message) for inverted list
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 50);
    }
  };

  const handleTypingIndicator = (data) => {
    if (data.userId !== user.id) {
      setOtherUserTyping(data.typing);
    }
  };

  const handleConnectionDisconnected = (data) => {
    setIsConnected(false);
    Alert.alert(
      'Connection Ended',
      data.message || 'Your connection has been ended',
      [
        {
          text: 'OK',
          onPress: onDisconnect
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
      // Clear input immediately for better UX
      setInputText('');
      handleStopTyping();
      
      // Don't add message locally - let it come back from server to prevent duplicates
      // Auto-scroll will happen when server message is received
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
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#1e293b" translucent={false} />
        
        {/* Chat Background Gradient */}
        <LinearGradient
          colors={['#f8fafc', '#e2e8f0']}
          start={[0, 0]}
          end={[1, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.header}
        >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>{otherUser.username}</Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                  <Text style={styles.headerStatus}>
                    {getConnectionStatus()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setShowSettingsModal(true)}
              >
                <View style={styles.settingsButtonBlur}>
                  <Text style={styles.settingsButtonText}>⚙️</Text>
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>

        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={[...messages].reverse()}
            renderItem={renderMessage}
            keyExtractor={(item, index) => `${item.id || index}`}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            inverted
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={() => (
              otherUserTyping ? (
                <View style={styles.typingIndicatorContainer}>
                  <View style={styles.typingBubble}>
                    <LottieView
                      {...CommunicationAnimations.typing()}
                    />
                    <Text style={styles.typingText}>{otherUser.username} is typing...</Text>
                  </View>
                </View>
              ) : null
            )}
          />

          {/* Input Container */}
          <SafeAreaView style={styles.inputContainer} edges={['bottom']}>
            <View style={styles.inputWrapper}>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={handleInputChange}
                    placeholder="Type a message..."
                    placeholderTextColor="#64748b"
                    multiline
                    maxLength={1000}
                    editable={isConnected}
                    onSubmitEditing={sendMessage}
                    returnKeyType="send"
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!inputText.trim() || !isConnected) && styles.sendButtonDisabled
                  ]}
                  onPress={sendMessage}
                  disabled={!inputText.trim() || !isConnected}
                >
                  <LinearGradient
                    colors={inputText.trim() && isConnected ? ['#3b82f6', '#8b5cf6'] : ['#ccc', '#aaa']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.sendButtonGradient}
                  >
                    <Text style={styles.sendButtonText}>✈</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
          </SafeAreaView>
        </KeyboardAvoidingView>

        {/* Glass Modal */}
        <Modal
          visible={showSettingsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSettingsModal(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Settings</Text>
                
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={() => {
                    setShowSettingsModal(false);
                    handleDisconnect();
                  }}
                >
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.disconnectButtonText}>End Connection</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowSettingsModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  chatContainer: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  headerStatus: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '400',
  },
  settingsButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingsButtonBlur: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  settingsButtonText: {
    fontSize: 18,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderRadius: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 80,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '400',
  },
  sendButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sendButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    minHeight: 50,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
    transform: [{ rotate: '360deg' }],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 320,
  },
  modalContent: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 25,
    color: '#1e293b',
  },
  disconnectButton: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 15,
  },
  typingIndicatorContainer: {
    marginVertical: 8,
    marginHorizontal: 20,
    alignItems: 'flex-start',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingAnimation: {
    width: 30,
    height: 12,
    marginRight: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
});

export default ChatScreen;