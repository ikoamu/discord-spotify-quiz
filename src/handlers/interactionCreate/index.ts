import { Awaitable, ClientEvents } from 'discord.js';
import { prefix } from '../../config';
import { PlayerManager, QuizManager } from "../../managers";

export const handleOnInteractionCreate: (
  playerManager: PlayerManager,
  quizManager: QuizManager,
) => (...args: ClientEvents['interactionCreate']) => Awaitable<void> =
  (playerManager, quizManager) => async (interaction) => {
    if (interaction.isButton()) {
      if (quizManager.isStarted()) {
        return await interaction.reply({
          content: `‼ Quiz is already underway. \n If you want to hold a new quiz, please suspend the current quiz with \`${prefix}suspend\`.`,
          ephemeral: false
        });
      }

      const message = quizManager.getMessage();
      if (!!message) {
        quizManager.savePlaylistId(interaction.customId);
        if (playerManager.join(message)) {
          await interaction.reply({
            content: `👉 Please specify the number of questions and start the quiz. \n \`${prefix}start <questions>\``,
            ephemeral: false
          });
        };
      }
    }
  };