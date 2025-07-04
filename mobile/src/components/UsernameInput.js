import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

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
      return;
    }

    if (text.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(text)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }
  };

  const handleSubmit = () => {
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    onValidUsername(username.trim());
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={username}
        onChangeText={validateUsername}
        placeholder={placeholder}
        placeholderTextColor="#999"
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
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Checking...' : 'Continue'}
          </Text>
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
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    color: '#6c757d',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default UsernameInput;