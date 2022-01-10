import { Message } from "discord.js";
import { prefix } from "../../config";
import { PlayerManager, QuizManager } from "../../managers";

export const isSuspend = (message: Message) => {
  return message.content === `${prefix}suspend`;
}

export const suspend = async (
  message: Message,
  playerManager: PlayerManager,
  quizManager: QuizManager
) => {
  const result = await message.channel.send("quiz has suspended.");
  await result.react("✅");
  quizManager.clear();

  // Click ✅ to stop the music playing.
  const nextCommand = await result.awaitReactions({
    max: 1,
    time: 20000,
  });
  if (nextCommand) {
    playerManager.stop();
  }
}