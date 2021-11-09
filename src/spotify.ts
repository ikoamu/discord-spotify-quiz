import fetch from "node-fetch";
import { config } from 'dotenv';

config();
const baseUrl = process.env.SPOTIFY_BASE_URL;
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

const get = async (url: string, token?: string) => {
  const data = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token || await getToken()}`,
    }
  });

  return await data.json();
}

const getToken = async () => {
  const result = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    body: 'grant_type=client_credentials'
  })

  const token = (await result.json())["access_token"];
  return token;
}

export const getPreviewUrl = async (trackId: string) => {
  const track = await get(`${baseUrl}tracks/${trackId}`);
  const previewUrl = track["preview_url"];
  return previewUrl;
}

export const getArtistAlbums = async (artistId: string) => {
  const albums = await get(`${baseUrl}artists/${artistId}/albums`);
  return albums.items.map((album: any) => {
    return {
      name: album.name,
      id: album.id,
    } as { name: string; id: string };
  })
};

export const searchArtist = async (word: string) => {
  const result = await get(`${baseUrl}search?q=${word}&type=artist&limit=5`);
  return result["artists"]["items"];
}

export const searchPlaylist = async (word: string) => {
  const result = await get(`${baseUrl}search?q=${word}&type=playlist&limit=10`);
  return result["playlists"]["items"];
}

export const getAlubumTracks = async (albumId: string, token?: string) => {
  const result = await get(`${baseUrl}albums/${albumId}/tracks`);
  return result["items"];
}

export const getAllTracks = async (albumIds: string[]) => {
  const token = await getToken();
  const array: any[] = [];
  const albumTracks = await Promise.all(albumIds.map(async albumId => {
    const result = await getAlubumTracks(albumId, token);
    array.concat(...result);
    return result;
  }));

  return albumTracks;
}