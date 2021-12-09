import SpotifyWebApi from 'spotify-web-api-node';
import fetch from "node-fetch";
import { config } from 'dotenv';

config();
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

export class SpotifyApiManager {
  private api = new SpotifyWebApi();

  private setToken = async () => {
    const result = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: 'grant_type=client_credentials'
    })

    const token = (await result.json())["access_token"];
    this.api.setAccessToken(token);
  }

  public getArtist = async (id: string) => {
    await this.setToken();
    return (await this.api.getArtist(id)).body;
  }

  public getTrack = async (trackId: string) => {
    await this.setToken();
    return (await this.api.getTrack(trackId)).body;
  }

  public getPreviewUrl = async (trackId: string) => {
    return (await this.getTrack(trackId)).preview_url;
  }

  public getAllTracks = async (albumIds: string[]) => {
    await this.setToken();
    const tracks: SpotifyApi.TrackObjectSimplified[] = [];
    await Promise.all(albumIds.map(async id => {
      const albumTracks = (await this.api.getAlbumTracks(id)).body.items;
      tracks.concat(...albumTracks)
    }));

    return tracks;
  }

  public getArtistAlbums = async (artistId: string) => {
    await this.setToken();
    return (await this.api.getArtistAlbums(artistId)).body.items;
  }

  public getAlbumTracks = async (albumId: string) => {
    await this.setToken();
    return (await this.api.getAlbumTracks(albumId)).body.items;
  }

  public getAllTracksFromArtistId = async (artistId: string) => {
    await this.setToken();
    const albumIds = (await this.api.getArtistAlbums(artistId)).body.items.map(album => album.id);
    const allTracks = await Promise.all(albumIds.map(async albumId => {
      return (await this.api.getAlbumTracks(albumId)).body.items;
    }));

    return allTracks.reduce((prev, current) => prev.concat(current), []);
  }

  public getPlaylist = async (playlistId: string) => {
    await this.setToken();
    return (await this.api.getPlaylist(playlistId)).body;
  }

  public searchArtist = async (word: string) => {
    await this.setToken();
    return (await this.api.searchArtists(word)).body.artists?.items;
  }

  public searchPlaylist = async (word: string, options?: { offset?: number | undefined; }) => {
    await this.setToken();
    return (await this.api.searchPlaylists(word, options)).body.playlists?.items;
  }
}
