import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, CoverPhotoProvider } from './contexts/ThemeContext';
import { MusicPlayerProvider } from './contexts/MusicPlayerContext';
import { BottomTabNavigator } from './components/BottomTabNavigator';
import { MiniPlayer } from './components/MiniPlayer';
import { SongDetailsScreen } from './screens/SongDetailsScreen';
import { useTheme } from './contexts/ThemeContext';

const RootStack = createStackNavigator();

const AppContent: React.FC = () => {
  const { colors, theme } = useTheme();

  return (
    <>
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
        </RootStack.Navigator>
        <MiniPlayer />
      </NavigationContainer>
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <CoverPhotoProvider>
          <MusicPlayerProvider>
            <AppContent />
          </MusicPlayerProvider>
        </CoverPhotoProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
