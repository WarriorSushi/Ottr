import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.username}>{request.from_username}</Text>
        <Text style={styles.timestamp}>{formatTime(request.created_at)}</Text>
      </View>
      
      <Text style={styles.message}>wants to connect with you</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton, isProcessing && styles.buttonDisabled]}
          onPress={() => onReject(request.id)}
          disabled={isProcessing}
        >
          <Text style={[styles.buttonText, styles.rejectButtonText]}>
            {isProcessing ? 'Processing...' : 'Decline'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.acceptButton, isProcessing && styles.buttonDisabled]}
          onPress={() => onAccept(request.id)}
          disabled={isProcessing}
        >
          <Text style={[styles.buttonText, styles.acceptButtonText]}>
            {isProcessing ? 'Processing...' : 'Accept'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButtonText: {
    color: 'white',
  },
  rejectButtonText: {
    color: '#dc3545',
  },
});

export default ConnectionRequest;