import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song, Playlist } from '../types';

const PLAYLISTS_KEY = 'spotmify_playlists';

export async function getPlaylists(): Promise<Playlist[]> {
  const data = await AsyncStorage.getItem(PLAYLISTS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function savePlaylists(playlists: Playlist[]) {
  await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

export async function createPlaylist(name: string): Promise<Playlist> {
  const playlists = await getPlaylists();
  const now = new Date();
  const newPlaylist: Playlist = {
    id: Date.now().toString(),
    name,
    songIds: [],
    owner: 'You',
    createdAt: now,
    updatedAt: now,
  };
  playlists.push(newPlaylist);
  await savePlaylists(playlists);
  return newPlaylist;
}

export async function addSongToPlaylist(playlistId: string, songId: string) {
  const playlists = await getPlaylists();
  const idx = playlists.findIndex(p => p.id === playlistId);
  if (idx !== -1 && !playlists[idx].songIds.includes(songId)) {
    playlists[idx].songIds.push(songId);
    await savePlaylists(playlists);
  }
}

export async function removeSongFromPlaylist(playlistId: string, songId: string) {
  const playlists = await getPlaylists();
  const idx = playlists.findIndex(p => p.id === playlistId);
  if (idx !== -1) {
    playlists[idx].songIds = playlists[idx].songIds.filter(id => id !== songId);
    await savePlaylists(playlists);
  }
}

export async function deletePlaylist(playlistId: string) {
  const playlists = await getPlaylists();
  const filtered = playlists.filter(p => p.id !== playlistId);
  await savePlaylists(filtered);
}
