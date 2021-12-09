import { Awaitable, ClientEvents } from 'discord.js';
import { PlayerManager, QuizManager } from "../../managers";

export const handleOnInteractionCreate: (
  playerManager: PlayerManager,
  quizManager: QuizManager,
) => (...args: ClientEvents['interactionCreate']) => Awaitable<void> =
  (playerManager, quizManager) => async (interaction) => {
    const message = quizManager.getMessage();
    if (interaction.isButton() && !!message) {
      quizManager.savePlaylistId(interaction.customId);
      if (playerManager.join(message)) {
        await interaction.reply({
          content: "👉 Please specify the number of questions and start the quiz. \n \`?start <questions>\`",
          ephemeral: false
        });
      };
    }
  };