import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Song, AudioMetadata } from '../types';
import { generateAlbumArtworkPlaceholder } from './albumArtwork';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SONGS_CACHE_KEY = 'spotmify_songs_cache';

export const requestPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};

export const scanMusicFiles = async (): Promise<Song[]> => {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }

    // Get all media assets
    const media = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      first: 1000, // Limit to 1000 songs for performance
    });

    const songs: Song[] = [];

    for (const asset of media.assets) {
      try {
        // Extract metadata from the asset
        const metadata = await extractMetadata(asset);
        
        const song: Song = {
          id: asset.id,
          title: metadata.title || asset.filename || 'Unknown Title',
          artist: metadata.artist || 'Unknown Artist',
          album: metadata.album || 'Unknown Album',
          duration: asset.duration * 1000, // Convert to milliseconds
          uri: asset.uri,
          artwork: metadata.artwork,
          genre: metadata.genre,
          year: metadata.year,
          trackNumber: metadata.trackNumber,
          albumId: asset.albumId,
        };

        songs.push(song);
      } catch (error) {
        console.error(`Error processing asset ${asset.id}:`, error);
        // Add song with basic info if metadata extraction fails
        const song: Song = {
          id: asset.id,
          title: asset.filename || 'Unknown Title',
          artist: 'Unknown Artist',
          album: 'Unknown Album',
          duration: asset.duration * 1000,
          uri: asset.uri,
          artwork: generateAlbumArtworkPlaceholder(asset.filename, 'Unknown Artist'),
        };
        songs.push(song);
      }
    }

    return songs;
  } catch (error) {
    console.error('Error scanning music files:', error);
    throw error;
  }
};

const extractMetadata = async (asset: MediaLibrary.Asset): Promise<AudioMetadata> => {
  try {
    // Try to get album info if available
    if (asset.albumId) {
      const album = await MediaLibrary.getAlbumAsync(asset.albumId);
      if (album) {
        return {
          title: asset.filename,
          artist: 'Unknown Artist', // MediaLibrary Album doesn't have artist property
          album: album.title,
          duration: asset.duration * 1000,
          artwork: generateAlbumArtworkPlaceholder(album.title, 'Unknown Artist'),
        };
      }
    }

    // Fallback to basic asset info
    return {
      title: asset.filename,
      artist: 'Unknown Artist',
      duration: asset.duration * 1000,
      artwork: generateAlbumArtworkPlaceholder(asset.filename, 'Unknown Artist'),
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      title: asset.filename,
      duration: asset.duration * 1000,
      artwork: generateAlbumArtworkPlaceholder(asset.filename, 'Unknown Artist'),
    };
  }
};

export const searchSongs = (songs: Song[], query: string): Song[] => {
  const lowercaseQuery = query.toLowerCase();
  return songs.filter(song => 
    song.title.toLowerCase().includes(lowercaseQuery) ||
    song.artist.toLowerCase().includes(lowercaseQuery) ||
    (song.album && song.album.toLowerCase().includes(lowercaseQuery))
  );
};

export const groupSongsByArtist = (songs: Song[]): Record<string, Song[]> => {
  return songs.reduce((groups, song) => {
    const artist = song.artist || 'Unknown Artist';
    if (!groups[artist]) {
      groups[artist] = [];
    }
    groups[artist].push(song);
    return groups;
  }, {} as Record<string, Song[]>);
};

export const groupSongsByAlbum = (songs: Song[]): Record<string, Song[]> => {
  return songs.reduce((groups, song) => {
    const album = song.album || 'Unknown Album';
    if (!groups[album]) {
      groups[album] = [];
    }
    groups[album].push(song);
    return groups;
  }, {} as Record<string, Song[]>);
};

export const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isAudioFile = (filename: string): boolean => {
  const audioExtensions = ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'wma'];
  const extension = getFileExtension(filename);
  return audioExtensions.includes(extension);
};

export async function loadSongsFromCache(): Promise<Song[]> {
  const cached = await AsyncStorage.getItem(SONGS_CACHE_KEY);
  if (cached) return JSON.parse(cached);
  return [];
}

export async function scanAndCacheSongs(): Promise<Song[]> {
  const scanned = await scanMusicFiles(); // your existing scan logic
  await AsyncStorage.setItem(SONGS_CACHE_KEY, JSON.stringify(scanned));
  return scanned;
}

export async function loadSongs(): Promise<Song[]> {
  // Load from cache first for instant UI
  const cached = await loadSongsFromCache();
  // Start background scan
  scanAndCacheSongs().then(() => {});
  return cached;
} 