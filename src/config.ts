import { config } from 'dotenv';

config();

export const prefix = process.env.PREFIX || "?";
export const token = process.env.DISCORD_TOKEN;

export const clientId = process.env.SPOTIFY_CLIENT_ID;
export const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
