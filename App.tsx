import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, CoverPhotoProvider } from './contexts/ThemeContext';
import { MusicPlayerProvider } from './contexts/MusicPlayerContext';
import { PlaylistsProvider } from './contexts/PlaylistsContext';
import { BottomTabNavigator } from './components/BottomTabNavigator';
import { MiniPlayer } from './components/MiniPlayer';
import LockscreenPlayer from './components/LockscreenPlayer.old';
import { View } from 'react-native';
import { AppState } from 'react-native';
import { SongDetailsScreen } from './screens/SongDetailsScreen';
import PlaylistDetailsScreen from './screens/PlaylistDetailsScreen';
import { useTheme } from './contexts/ThemeContext';

const RootStack = createStackNavigator();

const AppContent: React.FC = () => {
  const { colors, theme } = useTheme();
  const [showLockscreen, setShowLockscreen] = React.useState(false);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setShowLockscreen(true);
      } else if (nextAppState === 'active') {
        setShowLockscreen(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (showLockscreen) {
    return <LockscreenPlayer />;
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer>
        <RootStack.Navigator 
          screenOptions={{ 
            headerShown: false,
          }}
        >
          <RootStack.Screen 
            name="MainTabs" 
            component={BottomTabNavigator}
          />
          <RootStack.Screen 
            name="SongDetails" 
            component={SongDetailsScreen}
            options={{
              presentation: 'modal',
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
          <RootStack.Screen
            name="PlaylistDetails"
            component={PlaylistDetailsScreen}
            options={{
              title: 'Playlist',
              presentation: 'card',
            }}
          />
        </RootStack.Navigator>
        <MiniPlayer />
      </NavigationContainer>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <CoverPhotoProvider>
          <MusicPlayerProvider>
            <PlaylistsProvider>
              <AppContent />
            </PlaylistsProvider>
          </MusicPlayerProvider>
        </CoverPhotoProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
