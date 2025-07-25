import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { format } from 'date-fns';

const LockscreenPlayer = () => {
  const { colors } = useTheme();
  const { playerState, togglePlayback, skipToNext, skipToPrevious, seekTo } = useMusicPlayer();
  const insets = useSafeAreaInsets();
  const { currentSong, isPlaying, position, duration } = playerState;
  const progress = position;  // Using position as progress

  if (!currentSong) return null;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} />
      <View style={[styles.content, { marginTop: insets.top }]}>
        <View style={styles.timeContainer}>
          <Text style={styles.time}>2:47</Text>
          <Text style={styles.date}>Wed 22</Text>
        </View>

        <View style={styles.artworkContainer}>
          {currentSong.coverUri ? (
            <Image source={{ uri: currentSong.coverUri }} style={styles.artwork} />
          ) : (
            <View style={[styles.artwork, { backgroundColor: '#282828' }]}>
              <Ionicons name="musical-notes" size={40} color={colors.primary} />
            </View>
          )}
        </View>

        <View style={styles.songInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {currentSong.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={currentSong.duration}
            value={progress}
            minimumTrackTintColor="#FFF"
            maximumTrackTintColor="rgba(255,255,255,0.3)"
            thumbTintColor="#FFF"
          />
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(progress)}</Text>
            <Text style={styles.timeText}>-{formatTime(currentSong.duration - progress)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity>
            <Ionicons name="play-skip-back" size={32} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="play-skip-forward" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.bottomButton}>
            <Ionicons name="flashlight-outline" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton}>
            <Text style={styles.doNotDisturb}>Do Not Disturb</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton}>
            <Ionicons name="camera-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  leftControls: {
    width: 80,
  },
  centerInfo: {
    alignItems: 'center',
  },
  time: {
    fontSize: 82,
    fontWeight: '300',
    color: '#FFF',
    letterSpacing: -2,
  },
  date: {
    fontSize: 20,
    color: '#FFF',
    opacity: 0.8,
  },
  rightControls: {
    width: 80,
    alignItems: 'flex-end',
  },
  battery: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    color: '#FFF',
    marginRight: 4,
  },
  artworkContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  artwork: {
    width: 280,
    height: 280,
    borderRadius: 8,
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  artist: {
    fontSize: 18,
    color: '#FFF',
    opacity: 0.8,
  },
  progressContainer: {
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  timeText: {
    color: '#FFF',
    opacity: 0.8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    marginBottom: 40,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  bottomButton: {
    alignItems: 'center',
  },
  doNotDisturb: {
    color: '#FFF',
    fontSize: 16,
  },
});

export default LockscreenPlayer;
