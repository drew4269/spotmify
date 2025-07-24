import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Song, PlayerState } from '../types';
import { updatePlayStats } from '../utils/playStats';

interface MusicPlayerContextType {
  playerState: PlayerState;
  playSong: (song: Song) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  stopSong: () => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
  setQueue: (songs: Song[]) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  seekTo: (position: number) => void;
  setVolume: (volume: number) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

const initialState: PlayerState = {
  isPlaying: false,
  currentSong: null,
  queue: [],
  currentIndex: -1,
  isShuffled: false,
  isRepeated: false,
  volume: 1.0,
  position: 0,
  duration: 0,
};

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerState, setPlayerState] = useState<PlayerState>(initialState);
  const soundRef = useRef<Audio.Sound | null>(null);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, []);

  const updatePosition = async () => {
    if (soundRef.current && playerState.isPlaying) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          setPlayerState(prev => ({
            ...prev,
            position: status.positionMillis || 0,
            duration: status.durationMillis || 0,
          }));
        }
      } catch (error) {
        console.error('Error updating position:', error);
      }
    }
  };

  const startPositionTracking = () => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
    }
    positionIntervalRef.current = setInterval(updatePosition, 1000);
  };

  const stopPositionTracking = () => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
      positionIntervalRef.current = null;
    }
  };

  const playSong = async (song: Song) => {
    if (isLoading) return; // Prevent overlapping calls
    // Optimistically update state so UI updates instantly
    setPlayerState(prev => ({
      ...prev,
      currentSong: song,
      isPlaying: true,
      position: 0,
      duration: 0,
      isRepeated: false,
    }));
    setIsLoading(true);
    try {
      // Stop any currently playing song first
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      stopPositionTracking();

      const { sound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: true, volume: playerState.volume }
      );

      soundRef.current = sound;
      playStartTimeRef.current = Date.now();

      setTimeout(() => {
        startPositionTracking();
      }, 100);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPlayerState(prev => ({
            ...prev,
            position: status.positionMillis || 0,
            duration: status.durationMillis || 0,
          }));
          if (status.didJustFinish) {
            handleSongEnd();
          }
        }
      });

      updatePlayStats(song.id, 0);
    } catch (error) {
      console.error('Error playing song:', error);
      setPlayerState(prev => ({
        ...prev,
        isPlaying: false,
        currentSong: null,
        position: 0,
        duration: 0,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSong = async () => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.pauseAsync();
          setPlayerState(prev => ({ ...prev, isPlaying: false }));
          stopPositionTracking();
        }
      }
    } catch (error) {
      console.error('Error pausing song:', error);
    }
  };

  const resumeSong = async () => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.playAsync();
          setPlayerState(prev => ({ ...prev, isPlaying: true }));
          startPositionTracking();
        }
      }
    } catch (error) {
      console.error('Error resuming song:', error);
    }
  };

  const stopSong = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setPlayerState(prev => ({
          ...prev,
          isPlaying: false,
          currentSong: null,
          position: 0,
          duration: 0,
        }));
        stopPositionTracking();
      }
    } catch (error) {
      console.error('Error stopping song:', error);
    }
  };

  const handleSongEnd = () => {
    if (playerState.currentSong) {
      const playTime = Date.now() - playStartTimeRef.current;
      updatePlayStats(playerState.currentSong.id, playTime);
    }

    // Only repeat if repeat is enabled and the current song is still the same
    if (playerState.isRepeated && playerState.currentSong) {
      playSong(playerState.currentSong);
    } else {
      skipToNext();
    }
  };

  const skipToNext = () => {
    if (playerState.queue.length === 0) return;
    
    const nextIndex = playerState.currentIndex + 1;
    if (nextIndex < playerState.queue.length) {
      const nextSong = playerState.queue[nextIndex];
      setPlayerState(prev => ({ ...prev, currentIndex: nextIndex }));
      playSong(nextSong);
    }
  };

  const skipToPrevious = () => {
    if (playerState.queue.length === 0) return;
    
    const prevIndex = playerState.currentIndex - 1;
    if (prevIndex >= 0) {
      const prevSong = playerState.queue[prevIndex];
      setPlayerState(prev => ({ ...prev, currentIndex: prevIndex }));
      playSong(prevSong);
    }
  };

  const setQueue = (songs: Song[]) => {
    setPlayerState(prev => ({
      ...prev,
      queue: songs,
      currentIndex: 0,
    }));
    if (songs.length > 0) {
      playSong(songs[0]);
    }
  };

  const toggleShuffle = () => {
    setPlayerState(prev => ({ ...prev, isShuffled: !prev.isShuffled }));
  };

  const toggleRepeat = () => {
    setPlayerState(prev => ({ ...prev, isRepeated: !prev.isRepeated }));
  };

  const seekTo = async (position: number) => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(position);
        setPlayerState(prev => ({ ...prev, position }));
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const setVolume = async (volume: number) => {
    try {
      if (soundRef.current) {
        await soundRef.current.setVolumeAsync(volume);
        setPlayerState(prev => ({ ...prev, volume }));
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  };

  const addToQueue = (song: Song) => {
    setPlayerState(prev => ({
      ...prev,
      queue: [...prev.queue, song],
    }));
  };

  const removeFromQueue = (index: number) => {
    setPlayerState(prev => ({
      ...prev,
      queue: prev.queue.filter((_, i) => i !== index),
    }));
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        playerState,
        playSong,
        pauseSong,
        resumeSong,
        stopSong,
        skipToNext,
        skipToPrevious,
        setQueue,
        toggleShuffle,
        toggleRepeat,
        seekTo,
        setVolume,
        addToQueue,
        removeFromQueue,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}; 