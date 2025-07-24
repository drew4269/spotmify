import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  coverUri?: string;
  owner?: string;
}

export const PlaylistsScreen: React.FC = () => {
  const { colors } = useTheme();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newName, setNewName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'Playlists'|'Artists'|'Albums'>('Playlists');

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    const data = await AsyncStorage.getItem('spotmify_playlists');
    if (data) setPlaylists(JSON.parse(data));
    else setPlaylists([]);
  };

  const savePlaylists = async (pls: Playlist[]) => {
    setPlaylists(pls);
    await AsyncStorage.setItem('spotmify_playlists', JSON.stringify(pls));
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newName.trim(),
      songIds: [],
      owner: 'You',
    };
    const updated = [...playlists, newPlaylist];
    await savePlaylists(updated);
    setNewName('');
    setShowInput(false);
  };

  const filteredPlaylists = playlists.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const renderPlaylist = ({ item }: { item: Playlist }) => (
    <TouchableOpacity style={[styles.playlistRow, { backgroundColor: colors.card }]}
      onPress={() => Alert.alert('Playlist', `Open playlist: ${item.name}`)}>
      {item.coverUri ? (
        <Image source={{ uri: item.coverUri }} style={styles.coverArt} />
      ) : (
        <View style={[styles.coverPlaceholder, { backgroundColor: colors.primary }]}> 
          <Ionicons name="musical-notes" size={24} color={colors.secondary} />
        </View>
      )}
      <View style={styles.playlistInfo}>
        <Text style={[styles.playlistName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.playlistMeta, { color: colors.textSecondary }]}>Playlist • {item.owner || 'You'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Your Library</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowInput(true)}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
          <Text style={[styles.createText, { color: colors.primary }]}>Create</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filterRow}>
        {['Playlists', 'Artists', 'Albums'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && { backgroundColor: colors.primary }]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={{ color: filter === f ? colors.secondary : colors.text }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.searchSortRow}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}> 
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.sortButton}>
          <Ionicons name="swap-vertical" size={20} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, marginLeft: 4 }}>Recents</Text>
        </TouchableOpacity>
      </View>
      {showInput && (
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.primary }]}
            placeholder="Playlist name"
            placeholderTextColor={colors.textSecondary}
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />
          <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
            <Ionicons name="checkmark" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={filteredPlaylists}
        keyExtractor={item => item.id}
        renderItem={renderPlaylist}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No playlists yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  createText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginRight: 8,
  },
  searchSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 15,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  listContainer: {
    paddingBottom: 100,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  coverArt: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 14,
  },
  coverPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  playlistMeta: {
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
  },
});

export default PlaylistsScreen; 