import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { formatDuration } from '../utils/musicScanner';
import { useNavigation } from '@react-navigation/native';
import { getCoverPhoto } from '../utils/coverPhoto';
import { useCoverPhotoUpdate } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const MiniPlayerComponent: React.FC = () => {
  const { colors } = useTheme();
  const { playerState, playSong, pauseSong, resumeSong, skipToNext, skipToPrevious } = useMusicPlayer();
  const navigation = useNavigation<any>();
  const [coverUri, setCoverUri] = useState<string | undefined>(undefined);
  const { lastUpdate } = useCoverPhotoUpdate();

  useEffect(() => {
    if (playerState.currentSong) {
      getCoverPhoto(playerState.currentSong).then(setCoverUri);
    }
  }, [playerState.currentSong, lastUpdate]);

  if (!playerState.currentSong) {
    return null;
  }

  const handlePlayPause = () => {
    if (playerState.isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };

  const handleOpenDetails = () => {
    navigation.navigate('SongDetails', { song: playerState.currentSong });
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      activeOpacity={0.9}
      onPress={handleOpenDetails}
    >
      <View style={styles.content}>
        <View style={styles.songInfo}>
          <View style={styles.artworkContainer}>
            {coverUri ? (
              <Image
                source={{ uri: coverUri }}
                style={styles.artwork}
              />
            ) : (
              <View style={[styles.artworkPlaceholder, { backgroundColor: colors.primary }]}>
                <Ionicons name="musical-note" size={16} color={colors.secondary} />
              </View>
            )}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {playerState.currentSong.title}
            </Text>
            <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
              {playerState.currentSong.artist}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={skipToPrevious}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.primary }]}
            onPress={handlePlayPause}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={playerState.isPlaying ? 'pause' : 'play'}
              size={20}
              color={colors.secondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={skipToNext}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      {playerState.duration > 0 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${(playerState.position / playerState.duration) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20, // Account for safe area
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  songInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  artworkContainer: {
    marginRight: 12,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  artworkPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  progressBar: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
});

export const MiniPlayer = React.memo(MiniPlayerComponent); 