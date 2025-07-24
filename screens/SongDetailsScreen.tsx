import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, PanResponder, Animated, Slider } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, useCoverPhotoUpdate } from '../contexts/ThemeContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { Song } from '../types';
import { getCoverPhoto } from '../utils/coverPhoto';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as SystemUI from 'expo-system-ui';

const COVER_KEY_PREFIX = 'spotmify_cover_';

const ICON_SIZE = 28;

export const SongDetailsScreen = ({ route }: any) => {
  const { colors } = useTheme();
  const { notifyCoverUpdate } = useCoverPhotoUpdate();
  const { playerState, playSong, pauseSong, resumeSong, seekTo, stopSong } = useMusicPlayer();
  const navigation = useNavigation<any>();
  const song: Song = route.params.song;
  const isPlaying = playerState.currentSong?.id === song.id && playerState.isPlaying;
  const [coverUri, setCoverUri] = useState<string | undefined>(song.artwork);
  const [seeking, setSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const progressBarWidth = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCover();
  }, [song.id]);

  useEffect(() => {
    if (!seeking) setSeekPosition(playerState.position);
  }, [playerState.position, seeking]);

  // Real-time progress update
  useEffect(() => {
    if (!seeking && isPlaying) {
      intervalRef.current = setInterval(() => {
        setSeekPosition((prev) => {
          if (playerState.position !== prev) return playerState.position;
          return prev + 1000;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, seeking, playerState.position]);

  const loadCover = async () => {
    setCoverUri(await getCoverPhoto(song));
  };

  const handleSetCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      await AsyncStorage.setItem(COVER_KEY_PREFIX + song.id, result.assets[0].uri);
      setCoverUri(result.assets[0].uri);
      notifyCoverUpdate();
      Alert.alert('Cover Updated', 'The cover photo has been updated for this song.');
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) pauseSong();
    else playSong(song);
    Haptics.selectionAsync();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleBookmark = () => {
    setBookmarked((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePower = () => {
    stopSong();
    navigation.goBack();
  };

  const handleMore = () => {
    Alert.alert('More', 'More options coming soon!');
  };

  const handleVolume = () => {
    // Open system volume UI (Android only, iOS not supported)
    SystemUI.setBackgroundColorAsync('#000');
    Alert.alert('Volume', 'Use your device volume buttons.');
  };

  // Progress bar logic
  const duration = playerState.duration || 1;
  const progress = seeking ? seekPosition / duration : playerState.position / duration;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.nowPlaying, { color: colors.text }]}>Now Playing</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Album Art */}
      <TouchableOpacity style={styles.coverContainer} onPress={handleSetCover} activeOpacity={0.8}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.coverArt} />
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: colors.card }]}> 
            <Ionicons name="image" size={64} color={colors.textSecondary} />
          </View>
        )}
      </TouchableOpacity>

      {/* Song Title & Artist */}
      <View style={styles.songInfo}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{song.title}</Text>
        <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>{song.artist}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(seeking ? seekPosition : playerState.position)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={seeking ? seekPosition : playerState.position}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          onValueChange={setSeekPosition}
          onSlidingStart={() => setSeeking(true)}
          onSlidingComplete={(value) => {
            seekTo(value);
            setSeeking(false);
          }}
        />
        <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(duration)}</Text>
      </View>

      {/* Playback Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={() => seekTo(Math.max(0, playerState.position - 10000))}>
          <Ionicons name="play-skip-back" size={ICON_SIZE} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseButton}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={36} color={'#111'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => seekTo(Math.min(duration, playerState.position + 10000))}>
          <Ionicons name="play-skip-forward" size={ICON_SIZE} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Extra Controls */}
      <View style={styles.extraControlsRow}>
        <TouchableOpacity onPress={handleVolume} style={styles.extraControl}>
          <Feather name="volume-2" size={ICON_SIZE} color={colors.textSecondary} />
          <Text style={[styles.extraLabel, { color: colors.textSecondary }]}>Volume</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleBookmark} style={styles.extraControl}>
          <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={ICON_SIZE} color={bookmarked ? colors.primary : colors.textSecondary} />
          <Text style={[styles.extraLabel, { color: colors.textSecondary }]}>Bookmark</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePower} style={styles.extraControl}>
          <Feather name="power" size={ICON_SIZE} color={colors.textSecondary} />
          <Text style={[styles.extraLabel, { color: colors.textSecondary }]}>Power</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleMore} style={styles.extraControl}>
          <Feather name="more-horizontal" size={ICON_SIZE} color={colors.textSecondary} />
          <Text style={[styles.extraLabel, { color: colors.textSecondary }]}>More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
    paddingTop: 40,
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  nowPlaying: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  coverContainer: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverArt: {
    width: 220,
    height: 220,
    borderRadius: 16,
    backgroundColor: '#222',
  },
  coverPlaceholder: {
    width: 220,
    height: 220,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  artist: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%',
    alignSelf: 'center',
    marginBottom: 16,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  timeText: {
    fontSize: 13,
    width: 40,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 32,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1ED760',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    shadowColor: '#1ED760',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  extraControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '90%',
    marginTop: 8,
  },
  extraControl: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  extraLabel: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
}); 