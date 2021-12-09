# 🕵️‍♀️discord-spotify-quiz

**discord-spotify-quiz** is a Discord Bot that lets you play a song guessing quiz using Spotify playlists.

## How to play

### 1️⃣ : Search the playlist with the `?search` command
<img width="485" alt="1" src="https://user-images.githubusercontent.com/38206334/145382664-7f5e58cf-0fb2-4f14-8e8a-0c9bf7d6ee14.png">

### 2️⃣ : Click on the playlist you want to use for the quiz.
![2](https://user-images.githubusercontent.com/38206334/145384008-c464ce68-2cb2-438c-9659-9176fa6a3f50.gif)

### 3️⃣ : Specify the number of questions and `?start`.
![3-2](https://user-images.githubusercontent.com/38206334/145385843-a89e9d5d-e7fe-4354-bc40-15181bed6062.gif)

## Prerequisites
- Node.js - Version 16 or higher
- ffmpeg

## Getting started
Create an application from https://developer.spotify.com and get the client ID and client secret.

Rename **.env.sample** to **.env** and set the spotify client ID, client secret and DiscordBot token.and set the spotify client ID, client secret and DiscordBot token.

```
DISCORD_TOKEN=discord_token
SPOTIFY_CLIENT_ID=spotify_client_id
SPOTIFY_CLIENT_SECRET=spotify_client_secret
```

Use npm (or yarn) to install the package and run the bot.

```
$ npm install

$ npm run build

$ npm run start
```
