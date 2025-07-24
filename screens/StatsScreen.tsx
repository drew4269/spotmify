import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { SongItem } from '../components/SongItem';
import { Song } from '../types';
import {
  getMostPlayedSongs,
  getRecentlyPlayedSongs,
  getPlayStats,
  formatPlayCount,
  formatLastPlayed,
} from '../utils/playStats';
import { scanMusicFiles } from '../utils/musicScanner';

export const StatsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { setQueue } = useMusicPlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [mostPlayed, setMostPlayed] = useState<Song[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalPlayTime, setTotalPlayTime] = useState(0);
  const [totalSongsPlayed, setTotalSongsPlayed] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const scannedSongs = await scanMusicFiles();
      setSongs(scannedSongs);

      const [mostPlayedSongs, recentlyPlayedSongs, stats] = await Promise.all([
        getMostPlayedSongs(scannedSongs, 10),
        getRecentlyPlayedSongs(scannedSongs, 10),
        getPlayStats(),
      ]);

      setMostPlayed(mostPlayedSongs);
      setRecentlyPlayed(recentlyPlayedSongs);

      // Calculate total statistics
      let totalTime = 0;
      let songsPlayed = 0;
      Object.values(stats).forEach(stat => {
        totalTime += stat.totalPlayTime;
        if (stat.playCount > 0) songsPlayed++;
      });

      setTotalPlayTime(totalTime);
      setTotalSongsPlayed(songsPlayed);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
    setIsRefreshing(false);
  };

  const formatTotalPlayTime = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const renderStatCard = (title: string, value: string, icon: string) => (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
        <Ionicons name={icon as any} size={24} color={colors.secondary} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
      </View>
    </View>
  );

  const renderSectionHeader = (title: string, subtitle?: string) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const renderEmptyState = (message: string) => (
    <View style={styles.emptyState}>
      <Ionicons name="stats-chart" size={48} color={colors.textSecondary} />
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your listening statistics...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Your Stats</Text>
              <TouchableOpacity
                style={[styles.refreshButton, { backgroundColor: colors.primary }]}
                onPress={handleRefresh}
              >
                <Ionicons name="refresh" size={16} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {/* Statistics Cards */}
            <View style={styles.statsContainer}>
              {renderStatCard(
                'Total Play Time',
                formatTotalPlayTime(totalPlayTime),
                'time'
              )}
              {renderStatCard(
                'Songs Played',
                totalSongsPlayed.toString(),
                'musical-notes'
              )}
              {renderStatCard(
                'Library Size',
                songs.length.toString(),
                'library'
              )}
            </View>

            {/* Most Played Songs */}
            {renderSectionHeader('Most Played', 'Your favorite tracks')}
            {mostPlayed.length > 0 ? (
              <FlatList
                data={mostPlayed}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <View style={styles.rankedSongContainer}>
                    <View style={[styles.rankBadge, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.rankText, { color: colors.secondary }]}>
                        #{index + 1}
                      </Text>
                    </View>
                    <SongItem song={item} showPlayButton={false} />
                  </View>
                )}
                scrollEnabled={false}
                style={styles.songList}
              />
            ) : (
              renderEmptyState('Start playing music to see your most played songs')
            )}

            {/* Recently Played Songs */}
            {renderSectionHeader('Recently Played', 'Your latest listens')}
            {recentlyPlayed.length > 0 ? (
              <FlatList
                data={recentlyPlayed}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <SongItem song={item} showPlayButton={false} />}
                scrollEnabled={false}
                style={styles.songList}
              />
            ) : (
              renderEmptyState('No recently played songs yet')
            )}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  songList: {
    marginBottom: 24,
  },
  rankedSongContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
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
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
}); 