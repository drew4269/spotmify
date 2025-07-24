export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  uri: string;
  artwork?: string;
  genre?: string;
  year?: number;
  trackNumber?: number;
  albumId?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songs: Song[];
  createdAt: Date;
  updatedAt: Date;
  artwork?: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isShuffled: boolean;
  isRepeated: boolean;
  volume: number;
  position: number;
  duration: number;
}

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  artwork?: string;
  genre?: string;
  year?: number;
  trackNumber?: number;
}

export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  autoPlay: boolean;
  crossfade: boolean;
  equalizer: boolean;
  highQuality: boolean;
} 