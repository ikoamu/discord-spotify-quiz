import { Message } from "discord.js";
import { prefix } from "../../config";
import { PlayerManager, QuizManager, SpotifyApiManager } from "../../managers";

const questionsDefault = 1;

const command = `${prefix}start `;

export const isStart = (message: Message) => {
  return message.content.startsWith(command);
}

export const start = async (
  message: Message,
  playerManager: PlayerManager,
  quizManager: QuizManager,
  spotifyApiManager: SpotifyApiManager
) => {
  const questionsNum = Number(message.content.replace(command, ""));
  const questions = isNaN(questionsNum) ? questionsDefault : questionsNum;

  const playlistId = quizManager.getPlaylist();
  quizManager.clearPlaylistId();

  if (!playlistId) return;

  let playlist
  try {
    playlist = await spotifyApiManager.getPlaylist(playlistId);
  } catch (err) {
    message.channel.send(`\`${playlistId}\` is invalid. use \`${prefix}search <keyword>\``);
  }
  if (!playlist || !playlist.tracks.items.length) {
    message.channel.send(`\`${playlistId}\` is not found.`);
    return;
  }

  message.channel.send(`Start ${playlist.name} Quiz (${questions} questions)`);
  if (!playerManager.isReady()) {
    message.channel.send(`Bot is not ready. use \`${prefix}join\``);
    return;
  }

  const tracks = playlist.tracks.items.map(t => t.track);
  quizManager.setAllTracks(tracks);
  quizManager.setAnswers(questions);
  quizManager.start();
  for (let i = 0; i < questions; i++) {
    await quizManager.sendQuiz(message, playlist.name, playerManager);
  }

  await quizManager.sendResult(message);
  await message.channel.send(playlist.external_urls.spotify);
  quizManager.clear();
}