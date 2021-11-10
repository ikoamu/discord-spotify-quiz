import { Client, Intents, Message, MessageActionRow, MessageButton, MessageEmbed, TextChannel, User } from 'discord.js';
import { config } from 'dotenv';
import { PlayerManager } from './PlayerManager';
import { SpotifyApi } from './SpotifyApi'
import { QuizManager } from './QuizManager';
import { chunk } from "./utils";

config();
const token = process.env.DISCORD_TOKEN;
const questionsDefault = 1;
const questionsMax = 100;
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
  const spotifyApi = new SpotifyApi();
  const quizManager = new QuizManager();
  let cachedMessage: Message | null = null;
  let cachedPlaylistId: string | null = null;

  client.on("messageCreate", async (message) => {

    /**
     * artist quiz
     */
    if (message.content.startsWith("?q ")) {
      const command = message.content.replace("?q ", "");
      let questions = questionsDefault;
      if (/.*-n \d+/.test(command)) {
        const questionsStr = command.match(/-n \d+/);
        const questionsNum = !!questionsStr ? Number(questionsStr[0].replace("-n ", "")) : questionsDefault;
        questions = isNaN(questionsNum) || questionsNum > questionsMax ? questionsDefault : questionsNum;
      }

      const key = command.replace(/-n \d+/, "");

      if (!key) return;

      const searchResult = await spotifyApi.searchArtist(key);
      if (!searchResult || !searchResult.length) {
        message.channel.send(`\`${key}\` is not found.`);
        return;
      }

      const artistName = searchResult[0].name;
      const artistId = searchResult[0].id;

      message.channel.send(`Start ${artistName} Quiz (${questions} questions)`);

      if (!playerManager.isReady()) {
        message.channel.send("Bot is not ready. use \`?join\`");
        return;
      }

      const tracks = await spotifyApi.getAllTracksFromArtistId(artistId);

      quizManager.setAllTracks(tracks);
      quizManager.setAnswers(questions);
      for (let i = 0; i < questions; i++) {
        if (quizManager.isQuizExist()) {
          await quizManager.sendQuiz(message, artistName, playerManager);
        } else {
          break;
        }
      }

      await quizManager.sendResult(message);
      quizManager.clear();
    }
    /**
     * playlist quiz
     */
    else if (message.content.startsWith("?pl ")) {
      const command = message.content.replace("?pl ", "");
      let questions = questionsDefault;
      if (/.*-n \d+/.test(command)) {
        const questionsStr = command.match(/-n \d+/);
        const questionsNum = !!questionsStr ? Number(questionsStr[0].replace("-n ", "")) : questionsDefault;
        questions = isNaN(questionsNum) || questionsNum > questionsMax ? questionsDefault : questionsNum;
      }

      const playlistId = command.replace(/-n \d+/, "").trim();

      if (!playlistId) return;

      let playlist
      try {
        playlist = await spotifyApi.getPlaylist(playlistId);
      } catch (err) {
        message.channel.send(`\`${playlistId}\` is invalid. use \`?search pl <keyword>\``);
      }
      if (!playlist || !playlist.tracks.items.length) {
        message.channel.send(`\`${playlistId}\` is not found.`);
        return;
      }

      message.channel.send(`Start ${playlist.name} Quiz (${questions} questions)`);

      if (!playerManager.isReady()) {
        message.channel.send("Bot is not ready. use \`?join\`");
        return;
      }

      const tracks = playlist.tracks.items.map(t => t.track);
      quizManager.setAllTracks(tracks);
      quizManager.setAnswers(questions);
      for (let i = 0; i < questions; i++) {
        await quizManager.sendQuiz(message, playlist.name, playerManager);
      }

      await quizManager.sendResult(message);
      quizManager.clear();
    }
    /**
     * search playlist
     */
    else if (message.content.startsWith("?search pl")) {
      const key = message.content.replace("?search pl ", "");
      const result = await spotifyApi.searchPlaylist(key);

      if (!!result && result.length) {
        message.channel.send(result.map(pl => {
          return pl.name + `: \`${pl.id}\``;
        }).join("\n \n"));
      } else {
        message.channel.send(`\`${key}\` is not found.`)
      }
    }
    /**
     * join voice channcel
     */
    else if (message.content === "?join") {
      playerManager.join(message);
    }
    /**
     * leave voice channel
     */
    else if (message.content === "?leave") {
      playerManager.leave();
    }
    /**
     * test
     */
    else if (message.content.startsWith("?search ")) {
      cachedMessage = message;
      const key = message.content.replace("?search ", "");
      const result = await spotifyApi.searchPlaylist(key);

      if (!!result && result.length) {
        let index = 0;
        const mappedResult = chunk(result, 5);

        const loopResult = async () => {
          const sendResult = async () => {
            return await message.channel.send({
              content: index === 0 ? `\`${key}\` has ${result.length} results. Click on \`👇\` to see more results. \n (1/${mappedResult.length})` : `(${index + 1}/${mappedResult.length})`,
              components: [...mappedResult[index].map(r => {
                return new MessageActionRow()
                  .addComponents(
                    new MessageButton()
                      .setCustomId(r.id)
                      .setStyle("SECONDARY")
                      .setLabel(`${r.name} (${r.tracks.total} songs)`)
                  )
              })]
            });
          }

          const resultMessage = await sendResult();
          index++;

          if (index < mappedResult.length) {
            await resultMessage.react("👇");
            const collected = await resultMessage.awaitReactions({
              max: 1,
              filter: (reaction, user) => reaction.emoji.name === "👇" && !user.bot
            });

            if (collected) {
              await loopResult();
            }
          }
        }
        await loopResult();
      } else {
        message.channel.send(`\`${key}\` is not found.`)
      }
    }
    else if (message.content.startsWith("?start ")) {
      const questionsNum = Number(message.content.replace("?start ", ""));
      const questions = isNaN(questionsNum) ? questionsDefault : questionsNum;

      const playlistId = cachedPlaylistId;
      cachedPlaylistId = null;

      if (!playlistId) return;

      let playlist
      try {
        playlist = await spotifyApi.getPlaylist(playlistId);
      } catch (err) {
        message.channel.send(`\`${playlistId}\` is invalid. use \`?search <keyword>\``);
      }
      if (!playlist || !playlist.tracks.items.length) {
        message.channel.send(`\`${playlistId}\` is not found.`);
        return;
      }

      message.channel.send(`Start ${playlist.name} Quiz (${questions} questions)`);

      if (!playerManager.isReady()) {
        message.channel.send("Bot is not ready. use \`?join\`");
        return;
      }

      const tracks = playlist.tracks.items.map(t => t.track);
      quizManager.setAllTracks(tracks);
      quizManager.setAnswers(questions);
      for (let i = 0; i < questions; i++) {
        await quizManager.sendQuiz(message, playlist.name, playerManager);
      }

      await quizManager.sendResult(message);
      quizManager.clear();
    } else if (message.content === "?suspend") {
      quizManager.clear();
      const msg = await message.channel.send("quiz has suspended.");
      await msg.react("✅");

      const nextCommand = await msg.awaitReactions({
        max: 1,
        time: 20000,
      });
      if (nextCommand) {
        playerManager.stop();
      }
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (!!cachedMessage && "customId" in interaction) {
      // @ts-ignore

      const playlistId = interaction["customId"];
      cachedPlaylistId = playlistId;
      if (playerManager.join(cachedMessage)) {
        // @ts-ignore
        await interaction.reply({
          content: "👉 Please specify the number of questions and start the quiz. \n \`?start <questions>\`",
          ephemeral: false
        });
      };
    }
  });

  client.on('ready', () => {
    console.log("on ready");
  });
  client.login(token);
})();