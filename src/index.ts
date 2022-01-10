import { Client, Intents } from 'discord.js';
import { QuizManager, PlayerManager, SpotifyApiManager } from './managers';
import { handleOnInteractionCreate, handleOnMessageCreate } from "./handlers";
import { prefix, token } from './config';

(async function main() {
  const client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_VOICE_STATES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ]
  });

  const playerManager = new PlayerManager();
  const spotifyApiManager = new SpotifyApiManager();
  const quizManager = new QuizManager();

  client.on(
    "messageCreate",
    handleOnMessageCreate(playerManager, quizManager, spotifyApiManager)
  );
  client.on(
    "interactionCreate",
    handleOnInteractionCreate(playerManager, quizManager)
  );

  client.on('ready', () => {
    client.user?.setActivity(`Let's start the quiz with \"${prefix}search [keyword]\"`);
  });
  client.login(token);
})();

