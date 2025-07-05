import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { LoadingAnimations, CommunicationAnimations } from '../utils/LottieLibrary';
import { useTheme } from '../contexts/ThemeContext';

const MessageBubble = ({ message, isOwnMessage, showUsername = false }) => {
  const { theme, isDark } = useTheme();
  
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
        <LinearGradient
          colors={theme.myMessageBg}
          start={[0, 0]}
          end={[1, 1]}
          style={[styles.bubble, styles.ownMessageBubble, { borderWidth: 1, borderColor: theme.myMessageBorder }]}
        >
          {/* Removed sender name for cleaner look */}
          
          <Text style={[styles.messageText, { color: isDark ? '#ffffff' : '#000000' }]}>
            {message.content}
          </Text>
          
          <View style={styles.timestampContainer}>
            <Text style={[styles.timestamp, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)' }]}>
              {formatTime(message.timestamp)}
            </Text>
            {isOwnMessage && (
              <View style={styles.deliveryStatus}>
                {message.status === 'sending' && (
                  <LottieView
                    {...LoadingAnimations.small()}
                  />
                )}
                {message.status === 'sent' && (
                  <LottieView
                    {...CommunicationAnimations.sent()}
                  />
                )}
                {message.status === 'delivered' && (
                  <LottieView
                    {...CommunicationAnimations.delivered()}
                  />
                )}
              </View>
            )}
          </View>
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={theme.otherMessageBg}
          start={[0, 0]}
          end={[1, 1]}
          style={[styles.bubble, styles.otherMessageBubble]}
        >
          {/* Removed sender name for cleaner look */}
          
          <Text style={[styles.messageText, { color: isDark ? '#ffffff' : '#000000' }]}>
            {message.content}
          </Text>
          
          <Text style={[styles.timestamp, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)' }]}>
            {formatTime(message.timestamp)}
          </Text>
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2, // Reduced from 4 for tighter spacing
    marginHorizontal: 12, // Reduced from 20 for tighter spacing
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%', // Reduced from 85% for tighter bubbles
    borderRadius: 16, // Reduced from 18 for tighter look
    overflow: 'hidden',
    elevation: 3, // Reduced shadow for cleaner look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, // Reduced shadow opacity
    shadowRadius: 2, // Reduced shadow radius
    paddingHorizontal: 12, // Reduced from 16 for tighter padding
    paddingVertical: 8, // Reduced from 10 for tighter padding
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
    lineHeight: 18, // Reduced from 20 for tighter text
    marginBottom: 2, // Reduced from 4 for tighter spacing
    fontWeight: '400',
  },
  ownMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#ffffff',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '400',
  },
  deliveryStatus: {
    marginLeft: 6,
  },
  statusAnimation: {
    width: 12,
    height: 12,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default MessageBubble;