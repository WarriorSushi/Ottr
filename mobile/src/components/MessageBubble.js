import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { LoadingAnimations, CommunicationAnimations } from '../utils/LottieLibrary';
import { useTheme } from '../contexts/ThemeContext';

const MessageBubble = ({ message, isOwnMessage, showUsername = false, extraSpacing = 0, onReaction, onLongPress, isSelected = false }) => {
  const { theme, isDark } = useTheme();
  
  const formatTime = (timestamp) => {
    // Use the actual message timestamp when it was sent
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onLongPress) {
      onLongPress(message.id);
    }
  };

  const handleReaction = (emoji) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onReaction) {
      onReaction(message.id, emoji);
    }
  };

  const renderReaction = () => {
    if (!message.reaction) return null;
    
    return (
      <View style={[styles.reactionContainer, isOwnMessage ? styles.reactionRight : styles.reactionLeft]}>
        <TouchableOpacity 
          style={[styles.reactionBubble, { backgroundColor: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.9)' }]}
          onPress={() => handleReaction(message.reaction)}
        >
          <Text style={styles.reactionEmoji}>{message.reaction}</Text>
        </TouchableOpacity>
      </View>
    );
  };


  return (
    <>
      <View style={[
        styles.container,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        { marginTop: extraSpacing === 1 ? 8 : 2 }, // Quadruple spacing for sender change
        message.reaction && { marginBottom: 12 } // Extra margin when message has reaction
      ]}>
      {isOwnMessage ? (
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={500}
        >
          <LinearGradient
            colors={theme.myMessageBg}
            start={[0, 1]}
            end={[0, 0]}
            style={[
              styles.bubble, 
              styles.ownMessageBubble,
              isSelected && { opacity: 0.7, transform: [{ scale: 0.98 }] }
            ]}
          >
          <View style={styles.messageContent}>
            <Text style={[styles.messageText, { color: isDark ? '#ffffff' : '#000000' }]}>
              {message.content}
            </Text>
            
            {/* Time and status in bottom-right corner for outgoing messages */}
            <View style={styles.bottomRightContainer}>
              <Text style={[styles.timestampCorner, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)' }]}>
                {formatTime(message.timestamp)}
              </Text>
              {isOwnMessage && (
                <View style={styles.deliveryStatusInline}>
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
          </View>
          </LinearGradient>
          {renderReaction()}
        </Pressable>
      ) : (
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={500}
        >
          <LinearGradient
            colors={theme.otherMessageBg}
            start={[0, 1]}
            end={[1, 0]}
            style={[
              styles.bubble, 
              styles.otherMessageBubble,
              isSelected && { opacity: 0.7, transform: [{ scale: 0.98 }] }
            ]}
          >
          <View style={styles.messageContent}>
            <Text style={[styles.messageText, styles.incomingMessageText, { color: isDark ? '#ffffff' : '#000000' }]}>
              {message.content}
            </Text>
            
            {/* Time in bottom-right corner for incoming messages */}
            <View style={styles.bottomRightContainer}>
              <Text style={[styles.timestampCorner, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)' }]}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          </View>
          </LinearGradient>
          {renderReaction()}
        </Pressable>
      )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2, // Reduced from 4 for tighter spacing
    marginHorizontal: 12, // Reduced from 20 for tighter spacing
    zIndex: 1,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%', // Even tighter for compact design
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    paddingHorizontal: 10, // Tighter padding
    paddingVertical: 6, // Much tighter vertical padding
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
  messageContent: {
    position: 'relative',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400',
    paddingRight: 50, // Space for timestamp on the right
    marginBottom: 0, // Remove bottom margin
  },
  bottomRightContainer: {
    position: 'absolute',
    bottom: -2,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomLeftContainer: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestampCorner: {
    fontSize: 9, // Much smaller timestamp
    fontWeight: '400',
  },
  deliveryStatusInline: {
    marginLeft: 3,
  },
  incomingMessageText: {
    paddingRight: 35, // Space for timestamp on the right (no delivery status)
    paddingLeft: 0, // No left padding needed
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
  reactionContainer: {
    position: 'absolute',
    bottom: -8,
  },
  reactionLeft: {
    right: 8,
  },
  reactionRight: {
    right: 8,
  },
  reactionBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  reactionEmoji: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default MessageBubble;