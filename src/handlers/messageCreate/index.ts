import { Awaitable, ClientEvents } from 'discord.js';
import { PlayerManager, QuizManager, SpotifyApiManager } from '../../managers';
import { search, isSearch } from "./search";
import { start, isStart } from "./start";
import { suspend, isSuspend } from "./suspend";

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
      if (message.content === "?join") {
        playerManager.join(message);
      }
      else if (message.content === "?leave") {
        playerManager.leave();
      }
      else if (isSuspend(message)) {
        await suspend(message, playerManager, quizManager);
      }
      else if (isSearch(message)) {
        await search(message, quizManager, spotifyApiManager);
      }
      else if (isStart(message)) {
        await start(message, playerManager, quizManager, spotifyApiManager)
      }
    };