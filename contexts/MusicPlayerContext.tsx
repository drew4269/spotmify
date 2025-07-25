import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Song, PlayerState } from '../types';
import { updatePlayStats } from '../utils/playStats';

interface MusicPlayerContextType {
  playerState: PlayerState;
  playSong: (song: Song) => Promise<void>;
  pauseSong: () => Promise<void>;
  resumeSong: () => Promise<void>;
  stopSong: () => Promise<void>;
  skipToNext: () => void;
  skipToPrevious: () => void;
  setQueue: (songs: Song[]) => void;
  togglePlayback: () => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  seekTo: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
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

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

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
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync() as any;
        if (status.isLoaded) {
          setPlayerState(prev => ({
            ...prev,
            position: status.positionMillis || 0,
            duration: status.durationMillis || 0
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
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: true, volume: playerState.volume }
      );

      soundRef.current = sound;
      setPlayerState(prev => ({
        ...prev,
        currentSong: song,
        isPlaying: true,
        position: 0,
        duration: 0
      }));

      startPositionTracking();
      updatePlayStats(song.id);
      
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          skipToNext();
        }
      });
      
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const pauseSong = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
        stopPositionTracking();
      }
    } catch (error) {
      console.error('Error pausing song:', error);
    }
  };

  const resumeSong = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
        startPositionTracking();
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
      }
      setPlayerState(prev => ({
        ...prev,
        isPlaying: false,
        currentSong: null,
        position: 0,
        duration: 0
      }));
      stopPositionTracking();
    } catch (error) {
      console.error('Error stopping song:', error);
    }
  };

  const togglePlayback = async () => {
    if (playerState.isPlaying) {
      await pauseSong();
    } else if (playerState.currentSong) {
      await resumeSong();
    }
  };

  const skipToNext = () => {
    const { queue, currentIndex, isShuffled } = playerState;
    if (queue.length === 0) return;

    let nextIndex = currentIndex;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = (currentIndex + 1) % queue.length;
    }

    setPlayerState(prev => ({ ...prev, currentIndex: nextIndex }));
    playSong(queue[nextIndex]);
  };

  const skipToPrevious = () => {
    const { queue, currentIndex, isShuffled } = playerState;
    if (queue.length === 0) return;

    let prevIndex = currentIndex;
    if (isShuffled) {
      prevIndex = Math.floor(Math.random() * queue.length);
    } else {
      prevIndex = currentIndex - 1 < 0 ? queue.length - 1 : currentIndex - 1;
    }

    setPlayerState(prev => ({ ...prev, currentIndex: prevIndex }));
    playSong(queue[prevIndex]);
  };

  const setQueue = (songs: Song[]) => {
    setPlayerState(prev => ({ ...prev, queue: songs }));
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
      queue: [...prev.queue, song]
    }));
  };

  const removeFromQueue = (index: number) => {
    setPlayerState(prev => ({
      ...prev,
      queue: prev.queue.filter((_, i) => i !== index)
    }));
  };

  const value: MusicPlayerContextType = {
    playerState,
    playSong,
    pauseSong,
    resumeSong,
    stopSong,
    skipToNext,
    skipToPrevious,
    setQueue,
    togglePlayback,
    toggleShuffle,
    toggleRepeat,
    seekTo,
    setVolume,
    addToQueue,
    removeFromQueue,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
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
