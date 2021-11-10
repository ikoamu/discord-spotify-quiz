import { MessageEmbed } from "discord.js";

export type Track = {
  id: string;
  name: string;
  url: string;
}

export const shuffleTracks = (tracks: SpotifyApi.TrackObjectSimplified[]) => {
  return tracks.sort(() => Math.random() - 0.5);
};


export const choiceOtherTracks = (
  answerTrack: SpotifyApi.TrackObjectSimplified,
  allTracks: SpotifyApi.TrackObjectSimplified[],
  count: number = 3,
) => {
  return shuffleTracks(
    allTracks.filter(t => t.id !== answerTrack.id)
  ).slice(0, count);
}

export const createAnswerEmbed = (
  answerTrack: SpotifyApi.TrackObjectFull,
  username: string | null,
  type: "correct" | "incorrect" | "timeup" = "correct"
) => {
  return new MessageEmbed()
    .setTitle((
      !!username && type !== "timeup" ? `${username}` : ""
    ) + (
        type === "correct" ? "🙆‍♂️ Correct"
          : type === "incorrect" ? "👎 Incorrect" : "⏰ Timeup")
    )
    .setColor(type === "correct" ? "GREEN" : "RED")
    .setThumbnail(answerTrack.album.images[0].url)
    .setFields([{
      name: answerTrack.name,
      value: `${answerTrack.album.name}

      ${answerTrack.album.release_date}
      `
    }])
    .setDescription(answerTrack.artists[0].name);
}

export const createQuizResult = (quizCount: number, correctCount: number) => {
  return new MessageEmbed()
    .setTitle("Result")
    .setColor("ORANGE")
    .setDescription(`${correctCount} correct answers out of ${quizCount} questions.`);
}