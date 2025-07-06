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
import Svg, { Path, Circle, Polyline, Rect, G } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
          <View style={[styles.section, { backgroundColor: theme.sectionBg }]}>
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
          </View>

          {/* Wallpaper Section */}
          <View style={[styles.section, { backgroundColor: theme.sectionBg }]}>
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
          </View>

          {/* Chat Info Section */}
          <View style={[styles.section, { backgroundColor: theme.sectionBg }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Current Chat
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Svg width="24" height="24" viewBox="0 0 1024 1024">
                    <Path d="M512 661.3c-117.6 0-213.3-95.7-213.3-213.3S394.4 234.7 512 234.7 725.3 330.4 725.3 448 629.6 661.3 512 661.3z m0-341.3c-70.6 0-128 57.4-128 128s57.4 128 128 128 128-57.4 128-128-57.4-128-128-128z" fill="#5F6379" />
                    <Path d="M837 862.9c-15.7 0-30.8-8.7-38.2-23.7C744.3 729.5 634.4 661.3 512 661.3s-232.3 68.1-286.8 177.9c-10.5 21.1-36.1 29.7-57.2 19.2s-29.7-36.1-19.2-57.2C217.8 662.3 357 576 512 576s294.2 86.3 363.2 225.2c10.5 21.1 1.9 46.7-19.2 57.2-6.1 3-12.6 4.5-19 4.5z" fill="#5F6379" />
                    <Path d="M512 1002.7c-270.6 0-490.7-220.1-490.7-490.7S241.4 21.3 512 21.3s490.7 220.1 490.7 490.7-220.1 490.7-490.7 490.7z m0-896c-223.5 0-405.3 181.8-405.3 405.3S288.5 917.3 512 917.3 917.3 735.5 917.3 512 735.5 106.7 512 106.7z" fill="#3688FF" />
                  </Svg>
                </View>
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
                <View style={styles.settingIcon}>
                  <Svg width="24" height="24" viewBox="0 0 48 48">
                    <G id="Electrocardiogram">
                      <Rect id="矩形" fillOpacity="0.01" fill="#FFFFFF" x="0" y="0" width="48" height="48" />
                      <Circle id="椭圆形" stroke={theme.info} strokeWidth="4" fill="#2F88FF" fillRule="nonzero" strokeLinejoin="round" cx="24" cy="24" r="20" />
                      <Polyline id="路径-16" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points="11 28.1320956 16.6844708 28.1320956 21.2233858 13 24.8952638 35 29.4483373 24.6175277 32.9127137 28.1320956 37 28.1320956" />
                    </G>
                  </Svg>
                </View>
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
          </View>

          {/* About Section */}
          <View style={[styles.section, { backgroundColor: theme.sectionBg }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              About OTTR
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Svg width="24" height="24" viewBox="0 0 60 60">
                    <Path d="M30,0A30,30,0,1,1,0,30,30,30,0,0,1,30,0ZM30,48a4,4,0,0,1-4-4V28a4,4,0,0,1,8,0V44A4,4,0,0,1,30,48Zm0-36a4,4,0,1,1-4,4A4,4,0,0,1,30,12Z" fill={theme.primary} fillRule="evenodd"/>
                  </Svg>
                </View>
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
          </View>

          {/* Danger Zone */}
          <View style={[styles.section, { backgroundColor: theme.sectionBg }]}>
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
          </View>

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