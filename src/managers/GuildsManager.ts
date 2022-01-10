import { PlayerManager, SpotifyApiManager, QuizManager } from ".";

type Managers = {
  playerManager: PlayerManager;
  spotifyApiManager: SpotifyApiManager;
  quizManager: QuizManager;
}

interface GuildList {
  [guildId: string]: Managers;
}

export class GuildsManager {
  private guildList: GuildList = {};

  get(guildId: string) {
    const info = this.guildList[guildId];
    return !!info ? this.guildList[guildId] : null;
  }

  set(guildId: string) {
    this.guildList[guildId] = {
      playerManager: new PlayerManager(),
      spotifyApiManager: new SpotifyApiManager(),
      quizManager: new QuizManager(),
    }
  }

  isExists(guildId: string) {
    return !!this.guildList[guildId];
  }
}
