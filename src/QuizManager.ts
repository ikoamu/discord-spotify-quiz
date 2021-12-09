import { Client, Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { PlayerManager } from "./PlayerManager";
import { choiceOtherTracks, createAnswerEmbed, createQuizResult, shuffleTracks } from "./quiz";
import { SpotifyApi } from './SpotifyApi'

export class QuizManager {
  private spotifyApi = new SpotifyApi();

  private allTracks: SpotifyApi.TrackObjectSimplified[] = [];
  private answers: SpotifyApi.TrackObjectSimplified[] = [];

  private quizCount = 0;
  private correctCount = 0;

  private cachedMessage: Message | null = null;
  private cachedPlaylistId: string | null = null;

  getPlaylist() {
    return this.cachedPlaylistId;
  }

  getMessage() {
    return this.cachedMessage;
  }

  saveMessage(message: Message) {
    this.cachedMessage = message;
  }

  clearMessage() {
    this.cachedMessage = null;
  }

  savePlaylistId(playlistId: string) {
    this.cachedPlaylistId = playlistId;
  }

  clearPlaylistId() {
    this.cachedPlaylistId = null;
  }

  isQuizExist() {
    return !!this.answers.length;
  };

  setAllTracks(tracks: SpotifyApi.TrackObjectSimplified[]) {
    this.allTracks = tracks;
  }

  setAnswers(count: number) {
    if (!this.allTracks.length) return;

    const answerLength = this.allTracks.length < count ? this.allTracks.length : count;
    this.answers = shuffleTracks(this.allTracks.filter(t => !!t.preview_url)).slice(0, answerLength);
  }

  startQuiz(message: Message) {
    if (!this.answers.length) {
      message.channel.send("quiz is ended.");
      return;
    }
  }

  async sendQuiz(message: Message, artistName: string, playerManager: PlayerManager) {
    if (!this.answers.length) {
      return;
    }

    const answer = await this.spotifyApi.getTrack(this.answers.pop()!.id);
    const quiz = shuffleTracks([answer, ...choiceOtherTracks(answer, this.allTracks)]);

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

    playerManager.play(answer.preview_url);

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

        const isCorrect = quiz[selectedIndex].id === answer.id;
        if (isCorrect) {
          this.correctCount++;
        } else {
          member?.voice.disconnect();
        }

        const answerEmbed = await message.channel.send({
          embeds: [
            createAnswerEmbed(
              answer,
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
      await message.channel.send({ embeds: [createAnswerEmbed(answer, null, "timeup")] });
    }
  }

  async sendResult(message: Message) {
    await message.channel.send({ embeds: [createQuizResult(this.quizCount, this.correctCount)] });
  }

  clear() {
    this.quizCount = 0;
    this.correctCount = 0;
    this.allTracks = [];
    this.answers = [];
    this.cachedPlaylistId = null;
    this.cachedPlaylistId = null;
  }
};