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
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#A8E6FF" translucent={false} />
        
        {/* Crystal Aqua Background */}
        <LinearGradient
          colors={['#A8E6FF', '#4DD3F4', '#A8E6FF']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.content}>
              <View style={styles.header}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                  <BlurView intensity={30} style={styles.logoBlur}>
                    <Image 
                      source={require('../../assets/images/logo-main.png')}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </BlurView>
                </View>
                
                {/* Welcome Text */}
                <BlurView intensity={20} style={styles.titleContainer}>
                  <Text style={styles.title}>Welcome to OTTR</Text>
                  <Text style={styles.subtitle}>
                    One-to-One Exclusive Messaging
                  </Text>
                  <Text style={styles.description}>
                    Connect with exactly one person at a time for exclusive conversations
                  </Text>
                </BlurView>
              </View>
              
              <View style={styles.form}>
                <BlurView intensity={40} style={styles.formContainer}>
                  <Text style={styles.inputLabel}>Choose your username</Text>
                  <UsernameInput
                    onValidUsername={handleUsernameSubmit}
                    isLoading={isLoading}
                    placeholder="Enter your username"
                  />
                  
                  <View style={styles.footer}>
                    <Text style={styles.footerText}>
                      If the username exists, you&apos;ll be logged in.{'\n'}
                      If it&apos;s new, an account will be created for you.
                    </Text>
                  </View>
                </BlurView>
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
    backgroundColor: '#A8E6FF',
  },
  keyboardContainer: {
    flex: 1,
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
  logoContainer: {
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logoBlur: {
    padding: 20,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  logo: {
    width: 120,
    height: 120,
  },
  titleContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 25,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '400',
  },
  form: {
    marginBottom: 30,
  },
  formContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 30,
    paddingHorizontal: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 15,
    fontWeight: '400',
  },
});

export default WelcomeScreen;