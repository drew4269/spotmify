import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const PlaylistsScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [playlists, setPlaylists] = useState<any[]>([]);
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

  const savePlaylists = async (pls: any[]) => {
    setPlaylists(pls);
    await AsyncStorage.setItem('spotmify_playlists', JSON.stringify(pls));
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const newPlaylist = {
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

  const filteredPlaylists = playlists.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

  const renderPlaylist = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.playlistRow} 
      onPress={() => navigation.navigate('PlaylistDetails', { playlistId: item.id })}
    >
      {item.coverUri ? (
        <Image source={{ uri: item.coverUri }} style={styles.coverArt} />
      ) : (
        <View style={[styles.coverPlaceholder, { backgroundColor: '#282828' }]}> 
          <Ionicons name="musical-notes" size={24} color={colors.primary} />
        </View>
      )}
      <View style={styles.playlistInfo}>
        <Text style={[styles.playlistName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.playlistMeta, { color: colors.textSecondary }]}>
          {item.songIds?.length || 0} songs • {item.owner || 'You'}
        </Text>
      </View>
      <TouchableOpacity style={{ padding: 8 }}>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity>
            <Ionicons name="person-circle-outline" size={32} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text, marginLeft: 12 }]}>Your Library</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ marginRight: 20 }}>
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowInput(true)}>
            <Ionicons name="add" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.filterRow}>
        {['Playlists', 'Artists', 'Albums'].map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.chip, 
              filter === f && { backgroundColor: colors.primary }
            ]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={{ 
              color: filter === f ? '#000' : colors.text,
              fontWeight: '600',
              fontSize: 14,
            }}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.searchSortRow}>
        <TouchableOpacity style={styles.sortButton}>
          <Ionicons name="list" size={18} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, marginLeft: 6, fontSize: 14 }}>Most recent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sortButton, { marginLeft: 8 }]}>
          <Ionicons name="grid" size={18} color={colors.textSecondary} />
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
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  createText: {
    fontSize: 16,
    marginLeft: 4,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  searchSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  listContainer: {
    paddingVertical: 8,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  coverArt: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#282828',
  },
  coverPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#282828',
  },
  playlistInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  playlistMeta: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
    opacity: 0.7,
  },
});

export default PlaylistsScreen;
