import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useCoverPhotoUpdate } from '../contexts/ThemeContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { SongItem } from '../components/SongItem';
import { scanMusicFiles, searchSongs, loadSongs, scanAndCacheSongs } from '../utils/musicScanner';
import { Song } from '../types';
import { getCoverPhoto } from '../utils/coverPhoto';

export const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const { setQueue, playerState, playSong } = useMusicPlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [coverMap, setCoverMap] = useState<Record<string, string | undefined>>({});
  const { lastUpdate } = useCoverPhotoUpdate();
  const flatListRef = useRef<FlatList>(null);
  const [showScrollToCurrent, setShowScrollToCurrent] = useState(false);
  const [visibleIndices, setVisibleIndices] = useState<number[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollToCurrentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    loadSongs().then(cachedSongs => {
      if (isMounted) {
        setSongs(cachedSongs);
        setFilteredSongs(cachedSongs);
        preloadCovers(cachedSongs);
      }
    });
    // Listen for background scan completion (optional: use an event or polling)
    scanAndCacheSongs().then(scannedSongs => {
      if (isMounted && JSON.stringify(scannedSongs) !== JSON.stringify(songs)) {
        setSongs(scannedSongs);
        setFilteredSongs(scannedSongs);
        preloadCovers(scannedSongs);
      }
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = searchSongs(songs, searchQuery);
      setFilteredSongs(filtered);
    } else {
      setFilteredSongs(songs);
    }
  }, [searchQuery, songs]);

  useEffect(() => {
    preloadCovers(filteredSongs);
  }, [filteredSongs, lastUpdate]);

  // Find index of currently playing song
  const currentSongIndex = filteredSongs.findIndex(s => s.id === playerState.currentSong?.id);

  // Show button if current song is not visible and a song is playing
  useEffect(() => {
    if (
      playerState.currentSong &&
      currentSongIndex !== -1 &&
      !visibleIndices.includes(currentSongIndex) &&
      isScrolling
    ) {
      setShowScrollToCurrent(true);
    } else {
      setShowScrollToCurrent(false);
    }
  }, [playerState.currentSong, currentSongIndex, visibleIndices, isScrolling]);

  const preloadCovers = async (songsToPreload: Song[]) => {
    const map: Record<string, string | undefined> = {};
    await Promise.all(songsToPreload.map(async (song) => {
      map[song.id] = await getCoverPhoto(song);
    }));
    setCoverMap(map);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSongs();
    setIsRefreshing(false);
  };

  const handlePlayAll = () => {
    if (filteredSongs.length > 0) {
      setQueue(filteredSongs);
    }
  };

  const handleShuffle = () => {
    if (filteredSongs.length > 0) {
      const shuffled = [...filteredSongs].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
    }
  };

  const toggleStats = () => {
    setShowStats(!showStats);
  };

  const handleScrollToCurrent = () => {
    if (currentSongIndex !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ 
        index: currentSongIndex, 
        animated: true,
        viewPosition: 0.5
      });
    }
  };

  const handleScrollToIndexFailed = (info: { index: number }) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ 
          index: info.index, 
          animated: true,
          viewPosition: 0.5
        });
      }
    });
  };

  const handleScrollBeginDrag = () => {
    setIsScrolling(true);
    // Clear any existing timeout immediately
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  };

  const handleScrollEndDrag = () => {
    // Keep scrolling state for a bit to show the button
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      scrollTimeoutRef.current = null;
    }, 2000);
  };

  const handleMomentumScrollEnd = () => {
    // Keep scrolling state for a bit to show the button
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      scrollTimeoutRef.current = null;
    }, 2000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleSongPress = (song: Song) => {
    // Auto-play the song when clicked
    playSong(song);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.text }]}>Your Library</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handlePlayAll}
        >
          <Ionicons name="play" size={16} color={colors.secondary} />
          <Text style={[styles.actionButtonText, { color: colors.secondary }]}>
            Play All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={handleShuffle}
        >
          <Ionicons name="shuffle" size={16} color={colors.text} />
          <Text style={[styles.actionButtonText, { color: colors.text }]}>
            Shuffle
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: showStats ? colors.primary : colors.surface }
          ]}
          onPress={toggleStats}
        >
          <Ionicons 
            name="stats-chart" 
            size={16} 
            color={showStats ? colors.secondary : colors.text} 
          />
          <Text style={[
            styles.actionButtonText, 
            { color: showStats ? colors.secondary : colors.text }
          ]}>
            Stats
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
      <Ionicons name="search" size={20} color={colors.textSecondary} />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder="Search songs, artists, or albums..."
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="musical-notes" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No Music Found
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
        {isLoading
          ? 'Scanning your device for music...'
          : 'Add some music files to your device to get started'}
      </Text>
      {!isLoading && (
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={loadSongs}
        >
          <Text style={[styles.scanButtonText, { color: colors.secondary }]}>
            Scan for Music
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading && songs.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Scanning your music library...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      {renderSearchBar()}
      
      <FlatList
        ref={flatListRef}
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SongItem 
            song={item} 
            showStats={showStats}
            coverMap={coverMap}
            onPress={() => handleSongPress(item)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        onViewableItemsChanged={({ viewableItems }) => {
          setVisibleIndices(viewableItems.map(v => v.index ?? -1).filter(i => i !== -1));
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(data, index) => ({ length: 80, offset: 80 * index, index })}
        initialNumToRender={15}
        windowSize={10}
      />
      {showScrollToCurrent && (
        <TouchableOpacity
          onPress={handleScrollToCurrent}
          activeOpacity={0.8}
          style={{
            position: 'absolute',
            bottom: 100,
            right: 24,
            backgroundColor: '#1DB954',
            borderRadius: 28,
            width: 56,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 6,
            zIndex: 100,
          }}
        >
          <Ionicons name="search" size={28} color={colors.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 100, // Space for mini player
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  scanButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 