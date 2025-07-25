import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { formatDuration } from '../utils/musicScanner';
import { getSongStats, formatPlayCount, formatLastPlayed } from '../utils/playStats';
import { useNavigation } from '@react-navigation/native';
import { usePlaylists } from '../contexts/PlaylistsContext';
import { getCoverPhotoSync } from '../utils/coverPhoto';
import { Swipeable } from 'react-native-gesture-handler';

interface SongItemProps {
  song: Song;
  onPress?: () => void;
  showPlayButton?: boolean;
  showStats?: boolean;
  coverMap?: Record<string, string | undefined>;
}

const SongItemComponent: React.FC<SongItemProps> = ({
  song,
  onPress,
  showPlayButton = true,
  showStats = false,
  coverMap = {},
}) => {
  const { colors } = useTheme();
  const { playerState, playSong, pauseSong, resumeSong, addToQueue } = useMusicPlayer();
  const [stats, setStats] = useState<{ playCount: number; lastPlayed: Date } | null>(null);
  const [added, setAdded] = useState(false);
  const navigation = useNavigation<any>();
  const { playlists, addSong } = usePlaylists();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const handleAddToPlaylist = async (playlistId: string) => {
    await addSong(playlistId, song.id);
    setShowPlaylistModal(false);
    // Optionally show feedback
  };
  const swipeableRef = useRef<Swipeable>(null);
  const addedAnimation = useRef(new Animated.Value(0)).current;

  const isCurrentSong = playerState.currentSong?.id === song.id;
  const isPlaying = isCurrentSong && playerState.isPlaying;
  const progress = isCurrentSong && playerState.duration > 0 ? playerState.position / playerState.duration : 0;

  useEffect(() => {
    if (showStats) {
      loadStats();
    }
  }, [showStats, song.id]);

  // Force re-render when progress updates
  useEffect(() => {
    if (isCurrentSong) {
      // This will trigger re-render when progress changes
    }
  }, [playerState.position, playerState.duration, isCurrentSong]);

  const loadStats = async () => {
    const songStats = await getSongStats(song.id);
    if (songStats) {
      setStats({
        playCount: songStats.playCount,
        lastPlayed: songStats.lastPlayed,
      });
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('SongDetails', { song });
    }
  };

  const handlePlayPress = () => {
    if (isCurrentSong) {
      if (isPlaying) {
        pauseSong();
      } else {
        resumeSong();
      }
    } else {
      playSong(song);
    }
  };

  const coverUri = getCoverPhotoSync(song, coverMap);

  const renderLeftActions = () => (
    <Animated.View style={[styles.leftAction, { backgroundColor: colors.primary }]}> 
      <Ionicons name="add-circle" size={32} color={colors.secondary} />
      <Text style={[styles.swipeText, { color: colors.secondary }]}>Add to Queue</Text>
    </Animated.View>
  );

  const handleSwipeRight = () => {
    addToQueue(song);
    
    // Smooth animation for added feedback
    Animated.sequence([
      Animated.timing(addedAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(addedAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    swipeableRef.current?.close();
  };

  return (
    <>
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      onSwipeableLeftOpen={handleSwipeRight}
      leftThreshold={40}
      friction={2}
      overshootLeft={false}
    >
      <View style={[styles.container, { backgroundColor: colors.card }]}> 
        <TouchableOpacity
          style={styles.contentContainer}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={styles.artworkContainer}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.artwork} />
            ) : (
              <View style={[styles.artworkPlaceholder, { backgroundColor: colors.primary }]}>
                <Ionicons name="musical-note" size={24} color={colors.secondary} />
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <Text
              style={[
                styles.title,
                { color: isCurrentSong ? colors.primary : colors.text },
              ]}
              numberOfLines={1}
            >
              {song.title}
            </Text>
            <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
              {song.artist}
            </Text>
            {song.album && (
              <Text style={[styles.album, { color: colors.textSecondary }]} numberOfLines={1}>
                {song.album}
              </Text>
            )}
            {showStats && stats && (
              <View style={styles.statsContainer}>
                <Text style={[styles.statsText, { color: colors.textSecondary }]}>
                  {formatPlayCount(stats.playCount)}
                </Text>
                {stats.playCount > 0 && (
                  <Text style={[styles.statsText, { color: colors.textSecondary }]}>
                    • {formatLastPlayed(stats.lastPlayed)}
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.controlsContainer}>
            {showPlayButton && (
              <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.addToPlaylistInlineBtn}
              onPress={() => setShowPlaylistModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.duration, { color: colors.textSecondary, marginLeft: 4 }]}>
              {formatDuration(song.duration)}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Progress bar at the bottom of the card */}
        {isCurrentSong && (
          <View style={[styles.songProgressBar, { backgroundColor: colors.border }]}> 
            <View style={[styles.songProgressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
          </View>
        )}
        
        {/* Smooth added feedback animation */}
        <Animated.View 
          style={[
            styles.addedOverlay,
            {
              opacity: addedAnimation,
              transform: [{
                scale: addedAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                })
              }]
            }
          ]}
        >
          <Ionicons name="checkmark-circle" size={40} color={colors.primary} />
        </Animated.View>
      </View>
    </Swipeable>
    {/* Playlist Modal */}
    {showPlaylistModal && (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}> 
          <Text style={[styles.modalTitle, { color: colors.text }]}>Select Playlist</Text>
          {playlists.length === 0 ? (
            <Text style={{ color: colors.textSecondary, marginVertical: 16 }}>No playlists found.</Text>
          ) : (
            playlists.map(pl => (
              <TouchableOpacity key={pl.id} style={styles.modalPlaylistBtn} onPress={() => handleAddToPlaylist(pl.id)}>
                <Text style={{ color: colors.text }}>{pl.name}</Text>
              </TouchableOpacity>
            ))
          )}
          <TouchableOpacity onPress={() => setShowPlaylistModal(false)} style={styles.modalCancelBtn}>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    )}
    </>
  );
};

const styles = StyleSheet.create({
  addToPlaylistInlineBtn: {
    marginLeft: 8,
    backgroundColor: 'transparent',
    padding: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    width: 300,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalPlaylistBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
    width: '100%',
    alignItems: 'center',
  },
  modalCancelBtn: {
    marginTop: 12,
    padding: 8,
  },
  container: {
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  artworkContainer: {
    marginRight: 12,
  },
  artwork: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  artworkPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {
    fontSize: 14,
    marginBottom: 1,
  },
  album: {
    fontSize: 12,
    marginBottom: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    fontSize: 11,
  },
  controlsContainer: {
    alignItems: 'center',
  },
  playButton: {
    marginBottom: 4,
  },
  duration: {
    fontSize: 12,
  },
  leftAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
  },
  swipeText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  addedOverlay: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 2,
  },
  songProgressBar: {
    height: 3,
    width: '100%',
    overflow: 'hidden',
  },
  songProgressFill: {
    height: '100%',
  },
});

const areEqual = (prevProps: SongItemProps, nextProps: SongItemProps) => {
  // Only re-render if the song or playback state changes
  return (
    prevProps.song.id === nextProps.song.id &&
    prevProps.coverMap?.[prevProps.song.id] === nextProps.coverMap?.[nextProps.song.id] &&
    prevProps.showStats === nextProps.showStats &&
    prevProps.showPlayButton === nextProps.showPlayButton
  );
};

export const SongItem = React.memo(SongItemComponent, areEqual); 