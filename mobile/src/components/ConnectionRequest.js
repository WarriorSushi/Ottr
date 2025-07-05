import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';

const ConnectionRequest = ({ request, onAccept, onReject, isProcessing = false }) => {
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
    <BlurView intensity={30} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.username}>{request.from_username}</Text>
        <Text style={styles.timestamp}>{formatTime(request.created_at)}</Text>
      </View>
      
      <Text style={styles.message}>wants to connect with you</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isProcessing && styles.buttonDisabled]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onReject(request.id);
          }}
          disabled={isProcessing}
        >
          <View style={styles.rejectButton}>
            {isProcessing ? (
              <View style={styles.loadingContainer}>
                <LottieView
                  source={require('../../assets/animations/loading.json')}
                  autoPlay
                  loop
                  style={styles.loadingAnimation}
                />
                <Text style={[styles.buttonText, styles.rejectButtonText]}>
                  Processing...
                </Text>
              </View>
            ) : (
              <Text style={[styles.buttonText, styles.rejectButtonText]}>
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
            colors={isProcessing ? ['#ccc', '#aaa'] : ['#F8B647', '#E89E34']}
            style={styles.acceptButton}
          >
            {isProcessing ? (
              <View style={styles.loadingContainer}>
                <LottieView
                  source={require('../../assets/animations/loading.json')}
                  autoPlay
                  loop
                  style={styles.loadingAnimation}
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
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  timestamp: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  message: {
    fontSize: 13,
    color: '#333333',
    marginBottom: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  acceptButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(139,74,39,0.5)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButtonText: {
    color: '#1E1E1E',
  },
  rejectButtonText: {
    color: '#8B4A27',
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