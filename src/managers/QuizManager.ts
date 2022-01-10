import { Message, MessageEmbed } from "discord.js";
import { choiceOtherTracks, createAnswerEmbed, createQuizResult, shuffleTracks } from "../utils/quiz";
import { PlayerManager, AnswerersManager, SpotifyApiManager } from "../managers";

export class QuizManager {
  private spotifyApi = new SpotifyApiManager();
  private answerersManager = new AnswerersManager();

  private allTracks: SpotifyApi.TrackObjectSimplified[] = [];
  private answers: SpotifyApi.TrackObjectSimplified[] = [];

  private quizCount = 0;
  private correctCount = 0;

  private cachedMessage: Message | null = null;
  private cachedPlaylistId: string | null = null;

  private started = false;

  isStarted() {
    return this.started;
  };

  start() {
    this.started = true;
  };

  getPlaylist() {
    return this.cachedPlaylistId;
  };

  getMessage() {
    return this.cachedMessage;
  };

  saveMessage(message: Message) {
    this.cachedMessage = message;
  };

  clearMessage() {
    this.cachedMessage = null;
  };

  savePlaylistId(playlistId: string) {
    this.cachedPlaylistId = playlistId;
  };

  clearPlaylistId() {
    this.cachedPlaylistId = null;
  };

  isQuizExist() {
    return !!this.answers.length;
  };

  setAllTracks(tracks: SpotifyApi.TrackObjectSimplified[]) {
    this.allTracks = tracks;
  };

  setAnswers(count: number) {
    if (!this.allTracks.length) return;

    const answerLength = this.allTracks.length < count ? this.allTracks.length : count;
    this.answers = shuffleTracks(this.allTracks.filter(t => !!t.preview_url)).slice(0, answerLength);
  };

  startQuiz(message: Message) {
    if (!this.answers.length) {
      message.channel.send("quiz is ended.");
      return;
    }
  };

  async sendQuiz(message: Message, artistName: string, playerManager: PlayerManager) {
    if (!this.answers.length) {
      return;
    }

    const correctTrack = await this.spotifyApi.getTrack(this.answers.pop()!.id);
    const quiz = shuffleTracks([correctTrack, ...choiceOtherTracks(correctTrack, this.allTracks)]);

    this.quizCount++;
    const question = await message.channel.send({
      embeds: [new MessageEmbed().setTitle("QUIZ").addField(artistName, `
1️⃣: ${quiz[0].name}

2️⃣: ${quiz[1].name}

3️⃣: ${quiz[2].name}

4️⃣: ${quiz[3].name}`)]
    });

    await question.react("1️⃣");
    await question.react("2️⃣");
    await question.react("3️⃣");
    await question.react("4️⃣");

    playerManager.play(correctTrack.preview_url);

    try {
      const collected = await question.awaitReactions({
        filter: (reaction, user) => {
          return [
            '1️⃣',
            '2️⃣',
            '3️⃣',
            '4️⃣',
          ].includes(reaction.emoji.name || "") && !user.bot
        },
        max: 1,
        time: 33000,
        errors: ["time"]
      });

      if (collected) {
        const reaction = collected.first();
        const user = (await reaction?.users.fetch())?.find(r => !r.bot);
        const selectedIndex = reaction?.emoji.name === "1️⃣" ? 0
          : reaction?.emoji.name === "2️⃣" ? 1
            : reaction?.emoji.name === "3️⃣" ? 2 : 3;
        const guild = message.guild;
        const member = guild?.members.cache.get(user!.id);

        const isCorrect = quiz[selectedIndex].id === correctTrack.id;
        if (isCorrect) this.correctCount++;
        if (member) {
          this.answerersManager.setAnswer(member, isCorrect ? "correct" : "incorrect");
        }

        const answerEmbed = await message.channel.send({
          embeds: [
            createAnswerEmbed(
              correctTrack,
              member?.displayName || null,
              isCorrect ? "correct" : "incorrect"
            )
          ],
        });
        await answerEmbed.react("✅");

        const nextCommand = await answerEmbed.awaitReactions({
          max: 1,
          time: 20000,
          filter: (reaction, user) => {
            return reaction.emoji.name === "✅" && !user.bot
          }
        });
        if (nextCommand) {
          playerManager.stop();
        }
      }
    } catch {
      await message.channel.send({ embeds: [createAnswerEmbed(correctTrack, null, "timeup")] });
    }
  };

  async sendResult(message: Message) {
    await message.channel.send({
      embeds: [
        createQuizResult(this.quizCount, this.correctCount, this.answerersManager.getAnswerers())]
    });
  };

  clear() {
    this.quizCount = 0;
    this.correctCount = 0;
    this.allTracks = [];
    this.answers = [];
    this.cachedPlaylistId = null;
    this.cachedPlaylistId = null;
    this.started = false;
    this.answerersManager.clear();
  };
};