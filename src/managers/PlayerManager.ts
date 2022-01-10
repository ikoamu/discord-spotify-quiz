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

  join(message: Message) {
    // already in.
    if (!!this.player && !!this.connection) return true;

    const channel = message.member?.voice.channel;
    if (!channel) {
      message.channel.send("❗Cannot start the quiz because you have not joined the voice channel.")
      return false;
    }
    this.connection = joinVoiceChannel({
      channelId: channel?.id || "",
      guildId: message.guildId!,
      adapterCreator: message.guild?.voiceAdapterCreator as any
    });

    if (this.connection.rejoin()) {
      this.set(createAudioPlayer());
      if (this.player) this.connection?.subscribe(this.player);
    }

    return true;
  }

  leave() {
    this.connection?.disconnect();
  }

  play(url?: string | null | undefined) {
    if (!url) return;
    const resource = createAudioResource(url, { inlineVolume: true });
    resource.volume?.setVolume(0.01);
    this.player?.play(resource);
  }

  isReady() {
    return !!this.player;
  }

  stop() {
    this.player?.stop();
  }
}
