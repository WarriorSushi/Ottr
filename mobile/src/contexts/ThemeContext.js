import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Beautiful color schemes
export const lightTheme = {
  // Base colors
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9',
  
  // Text colors
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  
  // Primary colors (Crystal Aqua inspired)
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primaryDark: '#1d4ed8',
  
  // Accent colors
  accent: '#8b5cf6',
  accentLight: '#a78bfa',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  
  // Chat specific
  myMessageBg: ['#3b82f6', '#8b5cf6'],
  otherMessageBg: ['#6b7280', '#4b5563'],
  inputBg: '#ffffff',
  inputBorder: '#e2e8f0',
  
  // Navigation & Headers
  headerBg: ['#1e293b', '#0f172a'],
  headerText: '#ffffff',
  
  // Borders & Dividers
  border: '#e2e8f0',
  divider: '#f1f5f9',
  
  // Shadows
  shadow: '#000000',
  shadowOpacity: 0.1,
  
  // Special effects
  blurTint: 'rgba(255,255,255,0.9)',
  glassBg: 'rgba(255,255,255,0.15)',
  sectionBg: '#f1f5f9', // Light grey for sections in light mode
};

export const darkTheme = {
  // Base colors
  background: '#0f172a',
  surface: '#1e293b',
  surfaceSecondary: '#334155',
  
  // Text colors
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  
  // Primary colors (adjusted for dark mode)
  primary: '#60a5fa',
  primaryLight: '#93c5fd',
  primaryDark: '#3b82f6',
  
  // Accent colors
  accent: '#a78bfa',
  accentLight: '#c4b5fd',
  
  // Status colors
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#22d3ee',
  
  // Chat specific
  myMessageBg: ['#3b82f6', '#8b5cf6'],
  otherMessageBg: ['#475569', '#374151'],
  inputBg: '#334155',
  inputBorder: '#475569',
  
  // Navigation & Headers
  headerBg: ['#1e293b', '#0f172a'],
  headerText: '#f8fafc',
  
  // Borders & Dividers
  border: '#475569',
  divider: '#334155',
  
  // Shadows
  shadow: '#000000',
  shadowOpacity: 0.3,
  
  // Special effects
  blurTint: 'rgba(30,41,59,0.9)',
  glassBg: 'rgba(30,41,59,0.3)',
  sectionBg: '#334155', // Darker grey for sections in dark mode
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Prevent updates during unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme !== null && isMountedRef.current) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const toggleTheme = async () => {
    if (!isMountedRef.current) return;
    
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      
      // Use setTimeout to avoid synchronous updates during render
      setTimeout(async () => {
        if (!isMountedRef.current) return;
        try {
          await AsyncStorage.setItem('theme_preference', newTheme ? 'dark' : 'light');
        } catch (error) {
          console.error('Error saving theme preference:', error);
        }
      }, 0);
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value = {
    theme,
    isDark,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;