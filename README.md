# 🎧 Spotmify

A sleek, personal music streaming app built with React Native and Expo - your lightweight Spotify clone for local music playback.

## ✨ Features

### 🎵 Core Music Features
- **Automatic Music Detection**: Scans and lists all audio files from your device storage
- **Smart Playback Controls**: Play, pause, skip, repeat, and shuffle functionality
- **Queue Management**: Add songs to queue and manage playback order
- **Search & Filter**: Search songs by title, artist, or album
- **Audio Metadata**: Displays song information including duration, artist, and album

### 🎨 User Interface
- **Dark/Light Mode**: Beautiful theme switching with system preference detection
- **Modern UI**: Clean, Spotify-inspired design with smooth animations
- **Mini Player**: Persistent player controls at the bottom of the screen
- **Responsive Design**: Optimized for both phones and tablets

### 🔧 Technical Features
- **Offline Access**: All music stored locally on your device
- **Background Playback**: Continue listening while using other apps
- **Volume Control**: Adjustable volume with visual feedback
- **Progress Tracking**: Real-time playback progress with seek functionality

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS) or Android Emulator (for Android)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd spotmify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

### Permissions

The app requires the following permissions:
- **Media Library Access**: To scan and play your music files
- **Storage Access**: To read audio files from your device

## 📱 Usage

### First Launch
1. Grant media library permissions when prompted
2. The app will automatically scan your device for music files
3. Your music library will appear in the main screen

### Playing Music
- **Tap any song** to start playback
- **Use the mini player** at the bottom for quick controls
- **Search** for specific songs using the search bar
- **Play All** or **Shuffle** your entire library

### Navigation
- **Library Tab**: Browse and search your music collection
- **Settings Tab**: Customize theme, volume, and app preferences

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation v6
- **Audio Playback**: Expo AV
- **Media Access**: Expo Media Library
- **Icons**: Expo Vector Icons (Ionicons)
- **State Management**: React Context API
- **Styling**: React Native StyleSheet

## 📁 Project Structure

```
spotmify/
├── components/          # Reusable UI components
│   ├── SongItem.tsx    # Individual song display
│   ├── MiniPlayer.tsx  # Bottom player controls
│   └── BottomTabNavigator.tsx
├── contexts/           # React Context providers
│   ├── ThemeContext.tsx
│   └── MusicPlayerContext.tsx
├── screens/            # Main app screens
│   ├── HomeScreen.tsx
│   └── SettingsScreen.tsx
├── utils/              # Utility functions
│   └── musicScanner.ts
├── types/              # TypeScript type definitions
│   └── index.ts
└── App.tsx            # Main app component
```

## 🎯 Supported Audio Formats

- MP3
- WAV
- AAC
- M4A
- FLAC
- OGG
- WMA

## 🔮 Future Features

- [ ] Playlist creation and management
- [ ] Album artwork display
- [ ] Audio visualizer
- [ ] Equalizer settings
- [ ] Most played statistics
- [ ] Crossfade between songs
- [ ] Sleep timer
- [ ] Widget support (Android)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Spotify's design and functionality
- Built with React Native and Expo
- Icons provided by Ionicons

---

**Made with ❤️ for music lovers everywhere** 