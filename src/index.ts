import { Client, Intents } from 'discord.js';
import { handleOnInteractionCreate, handleOnMessageCreate } from "./handlers";
import { prefix, token } from './config';
import { GuildsManager } from './managers/GuildsManager';

(async function main() {
  const client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_VOICE_STATES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ]
  });

  const guildsManager = new GuildsManager();

  client.on(
    "messageCreate",
    (message) => {
      const guildId = message.guildId;
      if (guildId) {
        if (!guildsManager.isExists(guildId)) {
          guildsManager.set(guildId);
        }

        const managers = guildsManager.get(guildId);
        if (managers) {
          handleOnMessageCreate(
            managers.playerManager,
            managers.quizManager,
            managers.spotifyApiManager
          )(message);
        }
      }
    }
  );
  client.on(
    "interactionCreate",
    (interaction) => {
      const guildId = interaction.guildId;
      if (guildId) {
        if (!guildsManager.isExists(guildId)) {
          guildsManager.set(guildId);
        }

        const managers = guildsManager.get(guildId);
        if (managers) {
          handleOnInteractionCreate(
            managers.playerManager,
            managers.quizManager
          )(interaction);
        }
      }
    }
  );

  client.on('ready', () => {
    client.user?.setActivity(`Let's start the quiz with \"${prefix}search [keyword]\"`);
  });
  client.login(token);
})();

