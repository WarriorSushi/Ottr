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
  Dimensions,
  StatusBar,
  Keyboard,
  Animated,
  ImageBackground,
  Image
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import MessageBubble from '../components/MessageBubble';
import SettingsScreen from './SettingsScreen';
import SocketService from '../services/SocketService';
import ApiService from '../services/ApiService';
import { CommunicationAnimations } from '../utils/LottieLibrary';
import { useTheme } from '../contexts/ThemeContext';
import { useWallpaper } from '../contexts/WallpaperContext';

const ChatScreen = ({ user, connection, initialMessages = [], onDisconnect }) => {
  const { theme, isDark } = useTheme();
  const { getCurrentWallpaper } = useWallpaper();
  const [currentWallpaper, setCurrentWallpaper] = useState(getCurrentWallpaper(isDark));
  
  console.log('🖼️ ChatScreen wallpaper:', currentWallpaper?.name || 'No wallpaper');
  
  // Update wallpaper when theme changes
  useEffect(() => {
    const newWallpaper = getCurrentWallpaper(isDark);
    setCurrentWallpaper(newWallpaper);
    console.log('🎨 ChatScreen: Theme changed, updating wallpaper to:', newWallpaper?.name || 'No wallpaper');
  }, [isDark, getCurrentWallpaper]);
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [otherUserOnline, setOtherUserOnline] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // Pagination state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messageOffset, setMessageOffset] = useState(initialMessages.length);
  
  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const flatListRef = useRef();
  const typingTimeoutRef = useRef();
  const settingsSlideAnim = useRef(new Animated.Value(1)).current;
  const isMountedRef = useRef(true);

  const otherUser = connection.user1_id === user.id 
    ? { id: connection.user2_id, username: connection.user2_username }
    : { id: connection.user1_id, username: connection.user1_username };

  useEffect(() => {
    setupSocketListeners();
    setupKeyboardListeners();
    
    return () => {
      isMountedRef.current = false;
      SocketService.off('message_received', handleNewMessage);
      SocketService.off('typing_indicator', handleTypingIndicator);
      SocketService.off('connection_disconnected', handleConnectionDisconnected);
      SocketService.off('user_status_changed', handleUserStatusChanged);
      SocketService.off('message_reaction', handleIncomingReaction);
      SocketService.off('message_read', handleMessageRead);
      
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

  // Send read receipts for incoming messages
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const unreadMessages = messages.filter(msg => 
      msg.sender_id !== user.id && 
      (!msg.readByMe || msg.readByMe === false)
    );

    if (unreadMessages.length > 0) {
      // Mark messages as read and send read receipts
      unreadMessages.forEach(msg => {
        SocketService.sendReadReceipt({
          messageId: msg.id,
          connectionId: connection.id,
          userId: user.id
        });
      });

      // Update local state to mark as read
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg.sender_id !== user.id && (!msg.readByMe || msg.readByMe === false)) {
            return {
              ...msg,
              readByMe: true
            };
          }
          return msg;
        })
      );
    }
  }, [messages, user.id, connection.id]);

  const setupSocketListeners = () => {
    SocketService.on('message_received', handleNewMessage);
    SocketService.on('typing_indicator', handleTypingIndicator);
    SocketService.on('connection_disconnected', handleConnectionDisconnected);
    SocketService.on('user_status_changed', handleUserStatusChanged);
    SocketService.on('message_reaction', handleIncomingReaction);
    SocketService.on('message_read', handleMessageRead);
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

  // Load more messages for pagination
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || !isMountedRef.current) return;
    
    try {
      console.log('📚 Loading more messages, offset:', messageOffset);
      setIsLoadingMore(true);
      
      const response = await ApiService.getMessages(connection.id, 20, messageOffset);
      const olderMessages = response.messages || [];
      
      if (olderMessages.length === 0) {
        setHasMoreMessages(false);
        console.log('📚 No more messages to load');
        return;
      }
      
      // Add older messages to the beginning of the array
      setMessages(prevMessages => [...olderMessages, ...prevMessages]);
      setMessageOffset(prev => prev + olderMessages.length);
      
      console.log('📚 Loaded', olderMessages.length, 'more messages');
      
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  };

  const handleNewMessage = (message) => {
    if (!isMountedRef.current) return;
    
    if (message.connection_id === connection.id) {
      // Check for duplicates before adding
      setMessages(prev => {
        // Check if this is a server response to our temp message
        const tempMessageIndex = prev.findIndex(msg => 
          msg.id && msg.id.toString() === message.tempId
        );
        
        if (tempMessageIndex !== -1) {
          // Replace temp message with server message
          const newMessages = [...prev];
          newMessages[tempMessageIndex] = {
            ...message,
            status: 'sent' // Set initial status as sent
          };
          return newMessages;
        }
        
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
        if (isMountedRef.current) {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
      }, 50);
    }
  };

  const handleTypingIndicator = (data) => {
    if (!isMountedRef.current) return;
    
    if (data.userId !== user.id) {
      setOtherUserTyping(data.typing);
    }
  };

  const handleConnectionDisconnected = (data) => {
    if (!isMountedRef.current) return;
    
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
    if (!isMountedRef.current) return;
    
    if (data.userId === otherUser.id) {
      setOtherUserOnline(data.online);
    }
  };

  const handleIncomingReaction = (data) => {
    if (!isMountedRef.current) return;
    
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        if (msg.id === data.messageId) {
          if (data.action === 'remove') {
            // Remove reaction
            return {
              ...msg,
              reaction: null
            };
          } else {
            // Set new reaction
            return {
              ...msg,
              reaction: data.emoji
            };
          }
        }
        return msg;
      })
    );
  };


  const handleMessageRead = (data) => {
    if (!isMountedRef.current) return;
    
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        if (msg.id === data.messageId && msg.sender_id === user.id) {
          return {
            ...msg,
            status: 'read'
          };
        }
        return msg;
      })
    );
  };

  const sendMessage = () => {
    if (!inputText.trim() || !isConnected) return;

    const tempId = Date.now().toString();
    const messageData = {
      connectionId: connection.id,
      senderId: user.id,
      content: inputText.trim(),
      tempId: tempId
    };

    // Add temporary message with 'sending' status
    const tempMessage = {
      id: tempId,
      connection_id: connection.id,
      sender_id: user.id,
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, tempMessage]);

    const success = SocketService.sendMessage(messageData);
    
    if (success) {
      // Clear input immediately for better UX
      setInputText('');
      handleStopTyping();
      
      // Update temp message status to 'sent'
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => {
            if (msg.id === tempId) {
              return { ...msg, status: 'sent' };
            }
            return msg;
          })
        );
      }, 100);
      
      // Auto-scroll will happen when server message is received
    } else {
      // Remove temp message on failure
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
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

  const handleMessageReaction = (messageId, emoji) => {
    if (!isMountedRef.current) return;
    
    // Close emoji picker
    setShowEmojiPicker(false);
    setSelectedMessageId(null);
    
    // Update local state immediately for instant feedback
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        if (msg.id === messageId) {
          const currentReaction = msg.reaction; // Single reaction instead of array
          
          if (currentReaction === emoji) {
            // Remove reaction if same emoji clicked
            return {
              ...msg,
              reaction: null
            };
          } else {
            // Set new reaction (replace any existing)
            return {
              ...msg,
              reaction: emoji
            };
          }
        }
        return msg;
      })
    );

    // Send reaction to server via socket
    SocketService.sendReaction({
      messageId,
      emoji,
      connectionId: connection.id,
      userId: user.id
    });
  };

  const handleMessageLongPress = (messageId) => {
    setSelectedMessageId(messageId);
    setShowEmojiPicker(true);
  };

  const openSettings = () => {
    console.log('🎛️ Settings button pressed!');
    setShowSettings(true);
    Animated.timing(settingsSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      console.log('✅ Settings panel animation completed');
    });
  };

  const closeSettings = () => {
    Animated.timing(settingsSlideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowSettings(false);
    });
  };

  const handleDisconnect = async () => {
    try {
      console.log('💔 ChatScreen handleDisconnect called');
      
      // Immediately mark as unmounting and close settings
      isMountedRef.current = false;
      setShowSettings(false);
      
      // Disconnect from API and socket
      await ApiService.disconnectConnection(connection.id, user.id);
      SocketService.disconnectConnection({
        connectionId: connection.id,
        userId: user.id
      });
      
      // Call parent disconnect handler immediately
      onDisconnect();
      
    } catch (error) {
      console.error('Error in handleDisconnect:', error);
      onDisconnect();
    }
  };

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.sender_id === user.id;
    const reversedMessages = [...messages].reverse();
    
    // For inverted list, check the next message (which appears above this one)
    const nextMessage = index < reversedMessages.length - 1 ? reversedMessages[index + 1] : null;
    const isNextMessageFromSameSender = nextMessage && nextMessage.sender_id === item.sender_id;
    const extraSpacing = isNextMessageFromSameSender ? 0 : 1; // Double spacing for sender change
    
    const showUsername = !isOwnMessage && 
      (index === reversedMessages.length - 1 || !isNextMessageFromSameSender);
    
    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showUsername={showUsername}
        extraSpacing={extraSpacing}
        onReaction={handleMessageReaction}
        onLongPress={handleMessageLongPress}
        isSelected={selectedMessageId === item.id}
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

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent', // Let wallpaper show through
    },
    messagesList: {
      flex: 1,
      backgroundColor: 'transparent', // Let wallpaper show through
    },
    inputContainer: {
      backgroundColor: theme.surface,
      borderTopColor: theme.border,
    },
    textInput: {
      backgroundColor: theme.inputBg,
      borderColor: theme.inputBorder,
      color: theme.text,
    },
    typingBubble: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    typingText: {
      color: theme.textSecondary,
    },
  });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={dynamicStyles.container} edges={['top']}>
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor={theme.headerBg[0]} 
          translucent={false} 
        />
        
        {/* Chat Wallpaper Background */}
        <ImageBackground 
          source={currentWallpaper.image}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        
        {/* Header with Gradient */}
        <LinearGradient
          colors={theme.headerBg}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.header}
        >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={[styles.headerTitle, { color: theme.headerText }]}>{otherUser.username}</Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                  <Text style={[styles.headerStatus, { color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)' }]}>
                    {getConnectionStatus()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={openSettings}
              >
                <View style={[styles.settingsButtonBlur, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]}>
                  <Svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none"
                  >
                    <Path 
                      fillRule="evenodd" 
                      clipRule="evenodd" 
                      d="M14.2788 2.15224C13.9085 2 13.439 2 12.5 2C11.561 2 11.0915 2 10.7212 2.15224C10.2274 2.35523 9.83509 2.74458 9.63056 3.23463C9.53719 3.45834 9.50065 3.7185 9.48635 4.09799C9.46534 4.65568 9.17716 5.17189 8.69017 5.45093C8.20318 5.72996 7.60864 5.71954 7.11149 5.45876C6.77318 5.2813 6.52789 5.18262 6.28599 5.15102C5.75609 5.08178 5.22018 5.22429 4.79616 5.5472C4.47814 5.78938 4.24339 6.1929 3.7739 6.99993C3.30441 7.80697 3.06967 8.21048 3.01735 8.60491C2.94758 9.1308 3.09118 9.66266 3.41655 10.0835C3.56506 10.2756 3.77377 10.437 4.0977 10.639C4.57391 10.936 4.88032 11.4419 4.88029 12C4.88026 12.5581 4.57386 13.0639 4.0977 13.3608C3.77372 13.5629 3.56497 13.7244 3.41645 13.9165C3.09108 14.3373 2.94749 14.8691 3.01725 15.395C3.06957 15.7894 3.30432 16.193 3.7738 17C4.24329 17.807 4.47804 18.2106 4.79606 18.4527C5.22008 18.7756 5.75599 18.9181 6.28589 18.8489C6.52778 18.8173 6.77305 18.7186 7.11133 18.5412C7.60852 18.2804 8.2031 18.27 8.69012 18.549C9.17714 18.8281 9.46533 19.3443 9.48635 19.9021C9.50065 20.2815 9.53719 20.5417 9.63056 20.7654C9.83509 21.2554 10.2274 21.6448 10.7212 21.8478C11.0915 22 11.561 22 12.5 22C13.439 22 13.9085 22 14.2788 21.8478C14.7726 21.6448 15.1649 21.2554 15.3694 20.7654C15.4628 20.5417 15.4994 20.2815 15.5137 19.902C15.5347 19.3443 15.8228 18.8281 16.3098 18.549C16.7968 18.2699 17.3914 18.2804 17.8886 18.5412C18.2269 18.7186 18.4721 18.8172 18.714 18.8488C19.2439 18.9181 19.7798 18.7756 20.2038 18.4527C20.5219 18.2105 20.7566 17.807 21.2261 16.9999C21.6956 16.1929 21.9303 15.7894 21.9827 15.395C22.0524 14.8691 21.9088 14.3372 21.5835 13.9164C21.4349 13.7243 21.2262 13.5628 20.9022 13.3608C20.4261 13.0639 20.1197 12.558 20.1197 11.9999C20.1197 11.4418 20.4261 10.9361 20.9022 10.6392C21.2263 10.4371 21.435 10.2757 21.5836 10.0835C21.9089 9.66273 22.0525 9.13087 21.9828 8.60497C21.9304 8.21055 21.6957 7.80703 21.2262 7C20.7567 6.19297 20.522 5.78945 20.2039 5.54727C19.7799 5.22436 19.244 5.08185 18.7141 5.15109C18.4722 5.18269 18.2269 5.28136 17.8887 5.4588C17.3915 5.71959 16.7969 5.73002 16.3099 5.45096C15.8229 5.17191 15.5347 4.65566 15.5136 4.09794C15.4993 3.71848 15.4628 3.45833 15.3694 3.23463C15.1649 2.74458 14.7726 2.35523 14.2788 2.15224ZM12.5 15C14.1695 15 15.5228 13.6569 15.5228 12C15.5228 10.3431 14.1695 9 12.5 9C10.8305 9 9.47716 10.3431 9.47716 12C9.47716 13.6569 10.8305 15 12.5 15Z" 
                      fill={isDark ? "white" : "black"}
                    />
                  </Svg>
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
            keyExtractor={(item, index) => item.id ? `msg-${item.id}` : `temp-${item.timestamp}-${index}`}
            style={dynamicStyles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            inverted
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.1}
            refreshing={isLoadingMore}
            onRefresh={loadMoreMessages}
            ListHeaderComponent={() => (
              otherUserTyping ? (
                <View style={styles.typingIndicatorContainer}>
                  <View style={[styles.typingBubble, dynamicStyles.typingBubble]}>
                    <LottieView
                      {...CommunicationAnimations.typing()}
                    />
                    <Text style={[styles.typingText, dynamicStyles.typingText]}>{otherUser.username} is typing...</Text>
                  </View>
                </View>
              ) : null
            )}
            ListFooterComponent={() => (
              isLoadingMore && hasMoreMessages ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingBox}>
                    <Text style={styles.loadingText}>Loading</Text>
                  </View>
                </View>
              ) : null
            )}
          />

          {/* Input Container */}
          <SafeAreaView style={[styles.inputContainer, dynamicStyles.inputContainer]} edges={['bottom']}>
            <View style={styles.inputWrapper}>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={[styles.textInput, dynamicStyles.textInput]}
                    value={inputText}
                    onChangeText={handleInputChange}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.textMuted}
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
                    colors={inputText.trim() && isConnected ? ['#3B82F6', '#FF8A65'] : ['#000000', '#000000']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.sendButtonGradient}
                  >
                    <Svg 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none"
                      style={{ transform: [{ rotate: '-90deg' }] }}
                    >
                      <Path 
                        d="M9.51002 4.23001L18.07 8.51001C21.91 10.43 21.91 13.57 18.07 15.49L9.51002 19.77C3.75002 22.65 1.40002 20.29 4.28002 14.54L5.15002 12.81C5.37002 12.37 5.37002 11.64 5.15002 11.2L4.28002 9.46001C1.40002 3.71001 3.76002 1.35001 9.51002 4.23001Z" 
                        stroke="white" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                      <Path 
                        d="M5.44 12H10.84" 
                        stroke="white" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
          </SafeAreaView>
        </KeyboardAvoidingView>

        {/* Global Emoji Picker */}
        {showEmojiPicker && (
          <View style={styles.globalEmojiPickerOverlay}>
            <TouchableOpacity 
              style={styles.globalEmojiPickerBackdrop}
              onPress={() => {
                setShowEmojiPicker(false);
                setSelectedMessageId(null);
              }}
              activeOpacity={1}
            />
            <View style={styles.globalEmojiPicker}>
              {['❤️', '😂', '👍', '😍', '😢'].map((emoji, index) => {
                const selectedMessage = messages.find(msg => msg.id === selectedMessageId);
                const isSelected = selectedMessage?.reaction === emoji;
                
                return (
                  <TouchableOpacity 
                    key={index}
                    style={[
                      styles.globalEmojiButton,
                      isSelected && styles.globalEmojiButtonSelected
                    ]}
                    onPress={() => {
                      console.log('Global emoji pressed:', emoji);
                      if (selectedMessageId) {
                        handleMessageReaction(selectedMessageId, emoji);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.globalEmojiText}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity 
                style={styles.globalEmojiButton}
                onPress={() => {
                  setShowEmojiPicker(false);
                  setSelectedMessageId(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.globalEmojiText, { color: '#666' }]}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Sliding Settings Screen */}
        {showSettings && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              transform: [{ translateX: Animated.multiply(settingsSlideAnim, Dimensions.get('window').width) }],
            }}
          >
            <SettingsScreen
              visible={showSettings}
              onClose={closeSettings}
              onDisconnect={handleDisconnect}
              otherUser={otherUser}
            />
          </Animated.View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
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
    fontWeight: '400',
  },
  settingsButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingsButtonBlur: {
    padding: 8,
    borderRadius: 16,
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
    marginHorizontal: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 25,
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 80,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '400',
    borderRadius: 25,
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
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingBox: {
    backgroundColor: '#fffff0', // Ivory color
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  loadingText: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
  globalEmojiPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  globalEmojiPickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  globalEmojiPicker: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    gap: 6,
  },
  globalEmojiButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  globalEmojiButtonSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  globalEmojiText: {
    fontSize: 18,
    textAlign: 'center',
  },
});

export default ChatScreen;