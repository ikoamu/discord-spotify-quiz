import { GuildMember } from "discord.js";

export type Answerer = {
  id: string;
  displayName: string;
  correctCount: number;
  incorrectCount: number;
};

export class AnswerersManager {
  private answerers: Answerer[] = [];

  getAnswerers() {
    return this.answerers.sort((a1, a2) => {
      if (a2.correctCount === a1.correctCount) {
        return a1.incorrectCount - a2.incorrectCount;
      }
      return a2.correctCount - a1.correctCount;
    });
  };

  setAnswer(member: GuildMember, status: "correct" | "incorrect") {
    if (status === "correct") {
      this.correct(member);
    } else {
      this.incorrect(member);
    }
  };


  correct(member: GuildMember) {
    const index = this.answerers.findIndex(a => a.id === member.id);
    if (index > -1) {
      const tmp = this.answerers[index];
      this.answerers[index] = {
        ...tmp,
        correctCount: tmp.correctCount++,
      }
    } else {
      this.setMember(member, 1, 0);
    }
  }

  incorrect(member: GuildMember) {
    const index = this.answerers.findIndex(a => a.id === member.id);
    if (index > -1) {
      const tmp = this.answerers[index];
      this.answerers[index] = {
        ...tmp,
        incorrectCount: tmp.incorrectCount++,
      }
    } else {
      this.setMember(member, 0, 1);
    }
  }

  setMember(
    member: GuildMember,
    correctCount: number = 0,
    incorrectCount: number = 0,
  ) {
    this.answerers.push({
      id: member.id,
      displayName: member.displayName,
      correctCount,
      incorrectCount,
    });
  };

  clear() {
    this.answerers = [];
  }
}