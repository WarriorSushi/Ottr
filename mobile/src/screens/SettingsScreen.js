import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch,
  ScrollView,
  StatusBar,
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useWallpaper, wallpapers } from '../contexts/WallpaperContext';

const SettingsScreen = ({ visible, onClose, onDisconnect, otherUser }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { currentWallpaper, setWallpaper, getCurrentWallpaper } = useWallpaper();

  const handleThemeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleTheme();
  };

  const handleWallpaperSelect = (wallpaperId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWallpaper(wallpaperId);
  };

  const handleDisconnect = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    Alert.alert(
      'End Connection',
      `Are you sure you want to disconnect from ${otherUser?.username || 'your chat partner'}? This will end your current conversation.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Disconnect cancelled')
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            console.log('🔴 User confirmed disconnect');
            onDisconnect();
          }
        }
      ]
    );
  };

  if (!visible) {
    console.log('⚠️ SettingsScreen not visible');
    return null;
  }
  
  console.log('📱 SettingsScreen rendering');

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Backdrop - tap to close */}
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      
      {/* Settings Panel */}
      <SafeAreaView style={[styles.settingsPanel, { backgroundColor: theme.surface }]} edges={['top', 'right', 'bottom']}>
        <LinearGradient
          colors={theme.headerBg}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.headerText }]}>
              Settings
            </Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: theme.headerText }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Theme Section */}
          <BlurView intensity={20} style={[styles.section, { backgroundColor: theme.glassBg }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Appearance
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={[styles.settingIcon, { color: theme.primary }]}>
                  {isDark ? '🌙' : '☀️'}
                </Text>
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    Dark Mode
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                    {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={handleThemeToggle}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={isDark ? theme.primaryLight : theme.surface}
                ios_backgroundColor={theme.border}
              />
            </View>
          </BlurView>

          {/* Wallpaper Section */}
          <BlurView intensity={20} style={[styles.section, { backgroundColor: theme.glassBg }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Chat Wallpaper
            </Text>
            
            <View style={styles.wallpaperGrid}>
              {Object.values(wallpapers).map((wallpaper) => {
                const isSelected = getCurrentWallpaper(isDark).id === wallpaper.id;
                return (
                  <TouchableOpacity
                    key={wallpaper.id}
                    style={[
                      styles.wallpaperButton,
                      { borderColor: isSelected ? theme.primary : theme.border },
                      isSelected && { borderWidth: 3 }
                    ]}
                    onPress={() => handleWallpaperSelect(wallpaper.id)}
                  >
                    <Image
                      source={wallpaper.image}
                      style={styles.wallpaperPreview}
                      resizeMode="cover"
                    />
                    {isSelected && (
                      <View style={[styles.selectedOverlay, { backgroundColor: theme.primary }]}>
                        <Text style={styles.selectedIcon}>✓</Text>
                      </View>
                    )}
                    <Text style={[styles.wallpaperName, { color: theme.text }]} numberOfLines={1}>
                      {wallpaper.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BlurView>

          {/* Chat Info Section */}
          <BlurView intensity={20} style={[styles.section, { backgroundColor: theme.glassBg }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Current Chat
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={[styles.settingIcon, { color: theme.accent }]}>👤</Text>
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    Connected with
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                    {otherUser?.username || 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={[styles.settingIcon, { color: theme.info }]}>📱</Text>
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    Connection Status
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.success }]}>
                    Connected & Active
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>

          {/* About Section */}
          <BlurView intensity={20} style={[styles.section, { backgroundColor: theme.glassBg }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              About OTTR
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={[styles.settingIcon, { color: theme.primary }]}>ℹ️</Text>
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    Version
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                    1.0.0
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>

          {/* Danger Zone */}
          <BlurView intensity={20} style={[styles.section, { backgroundColor: theme.glassBg }]}>
            <Text style={[styles.sectionTitle, { color: theme.error }]}>
              Danger Zone
            </Text>
            
            <TouchableOpacity 
              style={[styles.dangerButton, { borderColor: theme.error }]}
              onPress={handleDisconnect}
            >
              <LinearGradient
                colors={[theme.error, '#dc2626']}
                style={styles.dangerButtonGradient}
              >
                <Text style={styles.dangerButtonIcon}>⚠️</Text>
                <View style={styles.dangerButtonTextContainer}>
                  <Text style={styles.dangerButtonText}>End Connection</Text>
                  <Text style={styles.dangerButtonSubtext}>
                    This will disconnect you from {otherUser?.username || 'your chat partner'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>

          {/* Bottom spacing */}
          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
  },
  settingsPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '85%',
    maxWidth: 350,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
  },
  dangerButton: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dangerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  dangerButtonIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  dangerButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  dangerButtonTextContainer: {
    flex: 1,
    flexShrink: 1,
  },
  wallpaperGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  wallpaperButton: {
    width: (Dimensions.get('window').width - 120) / 3, // 3 columns with margins
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  wallpaperPreview: {
    width: '100%',
    height: 80,
    borderRadius: 11,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIcon: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  wallpaperName: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
});

export default SettingsScreen;