import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Image, Dimensions, Animated } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

const SplashScreen = ({ onSplashComplete, isLoading = false, loadingText = "Connecting you to your OTTR" }) => {
  const logoScale = new Animated.Value(isLoading ? 0.5 : 0.3);
  const logoOpacity = new Animated.Value(0);
  const textOpacity = new Animated.Value(0);
  const logoZoom = new Animated.Value(1);
  const loadingTextOpacity = new Animated.Value(0);
  const pulseScale = new Animated.Value(1);

  useEffect(() => {
    console.log('SplashScreen useEffect triggered, isLoading:', isLoading);
    
    if (isLoading) {
      // Reset all values first
      logoOpacity.setValue(0);
      logoScale.setValue(0.5);
      textOpacity.setValue(0);
      loadingTextOpacity.setValue(0);
      logoZoom.setValue(1);
      pulseScale.setValue(1);
      
      // Beautiful loading animation sequence
      const loadingSequence = Animated.sequence([
        // 1. Logo appears and scales up
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        // 2. Brand text appears
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        // 3. Loading text appears
        Animated.timing(loadingTextOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        // 4. Dramatic zoom effect
        Animated.timing(logoZoom, {
          toValue: 4,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]);

      // Start the sequence
      loadingSequence.start();

      // Continuous pulse effect during loading
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        loadingSequence.stop();
        pulseAnimation.stop();
      };
    } else {
      // Reset all values for normal splash
      logoOpacity.setValue(0);
      logoScale.setValue(0.3);
      textOpacity.setValue(0);
      loadingTextOpacity.setValue(0);
      logoZoom.setValue(1);
      pulseScale.setValue(1);
      
      // Normal splash animation
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-complete splash after 3 seconds
      const timer = setTimeout(() => {
        onSplashComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#A8E6FF" translucent={false} />
        
        {/* Crystal Aqua Background */}
        <LinearGradient
          colors={['#A8E6FF', '#4DD3F4', '#A8E6FF']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View style={styles.content}>
          {/* Logo with Dynamic Animation */}
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                transform: [
                  { scale: logoScale },
                  { scaleX: logoZoom },
                  { scaleY: logoZoom }
                ],
                opacity: logoOpacity,
              }
            ]}
          >
            <Animated.View
              style={{
                transform: [{ scale: pulseScale }]
              }}
            >
              <BlurView intensity={30} style={styles.logoBlur}>
                <Image 
                  source={require('../../assets/images/logo-main.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </BlurView>
            </Animated.View>
          </Animated.View>
          
          {/* App Name and Tagline */}
          <Animated.View 
            style={[
              styles.textContainer,
              { opacity: textOpacity }
            ]}
          >
            <BlurView intensity={20} style={styles.textBlur}>
              <Text style={styles.appName}>OTTR</Text>
              <Text style={styles.tagline}>One-to-One Exclusive Messaging</Text>
            </BlurView>
          </Animated.View>

          {/* Loading Text */}
          {isLoading && (
            <Animated.View 
              style={[
                styles.loadingTextContainer,
                { opacity: loadingTextOpacity }
              ]}
            >
              <BlurView intensity={25} style={styles.loadingTextBlur}>
                <Text style={styles.loadingText}>{loadingText}</Text>
                <View style={styles.loadingDots}>
                  <Animated.Text style={[styles.dot, { opacity: pulseScale }]}>●</Animated.Text>
                  <Animated.Text style={[styles.dot, { opacity: pulseScale }]}>●</Animated.Text>
                  <Animated.Text style={[styles.dot, { opacity: pulseScale }]}>●</Animated.Text>
                </View>
              </BlurView>
            </Animated.View>
          )}
          
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    borderRadius: 120,
    overflow: 'hidden',
    marginBottom: 40,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  logoBlur: {
    padding: 30,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  logo: {
    width: 140,
    height: 140,
  },
  textContainer: {
    marginBottom: 60,
  },
  textBlur: {
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1E1E1E',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  loadingTextContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingTextBlur: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 25,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  loadingText: {
    fontSize: 16,
    color: '#1E1E1E',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 15,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    fontSize: 20,
    color: '#4DD3F4',
    marginHorizontal: 3,
    fontWeight: 'bold',
  },
});

export default SplashScreen;