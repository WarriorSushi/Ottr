import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import UsernameInput from '../components/UsernameInput';
import ApiService from '../services/ApiService';
import StorageService from '../services/StorageService';

const WelcomeScreen = ({ onUserRegistered }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleUsernameSubmit = async (username) => {
    setIsLoading(true);
    
    try {
      const usernameCheck = await ApiService.checkUsername(username);
      
      if (usernameCheck.exists) {
        const loginResult = await ApiService.login(username);
        
        await StorageService.setUserData({
          id: loginResult.user.id,
          username: loginResult.user.username,
          created_at: loginResult.user.created_at
        });
        
        onUserRegistered(loginResult.user, loginResult.currentConnection);
      } else {
        const registerResult = await ApiService.register(username);
        
        await StorageService.setUserData({
          id: registerResult.user.id,
          username: registerResult.user.username,
          created_at: registerResult.user.created_at
        });
        
        onUserRegistered(registerResult.user, null);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Failed to process username. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to OTTR</Text>
            <Text style={styles.subtitle}>
              One-to-One Real-time messaging
            </Text>
            <Text style={styles.description}>
              Connect with exactly one person at a time for exclusive conversations
            </Text>
          </View>
          
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Choose your username</Text>
            <UsernameInput
              onValidUsername={handleUsernameSubmit}
              isLoading={isLoading}
              placeholder="Enter your username"
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              If the username exists, you'll be logged in.{'\n'}
              If it's new, an account will be created for you.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 40,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default WelcomeScreen;