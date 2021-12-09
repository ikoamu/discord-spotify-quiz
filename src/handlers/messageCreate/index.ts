import { Awaitable, ClientEvents, MessageActionRow, MessageButton } from 'discord.js';
import { PlayerManager, QuizManager, SpotifyApiManager } from '../../managers';
import { chunk, omitText } from "../../utils";

const questionsDefault = 1;

export const handleOnMessageCreate: (
  playerManager: PlayerManager,
  quizManager: QuizManager,
  spotifyApiManager: SpotifyApiManager,
) => (
    ...args: ClientEvents['messageCreate']
  ) => Awaitable<void> = (
    playerManager,
    quizManager,
    spotifyApiManager,
  ) => async (
    message
  ) => {
      /**
       * join voice channcel
       */
      if (message.content === "?join") {
        playerManager.join(message);
      }
      /**
       * leave voice channel
       */
      else if (message.content === "?leave") {
        playerManager.leave();
      }
      /**
     * search playlist
     */
      else if (message.content.startsWith("?search ")) {
        quizManager.saveMessage(message);
        const key = message.content.replace("?search ", "");
        const result = await spotifyApiManager.searchPlaylist(key);

        if (!!result && result.length) {
          let index = 0;
          const mappedResult = chunk(result, 5);

          const loopResult = async () => {
            const sendResult = async () => {
              return await message.channel.send({
                content: index === 0 ? `\`${key}\` has ${result.length} results. Click on \`👇\` to see more results. \n (1/${mappedResult.length})`
                  : `(${index + 1}/${mappedResult.length})`,
                components: [...mappedResult[index].map(r => {
                  return new MessageActionRow()
                    .addComponents(
                      new MessageButton()
                        .setCustomId(r.id)
                        .setStyle("SECONDARY")
                        .setLabel(`${omitText(r.name, 30)} (${r.tracks.total} songs)`)
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

        const playlistId = quizManager.getPlaylist();
        quizManager.clearPlaylistId();

        if (!playlistId) return;

        let playlist
        try {
          playlist = await spotifyApiManager.getPlaylist(playlistId);
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
    };