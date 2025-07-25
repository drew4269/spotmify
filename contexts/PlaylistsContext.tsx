import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPlaylists, createPlaylist, addSongToPlaylist, removeSongFromPlaylist, deletePlaylist } from '../utils/playlists';
import { Playlist } from '../types';

interface PlaylistsContextProps {
  playlists: Playlist[];
  refresh: () => Promise<void>;
  create: (name: string) => Promise<void>;
  addSong: (playlistId: string, songId: string) => Promise<void>;
  removeSong: (playlistId: string, songId: string) => Promise<void>;
  remove: (playlistId: string) => Promise<void>;
}

const PlaylistsContext = createContext<PlaylistsContextProps | undefined>(undefined);

export const PlaylistsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const refresh = async () => {
    setPlaylists(await getPlaylists());
  };

  useEffect(() => {
    refresh();
  }, []);

  const create = async (name: string) => {
    await createPlaylist(name);
    await refresh();
  };
  const addSong = async (playlistId: string, songId: string) => {
    await addSongToPlaylist(playlistId, songId);
    await refresh();
  };
  const removeSong = async (playlistId: string, songId: string) => {
    await removeSongFromPlaylist(playlistId, songId);
    await refresh();
  };
  const remove = async (playlistId: string) => {
    await deletePlaylist(playlistId);
    await refresh();
  };

  return (
    <PlaylistsContext.Provider value={{ playlists, refresh, create, addSong, removeSong, remove }}>
      {children}
    </PlaylistsContext.Provider>
  );
};

export function usePlaylists() {
  const ctx = useContext(PlaylistsContext);
  if (!ctx) throw new Error('usePlaylists must be used within PlaylistsProvider');
  return ctx;
}
