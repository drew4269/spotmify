import * as MediaLibrary from 'expo-media-library';
import { Asset } from 'expo-media-library';

export interface AlbumInfo {
  id: string;
  title: string;
  artist?: string;
  artwork?: string;
  songCount: number;
}

export const getAlbumArtwork = async (asset: Asset): Promise<string | undefined> => {
  try {
    if (asset.albumId) {
      const album = await MediaLibrary.getAlbumAsync(asset.albumId);
      if (album) {
        // MediaLibrary doesn't provide direct cover image access
        // We'll use a placeholder for now
        return generateAlbumArtworkPlaceholder(album.title, 'Unknown Artist');
      }
    }
    
    // Fallback: generate placeholder based on song info
    return generateAlbumArtworkPlaceholder(asset.filename, 'Unknown Artist');
  } catch (error) {
    console.error('Error getting album artwork:', error);
    return undefined;
  }
};

export const getAlbums = async (): Promise<AlbumInfo[]> => {
  try {
    const albums = await MediaLibrary.getAlbumsAsync();
    return albums.map(album => ({
      id: album.id,
      title: album.title,
      artist: 'Unknown Artist', // MediaLibrary Album doesn't have artist property
      artwork: generateAlbumArtworkPlaceholder(album.title, 'Unknown Artist'),
      songCount: album.assetCount,
    }));
  } catch (error) {
    console.error('Error getting albums:', error);
    return [];
  }
};

export const getAlbumSongs = async (albumId: string): Promise<Asset[]> => {
  try {
    const album = await MediaLibrary.getAlbumAsync(albumId);
    if (album) {
      // Get assets for this album
      const assets = await MediaLibrary.getAssetsAsync({
        album: albumId,
        mediaType: MediaLibrary.MediaType.audio,
      });
      return assets.assets;
    }
    return [];
  } catch (error) {
    console.error('Error getting album songs:', error);
    return [];
  }
};

export const generateAlbumArtworkPlaceholder = (title: string, artist: string): string => {
  // Generate a simple color based on the title and artist
  const text = `${title}${artist}`;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Generate colors based on hash
  const hue = Math.abs(hash) % 360;
  const saturation = 60 + (Math.abs(hash) % 40); // 60-100%
  const lightness = 40 + (Math.abs(hash) % 20); // 40-60%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export const getAlbumArtworkUrl = (asset: Asset): string | undefined => {
  // Try to get artwork from various sources
  if (asset.albumId) {
    // In a real implementation, you might want to cache this
    return `asset://${asset.albumId}`;
  }
  
  return undefined;
}; 