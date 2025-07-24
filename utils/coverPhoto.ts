import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types';

const COVER_KEY_PREFIX = 'spotmify_cover_';

export const getCoverPhoto = async (song: Song): Promise<string | undefined> => {
  const uri = await AsyncStorage.getItem(COVER_KEY_PREFIX + song.id);
  if (uri) return uri;
  return song.artwork;
};

export const getCoverPhotoSync = (song: Song, coverMap: Record<string, string | undefined>): string | undefined => {
  // Use a preloaded map for performance in lists
  return coverMap[song.id] || song.artwork;
}; 