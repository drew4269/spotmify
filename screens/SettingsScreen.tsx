import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { clearPlayStats } from '../utils/playStats';

export const SettingsScreen: React.FC = () => {
  const { colors, theme, toggleTheme } = useTheme();
  const { playerState, setVolume } = useMusicPlayer();

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive' },
      ]
    );
  };

  const handleClearStats = () => {
    Alert.alert(
      'Clear Play Statistics',
      'This will clear all your play history and statistics. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Stats', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearPlayStats();
              Alert.alert('Success', 'Play statistics have been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear play statistics.');
            }
          }
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Spotmify',
      'Spotmify v1.0.0\n\nA personal music streaming app built with React Native and Expo.\n\nFeatures:\n• Local music playback\n• Dark/Light theme\n• Search functionality\n• Playlist support\n• Offline access\n• Play statistics tracking\n• Album artwork display',
      [{ text: 'OK' }]
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          <Ionicons name={icon as any} size={20} color={colors.secondary} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightComponent && <View style={styles.settingRight}>{rightComponent}</View>}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Appearance
        </Text>
        {renderSettingItem(
          'moon',
          'Dark Mode',
          'Switch between light and dark themes',
          undefined,
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.secondary}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Playback
        </Text>
        {renderSettingItem(
          'volume-high',
          'Volume',
          `${Math.round(playerState.volume * 100)}%`,
          undefined,
          <View style={styles.volumeContainer}>
            <TouchableOpacity
              onPress={() => setVolume(Math.max(0, playerState.volume - 0.1))}
              style={styles.volumeButton}
            >
              <Ionicons name="remove" size={16} color={colors.text} />
            </TouchableOpacity>
            <View style={[styles.volumeBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.volumeFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${playerState.volume * 100}%`,
                  },
                ]}
              />
            </View>
            <TouchableOpacity
              onPress={() => setVolume(Math.min(1, playerState.volume + 0.1))}
              style={styles.volumeButton}
            >
              <Ionicons name="add" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Data & Storage
        </Text>
        {renderSettingItem(
          'trash',
          'Clear Cache',
          'Free up storage space',
          handleClearCache
        )}
        {renderSettingItem(
          'stats-chart',
          'Clear Play Statistics',
          'Reset your listening history and stats',
          handleClearStats
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          About
        </Text>
        {renderSettingItem(
          'information-circle',
          'About Spotmify',
          'Version 1.0.0',
          handleAbout
        )}
        {renderSettingItem(
          'heart',
          'Made with ❤️',
          'Built with React Native & Expo'
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Spotmify - Your Personal Music Player
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  settingRight: {
    marginLeft: 12,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 