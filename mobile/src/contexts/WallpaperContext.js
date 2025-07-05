import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './ThemeContext';

const WallpaperContext = createContext();

export const useWallpaper = () => {
  const context = useContext(WallpaperContext);
  if (!context) {
    throw new Error('useWallpaper must be used within WallpaperProvider');
  }
  return context;
};

// Wallpaper definitions with beautiful names
export const wallpapers = {
  // Default wallpapers
  nimbusglow_light_defualt: {
    id: 'nimbusglow_light_defualt',
    name: 'Nimbusglow Light Default',
    image: require('../../assets/chatbg/nimbusglow_light_defualt.webp'),
    isDefault: true,
    theme: 'light'
  },
  obsidian_shade_dark_defualt: {
    id: 'obsidian_shade_dark_defualt', 
    name: 'Obsidian Shade Dark Default',
    image: require('../../assets/chatbg/obsidian_shade_dark_defualt.webp'),
    isDefault: true,
    theme: 'dark'
  },
  
  // Additional wallpapers
  aurora_fade: {
    id: 'aurora_fade',
    name: 'Aurora Fade',
    image: require('../../assets/chatbg/aurora_fade.webp'),
    isDefault: false
  },
  breathe_easy: {
    id: 'breathe_easy',
    name: 'Breathe Easy',
    image: require('../../assets/chatbg/breathe_easy.webp'),
    isDefault: false
  },
  calm_fog: {
    id: 'calm_fog',
    name: 'Calm Fog', 
    image: require('../../assets/chatbg/calm_fog.webp'),
    isDefault: false
  },
  cosmic_whisper: {
    id: 'cosmic_whisper',
    name: 'Cosmic Whisper',
    image: require('../../assets/chatbg/cosmic_whisper.webp'),
    isDefault: true,
    theme: 'dark'
  },
  night_grain: {
    id: 'night_grain',
    name: 'Night Grain',
    image: require('../../assets/chatbg/night_grain.webp'),
    isDefault: false
  },
  open_mind: {
    id: 'open_mind',
    name: 'Open Mind',
    image: require('../../assets/chatbg/open_mind.webp'),
    isDefault: false
  }
};

// Get default wallpaper for theme
export const getDefaultWallpaper = (isDark) => {
  return isDark ? wallpapers.cosmic_whisper : wallpapers.nimbusglow_light_defualt;
};

export const WallpaperProvider = ({ children }) => {
  const { isDark } = useTheme();
  const [currentWallpaper, setCurrentWallpaper] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userHasCustomWallpaper, setUserHasCustomWallpaper] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    loadWallpaperPreference();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-change wallpaper when theme changes (if user hasn't set custom wallpaper)
  useEffect(() => {
    if (!userHasCustomWallpaper && !isLoading) {
      console.log('🎨 Theme changed, auto-updating wallpaper to:', isDark ? 'Cosmic Whisper' : 'Nimbusglow Light Default');
      const defaultWallpaper = getDefaultWallpaper(isDark);
      setCurrentWallpaper(defaultWallpaper);
    }
  }, [isDark, userHasCustomWallpaper, isLoading]);

  const loadWallpaperPreference = async () => {
    try {
      const savedWallpaper = await AsyncStorage.getItem('wallpaper_preference');
      const hasCustomWallpaper = await AsyncStorage.getItem('has_custom_wallpaper');
      
      if (savedWallpaper && isMountedRef.current) {
        const wallpaperData = JSON.parse(savedWallpaper);
        setCurrentWallpaper(wallpaperData);
        setUserHasCustomWallpaper(hasCustomWallpaper === 'true');
      } else {
        // No saved wallpaper, use default
        setUserHasCustomWallpaper(false);
      }
    } catch (error) {
      console.error('Error loading wallpaper preference:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const setWallpaper = async (wallpaperId) => {
    if (!isMountedRef.current) return;
    
    try {
      const wallpaper = wallpapers[wallpaperId];
      if (!wallpaper) return;

      setCurrentWallpaper(wallpaper);
      setUserHasCustomWallpaper(true); // User manually selected wallpaper
      
      console.log('🖼️ User manually selected wallpaper:', wallpaper.name);
      
      // Save to AsyncStorage
      setTimeout(async () => {
        if (!isMountedRef.current) return;
        try {
          await AsyncStorage.setItem('wallpaper_preference', JSON.stringify(wallpaper));
          await AsyncStorage.setItem('has_custom_wallpaper', 'true');
        } catch (error) {
          console.error('Error saving wallpaper preference:', error);
        }
      }, 0);
    } catch (error) {
      console.error('Error setting wallpaper:', error);
    }
  };

  const getCurrentWallpaper = (isDark) => {
    // If user has selected a wallpaper, use it
    if (currentWallpaper) {
      return currentWallpaper;
    }
    // Otherwise use default for current theme
    return getDefaultWallpaper(isDark);
  };

  const resetToAutoWallpaper = async () => {
    try {
      setUserHasCustomWallpaper(false);
      setCurrentWallpaper(null);
      await AsyncStorage.removeItem('wallpaper_preference');
      await AsyncStorage.removeItem('has_custom_wallpaper');
      console.log('🔄 Reset to auto wallpaper mode');
    } catch (error) {
      console.error('Error resetting wallpaper:', error);
    }
  };

  const value = {
    wallpapers,
    currentWallpaper,
    setWallpaper,
    getCurrentWallpaper,
    resetToAutoWallpaper,
    userHasCustomWallpaper,
    isLoading,
  };

  return (
    <WallpaperContext.Provider value={value}>
      {children}
    </WallpaperContext.Provider>
  );
};

export default WallpaperContext;