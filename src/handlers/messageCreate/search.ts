import { Message, MessageActionRow, MessageButton } from "discord.js";
import { prefix } from "../../config";
import { QuizManager, SpotifyApiManager } from "../../managers";
import { chunk, omitText } from "../../utils/common";

const command = `${prefix}search `;

export const isSearch = (message: Message) => {
  return message.content.startsWith(command);
}

export const search = async (
  message: Message,
  quizManager: QuizManager,
  spotifyApiManager: SpotifyApiManager
) => {
  quizManager.saveMessage(message);
  const key = message.content.replace(command, "");
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
                  .setLabel(`${omitText(r.name, ` (${r.tracks.total} songs)`, 80)}`)
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