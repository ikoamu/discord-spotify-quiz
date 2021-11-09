import { AudioPlayer, createAudioResource, VoiceConnection } from '@discordjs/voice';
import { createAudioPlayer, joinVoiceChannel } from '@discordjs/voice';
import { Message } from 'discord.js';

export class PlayerManager {
  private player: AudioPlayer | null = null;
  private connection: VoiceConnection | null = null;

  get() {
    return this.player;
  }

  set(player: AudioPlayer) {
    this.player = player;
  }

  joinVoiceChannel(message: Message) {
    if (!!this.player && !!this.connection) return;

    const channel = message.member?.voice.channel;
    this.connection = joinVoiceChannel({
      channelId: channel?.id || "",
      guildId: message.guildId!,
      adapterCreator: message.guild?.voiceAdapterCreator as any
    });

    if (this.connection.rejoin()) {
      this.set(createAudioPlayer());
      if (this.player) this.connection?.subscribe(this.player);
    }
  }



  leave() {
    this.connection?.disconnect();
  }

  preview(url: string) {
    this.player?.play(createAudioResource(url));
  }

  isReady() {
    return !!this.player;
  }
}
