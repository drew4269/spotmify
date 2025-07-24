import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types';

export interface PlayStats {
  playCount: number;
  lastPlayed: Date;
  totalPlayTime: number; // in milliseconds
}

export interface SongStats extends PlayStats {
  songId: string;
}

const STATS_STORAGE_KEY = 'spotmify_play_stats';
const RECENT_PLAYS_KEY = 'spotmify_recent_plays';

export const getPlayStats = async (): Promise<Record<string, PlayStats>> => {
  try {
    const statsJson = await AsyncStorage.getItem(STATS_STORAGE_KEY);
    if (statsJson) {
      const stats = JSON.parse(statsJson);
      // Convert date strings back to Date objects
      Object.keys(stats).forEach(songId => {
        if (stats[songId].lastPlayed) {
          stats[songId].lastPlayed = new Date(stats[songId].lastPlayed);
        }
      });
      return stats;
    }
    return {};
  } catch (error) {
    console.error('Error loading play stats:', error);
    return {};
  }
};

export const updatePlayStats = async (songId: string, playTime: number = 0): Promise<void> => {
  try {
    const stats = await getPlayStats();
    const now = new Date();
    
    if (stats[songId]) {
      stats[songId].playCount += 1;
      stats[songId].lastPlayed = now;
      stats[songId].totalPlayTime += playTime;
    } else {
      stats[songId] = {
        playCount: 1,
        lastPlayed: now,
        totalPlayTime: playTime,
      };
    }

    await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error updating play stats:', error);
  }
};

export const getMostPlayedSongs = async (songs: Song[], limit: number = 10): Promise<Song[]> => {
  try {
    const stats = await getPlayStats();
    
    // Create array of songs with their stats
    const songsWithStats = songs.map(song => ({
      song,
      stats: stats[song.id] || { playCount: 0, lastPlayed: new Date(0), totalPlayTime: 0 }
    }));

    // Sort by play count (descending)
    songsWithStats.sort((a, b) => b.stats.playCount - a.stats.playCount);

    // Return top songs
    return songsWithStats.slice(0, limit).map(item => item.song);
  } catch (error) {
    console.error('Error getting most played songs:', error);
    return [];
  }
};

export const getRecentlyPlayedSongs = async (songs: Song[], limit: number = 10): Promise<Song[]> => {
  try {
    const stats = await getPlayStats();
    
    // Create array of songs with their stats
    const songsWithStats = songs.map(song => ({
      song,
      stats: stats[song.id] || { playCount: 0, lastPlayed: new Date(0), totalPlayTime: 0 }
    }));

    // Sort by last played date (descending)
    songsWithStats.sort((a, b) => b.stats.lastPlayed.getTime() - a.stats.lastPlayed.getTime());

    // Return recent songs
    return songsWithStats.slice(0, limit).map(item => item.song);
  } catch (error) {
    console.error('Error getting recently played songs:', error);
    return [];
  }
};

export const getSongStats = async (songId: string): Promise<PlayStats | null> => {
  try {
    const stats = await getPlayStats();
    return stats[songId] || null;
  } catch (error) {
    console.error('Error getting song stats:', error);
    return null;
  }
};

export const clearPlayStats = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STATS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing play stats:', error);
  }
};

export const formatPlayCount = (count: number): string => {
  if (count === 0) return 'Never played';
  if (count === 1) return 'Played once';
  return `Played ${count} times`;
};

export const formatLastPlayed = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}; 