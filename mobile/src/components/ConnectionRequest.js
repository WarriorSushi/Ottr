import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { LoadingAnimations } from '../utils/LottieLibrary';
import { useTheme } from '../contexts/ThemeContext';

const ConnectionRequest = ({ request, onAccept, onReject, isProcessing = false }) => {
  const { theme } = useTheme();
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceSecondary }]}>
      <View style={styles.header}>
        <Text style={[styles.username, { color: theme.text }]}>{request.from_username}</Text>
        <Text style={[styles.timestamp, { color: theme.textMuted }]}>{formatTime(request.created_at)}</Text>
      </View>
      
      <Text style={[styles.message, { color: theme.textSecondary }]}>wants to connect with you</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isProcessing && styles.buttonDisabled]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onReject(request.id);
          }}
          disabled={isProcessing}
        >
          <View style={[styles.rejectButton, { backgroundColor: theme.surface, borderColor: theme.error }]}>
            {isProcessing ? (
              <View style={styles.loadingContainer}>
                <LottieView
                  {...LoadingAnimations.small()}
                />
                <Text style={[styles.buttonText, { color: theme.error }]}>
                  Processing...
                </Text>
              </View>
            ) : (
              <Text style={[styles.buttonText, { color: theme.error }]}>
                Decline
              </Text>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, isProcessing && styles.buttonDisabled]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAccept(request.id);
          }}
          disabled={isProcessing}
        >
          <LinearGradient
            colors={isProcessing ? [theme.border, theme.textMuted] : [theme.primary, theme.accent]}
            style={styles.acceptButton}
          >
            {isProcessing ? (
              <View style={styles.loadingContainer}>
                <LottieView
                  {...LoadingAnimations.small()}
                />
                <Text style={[styles.buttonText, styles.acceptButtonText]}>
                  Processing...
                </Text>
              </View>
            ) : (
              <Text style={[styles.buttonText, styles.acceptButtonText]}>
                Accept
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '400',
  },
  message: {
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '400',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  acceptButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  acceptButtonText: {
    color: '#ffffff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingAnimation: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
});

export default ConnectionRequest;