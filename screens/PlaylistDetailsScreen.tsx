
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Animated, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { usePlaylists } from '../contexts/PlaylistsContext';
import { Song } from '../types';
import { loadSongs } from '../utils/musicScanner';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_HEIGHT = 340;
const HEADER_COLLAPSE_HEIGHT = 60;

const PlaylistDetailsScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { playlistId } = route.params;
  const { playlists, removeSong } = usePlaylists();
  const { playSong } = useMusicPlayer();
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSongs().then(setAllSongs);
  }, []);

  const playlist = playlists.find((pl) => pl.id === playlistId);
  const playlistSongs = playlist ? playlist.songIds.map((id: string) => allSongs.find(s => s.id === id)).filter(Boolean) as Song[] : [];

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 280],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  if (!playlist) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.text }}>Playlist not found.</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <Animated.View style={[styles.header, { transform: [{ scale: headerScale }] }]}>
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      <BlurView intensity={80} style={StyleSheet.absoluteFill} />
      <View style={[styles.headerContent, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.playlistInfo}>
          <View style={[styles.coverArt, { backgroundColor: colors.primary }]}>
            <Ionicons name="musical-notes" size={64} color={colors.secondary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{playlist.name}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {playlist.owner || 'You'} • {playlistSongs.length} songs
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderControls = () => (
    <View style={styles.controlsContainer}>
      <View style={styles.leftControls}>
        <TouchableOpacity>
          <Ionicons name="heart-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="arrow-down-circle-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <TouchableOpacity>
          <Ionicons name="shuffle" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.playButton}
          onPress={() => playlistSongs[0] && playSong(playlistSongs[0])}
        >
          <Ionicons name="play" size={32} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSong = ({ item, index }: { item: Song; index: number }) => (
    <TouchableOpacity
      style={styles.songRow}
      onPress={() => playSong(item)}
    >
      <Text style={[styles.songIndex, { color: colors.textSecondary }]}>
        {index + 1}
      </Text>
      {item.coverUri ? (
        <Image source={{ uri: item.coverUri }} style={styles.songCover} />
      ) : (
        <View style={[styles.songCover, { backgroundColor: '#282828' }]}>
          <Ionicons name="musical-note" size={20} color={colors.textSecondary} />
        </View>
      )}
      <View style={styles.songInfo}>
        <Text style={[styles.songTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.songArtist, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.moreButton}
        onPress={() => {
          removeSong(playlist.id, item.id);
          Alert.alert('Removed', 'Song removed from playlist.');
        }}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.FlatList
        data={playlistSongs}
        renderItem={renderSong}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderControls()}
            <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.listHeaderText, { color: colors.textSecondary }]}>
                Title
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No songs in this playlist.
          </Text>
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      />
      <Animated.View
        style={[
          styles.headerBackground,
          { opacity: headerOpacity, backgroundColor: colors.background }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 340,
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 1,
  },
  headerContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    marginTop: 'auto',
  },
  coverArt: {
    width: 220,
    height: 220,
    borderRadius: 4,
    marginBottom: 16,
    alignSelf: 'center',
    backgroundColor: '#181818',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  meta: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  controlsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listHeader: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listHeaderText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  songIndex: {
    width: 24,
    fontSize: 16,
    textAlign: 'center',
  },
  songCover: {
    width: 42,
    height: 42,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    opacity: 0.7,
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    opacity: 0.7,
  },
});

export default PlaylistDetailsScreen;
