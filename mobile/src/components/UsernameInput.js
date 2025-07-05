import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { LoadingAnimations } from '../utils/LottieLibrary';

const UsernameInput = ({ onValidUsername, isLoading = false, placeholder = "Enter username" }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const validateUsername = (text) => {
    setUsername(text);
    setError('');

    if (text.length === 0) {
      return;
    }

    if (text.length < 3) {
      setError('Username must be at least 3 characters');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (text.length > 20) {
      setError('Username must be 20 characters or less');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(text)) {
      setError('Username can only contain letters, numbers, and underscores');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
  };

  const handleSubmit = () => {
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (username.length > 20) {
      setError('Username must be 20 characters or less');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onValidUsername(username.trim());
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={username}
        onChangeText={validateUsername}
        placeholder={placeholder}
        placeholderTextColor="rgba(51,51,51,0.6)"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
        editable={!isLoading}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      
      {username.length >= 3 && !error && (
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? ['#ccc', '#aaa'] : ['#3b82f6', '#8b5cf6']}
            style={styles.submitButtonGradient}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <LottieView
                  {...LoadingAnimations.small()}
                />
                <Text style={styles.submitButtonText}>Checking...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}
      
      <Text style={styles.helperText}>
        Username must be 3-20 characters using only letters, numbers, and underscores
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 0,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    color: '#1e293b',
    fontWeight: '500',
    elevation: 0,
    shadowColor: 'transparent',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    elevation: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingAnimation: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  helperText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '400',
  },
});

export default UsernameInput;