import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Image, Dimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import UsernameInput from '../components/UsernameInput';
import ApiService from '../services/ApiService';
import StorageService from '../services/StorageService';

const WelcomeScreen = ({ onUserRegistered }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleUsernameSubmit = async (username) => {
    setIsLoading(true);
    console.log('🚀 WelcomeScreen: Starting username submission for:', username);
    
    try {
      const usernameCheck = await ApiService.checkUsername(username);
      
      if (usernameCheck.exists) {
        const loginResult = await ApiService.login(username);
        
        await StorageService.setUserData({
          id: loginResult.user.id,
          username: loginResult.user.username,
          created_at: loginResult.user.created_at
        });
        
        console.log('🎯 WelcomeScreen: Calling onUserRegistered for existing user');
        onUserRegistered(loginResult.user, loginResult.currentConnection);
      } else {
        const registerResult = await ApiService.register(username);
        
        await StorageService.setUserData({
          id: registerResult.user.id,
          username: registerResult.user.username,
          created_at: registerResult.user.created_at
        });
        
        console.log('🎯 WelcomeScreen: Calling onUserRegistered for new user');
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
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" translucent={false} />
        
        {/* Modern Light Background */}
        <LinearGradient
          colors={['#f8fafc', '#e2e8f0']}
          start={[0, 0]}
          end={[1, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.content}>
              <View style={styles.header}>
                {/* Modern Logo Section */}
                <View style={styles.logoSection}>
                  <View style={styles.logoWrapper}>
                    <Image 
                      source={require('../../assets/images/logo-main.png')}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.logoGlow} />
                </View>
                
                {/* Modern Welcome Text */}
                <View style={styles.welcomeSection}>
                  <Text style={styles.mainTitle}>Welcome to</Text>
                  <LinearGradient
                    colors={['#3b82f6', '#8b5cf6']}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={styles.brandContainer}
                  >
                    <Text style={styles.brandTitle}>OTTR</Text>
                  </LinearGradient>
                  <Text style={styles.tagline}>
                    One-to-One Exclusive Messaging
                  </Text>
                  <Text style={styles.description}>
                    Connect with exactly one person at a time for meaningful conversations
                  </Text>
                </View>
              </View>
              
              <View style={styles.form}>
                <View style={styles.modernFormContainer}>
                  <View style={styles.inputSection}>
                    <Text style={styles.inputTitle}>Get Started</Text>
                    <Text style={styles.inputSubtitle}>Create or sign in to your account</Text>
                    
                    <UsernameInput
                      onValidUsername={handleUsernameSubmit}
                      isLoading={isLoading}
                      placeholder="Enter your username"
                    />
                  </View>
                  
                  <View style={styles.infoSection}>
                    <View style={styles.infoItem}>
                      <View style={styles.infoDot} />
                      <Text style={styles.infoText}>
                        Username exists? You&apos;ll be signed in instantly
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <View style={styles.infoDot} />
                      <Text style={styles.infoText}>
                        New username? Your account will be created automatically
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  logo: {
    width: 60,
    height: 60,
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    top: -10,
    left: -10,
    zIndex: -1,
  },
  welcomeSection: {
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '400',
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  brandContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
    maxWidth: 300,
  },
  form: {
    marginBottom: 32,
  },
  modernFormContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputSection: {
    marginBottom: 32,
  },
  inputTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  inputSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '400',
  },
  infoSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    marginRight: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
    lineHeight: 18,
    fontWeight: '400',
  },
});

export default WelcomeScreen;