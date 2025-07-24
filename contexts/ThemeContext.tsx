import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeMode } from '../types';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  colors: typeof lightColors | typeof darkColors;
}

const lightColors = {
  primary: '#1DB954', // Spotify green
  secondary: '#191414', // Spotify black
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#191414',
  textSecondary: '#6C757D',
  border: '#E9ECEF',
  accent: '#1DB954',
  error: '#DC3545',
  success: '#28A745',
  warning: '#FFC107',
  card: '#FFFFFF',
  cardShadow: '#E9ECEF',
};

const darkColors = {
  primary: '#1DB954', // Spotify green
  secondary: '#FFFFFF',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  border: '#2D2D2D',
  accent: '#1DB954',
  error: '#FF6B6B',
  success: '#51CF66',
  warning: '#FFD43B',
  card: '#1E1E1E',
  cardShadow: '#000000',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Cover photo update context
const CoverPhotoContext = createContext<{ notifyCoverUpdate: () => void; lastUpdate: number }>({ notifyCoverUpdate: () => {}, lastUpdate: 0 });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    // Initialize theme based on system preference
    if (systemColorScheme) {
      setThemeState(systemColorScheme as ThemeMode);
    }
  }, [systemColorScheme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const CoverPhotoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const notifyCoverUpdate = useCallback(() => setLastUpdate(Date.now()), []);
  return (
    <CoverPhotoContext.Provider value={{ notifyCoverUpdate, lastUpdate }}>
      {children}
    </CoverPhotoContext.Provider>
  );
};

export const useCoverPhotoUpdate = () => useContext(CoverPhotoContext); 