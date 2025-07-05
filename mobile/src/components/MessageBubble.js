import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const MessageBubble = ({ message, isOwnMessage, showUsername = false }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
    ]}>
      {isOwnMessage ? (
        <View style={[styles.bubble, styles.ownMessageBubble, { backgroundColor: '#F8B647' }]}>
          {showUsername && !isOwnMessage && (
            <Text style={styles.username}>{message.sender_username}</Text>
          )}
          
          <Text style={[styles.messageText, styles.ownMessageText]}>
            {message.content}
          </Text>
          
          <Text style={[styles.timestamp, styles.ownTimestamp]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      ) : (
        <View style={[styles.bubble, styles.otherMessageBubble, { backgroundColor: '#8B4A27' }]}>
          {showUsername && (
            <Text style={styles.username}>{message.sender_username}</Text>
          )}
          
          <Text style={[styles.messageText, styles.otherMessageText]}>
            {message.content}
          </Text>
          
          <Text style={[styles.timestamp, styles.otherTimestamp]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 20,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 6,
  },
  username: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 3,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    fontWeight: '400',
  },
  ownMessageText: {
    color: '#1E1E1E',
  },
  otherMessageText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 10,
    alignSelf: 'flex-end',
    fontWeight: '400',
  },
  ownTimestamp: {
    color: 'rgba(30, 30, 30, 0.7)',
  },
  otherTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default MessageBubble;