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

  private prevIncorrectUserId = "";

  public isQuizExist = () => {
    return !!this.answers.length;
  };

  public setAllTracks(tracks: SpotifyApi.TrackObjectSimplified[]) {
    this.allTracks = tracks;
  }

  public setAnswers(count: number) {
    if (!this.allTracks.length) return;

    const answerLength = this.allTracks.length < count ? this.allTracks.length : count;
    this.answers = shuffleTracks(this.allTracks.filter(t => !!t.preview_url)).slice(0, answerLength);
  }

  public startQuiz(message: Message) {
    if (!this.answers.length) {
      message.channel.send("quiz is ended.");
      return;
    }
  }

  public async sendQuiz(message: Message, artistName: string, playerManager: PlayerManager) {
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
          ].includes(reaction.emoji.name || "") && !user.bot && user.id !== this.prevIncorrectUserId;
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
          this.prevIncorrectUserId = "";
        } else {
          this.prevIncorrectUserId = member?.id || "";
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
        });
        if (nextCommand) {
          const reaction = collected.first();
          playerManager.stop();
        }
      }
    } catch {
      this.prevIncorrectUserId = "";
      await message.channel.send({ embeds: [createAnswerEmbed(answer, null, "timeup")] });
    }
  }

  public async sendResult(message: Message) {
    await message.channel.send({ embeds: [createQuizResult(this.quizCount, this.correctCount)] });
  }

  public clear() {
    this.quizCount = 0;
    this.correctCount = 0;

    this.allTracks = [];
    this.answers = [];
  }
};