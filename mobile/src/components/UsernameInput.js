import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';

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
            colors={isLoading ? ['#ccc', '#aaa'] : ['#F8B647', '#E89E34']}
            style={styles.submitButtonGradient}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <LottieView
                  source={require('../../assets/animations/loading.json')}
                  autoPlay
                  loop
                  style={styles.loadingAnimation}
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
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    marginBottom: 8,
    color: '#333333',
    fontWeight: '500',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputError: {
    borderColor: '#E89E34',
    backgroundColor: '#FFF8F0',
  },
  errorText: {
    color: '#E89E34',
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#1E1E1E',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingAnimation: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  helperText: {
    color: '#666666',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 15,
    fontWeight: '400',
  },
});

export default UsernameInput;