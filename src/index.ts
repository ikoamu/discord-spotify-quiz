import { Client, Intents, MessageEmbed } from 'discord.js';
import { config } from 'dotenv';
import { PlayerManager } from './PlayerManager';
import { choiceOtherTracks, shuffleTracks } from "./quiz";
import { getAllTracks, getAlubumTracks, getArtistAlbums, getPreviewUrl, searchArtist, searchPlaylist } from './spotify';

config();
const token = process.env.DISCORD_TOKEN;

(async function main() {
  const playerManager = new PlayerManager();

  const client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_VOICE_STATES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ]
  });

  client.on("interactionCreate", (interaction) => {

  });

  client.on("messageCreate", async (message) => {

    /**
     * ?q `artistName` `count`
     */
    if (message.content.startsWith("?q ")) {
      const [, key, num] = message.content.split(" ");

      if (!key) return;

      const searchResult = await searchArtist(key);
      if (!searchResult.length) {
        message.channel.send(`\`${key}\` が見つかりませんでした`);
        return;
      }

      const artistName = searchResult[0].name;
      const artistId = searchResult[0].id;

      const questionCount = isNaN(Number(num)) ? 1 : Number(config);

      message.channel.send(`
      ${artistName} のクイズを開始します (全${questionCount}門)
      `)

      if (!playerManager.isReady()) {
        playerManager.joinVoiceChannel(message);
      }

      const albumIds: string[] = (await getArtistAlbums(artistId)).map((elm: { id: string }) => elm.id);
      const result = await getAllTracks(albumIds);
      const tracks: { name: string; id: string; url: string }[] = [];
      result.map((r: any) => {
        r.forEach((elm: any) => {
          tracks.push({ id: elm.id, name: elm.name, url: elm["preview_url"] } as any);
        });
      });
      const shuffledTracks = shuffleTracks(tracks);
      // const answerTrack = shuffledTracks.shift();
      // console.log("choiceOtherTracks", choiceOtherTracks(shuffledTracks[0], tracks));

      message.channel.send({
        embeds: [new MessageEmbed().setTitle("QUIZ").addField("サカナクション", `
        1️⃣: ${shuffledTracks[0].name}

        2️⃣: ${shuffledTracks[1].name}

        3️⃣: ${shuffledTracks[2].name}

        4️⃣: ${shuffledTracks[3].name}
        `)]
      }).then(async question => {
        await question.react("1️⃣");
        await question.react("2️⃣");
        await question.react("3️⃣");
        await question.react("4️⃣");

        playerManager.preview(shuffledTracks[0].url);

        question.awaitReactions({
          filter: (reaction, user) => {
            return [
              '1️⃣',
              '2️⃣',
              '3️⃣',
              '4️⃣',
            ].includes(reaction.emoji.name || "") && !user.bot;
          },
          max: 1,
          time: 35000,
          errors: ["time"]
        }).then(collected => {
          const reaction = collected.first();
          console.log(reaction?.emoji.name);
          message.channel.send("OK");
        }).catch(e => {
          message.channel.send("TIMEUP");
        });
      });

      return;
    }


    if (message.content === "?join") {
      playerManager.joinVoiceChannel(message);
    } else if (message.content === "?leave") {
      playerManager.leave();
    } else if (message.content.startsWith("?pl ")) {
      const result = await searchPlaylist(message.content.replace("?ql ", ""));
      console.log(result);
      message.channel.send(result.map((elm: any) => {
        return `${elm.name}: \`${elm.id}\``;
      }).join("\n"));
    } else if (message.content.startsWith("?a ")) {
      const result = await searchArtist(message.content.replace("?a ", ""));
      console.log(result);
      if (!result.length) {
        message.channel.send("見つかりませんでした");
      } else {
        result.forEach((elm: any) => {
          message.channel.send(`${elm.name}: \`${elm.id}\``);
        });
      }
    } else if (message.content.startsWith("?albums ")) {
      const artistId = message.content.replace("?albums ", "");
      const result = await getArtistAlbums(artistId);
      result.forEach((elm: any) => {
        message.channel.send(`${elm.name}: \`${elm.id}\``);
      });
    } else if (message.content.startsWith("?tracks ")) {
      const artistId = message.content.replace("?tracks ", "");
      const result = await getAlubumTracks(artistId);
      result.forEach((elm: any) => {
        message.channel.send(`${elm.name}: \`${elm.id}\``);
      });
    } else if (message.content.startsWith("?preview ")) {
      const trackId = message.content.replace("?preview ", "");
      const previewUrl = await getPreviewUrl(trackId);
      playerManager.preview(previewUrl);
    } else if (playerManager.isReady() && message.content.startsWith("?rand ")) {
      const artistId = message.content.replace("?rand ", "");
      message.channel.send("しばらくお待ちください")
      const albumIds: string[] = (await getArtistAlbums(artistId)).map((elm: { id: string }) => elm.id);
      const result = await getAllTracks(albumIds);
      const tracks: { name: string; id: string; url: string }[] = [];
      result.map((r: any) => {
        r.forEach((elm: any) => {
          tracks.push({ id: elm.id, name: elm.name, url: elm["preview_url"] } as any);
        });
      });
      const shuffledTracks = shuffleTracks(tracks);
      // const answerTrack = shuffledTracks.shift();
      // console.log("choiceOtherTracks", choiceOtherTracks(shuffledTracks[0], tracks));

      message.channel.send({
        embeds: [new MessageEmbed().setTitle("QUIZ").addField("サカナクション", `
        1️⃣: ${shuffledTracks[0].name}

        2️⃣: ${shuffledTracks[1].name}

        3️⃣: ${shuffledTracks[2].name}

        4️⃣: ${shuffledTracks[3].name}
        `)]
      }).then(async question => {
        await question.react("1️⃣");
        await question.react("2️⃣");
        await question.react("3️⃣");
        await question.react("4️⃣");

        playerManager.preview(shuffledTracks[0].url);

        question.awaitReactions({
          filter: (reaction, user) => {
            return [
              '1️⃣',
              '2️⃣',
              '3️⃣',
              '4️⃣',
            ].includes(reaction.emoji.name || "") && !user.bot;
          },
          max: 1,
          time: 35000,
          errors: ["time"]
        }).then(collected => {
          const reaction = collected.first();
          console.log(reaction?.emoji.name);
          message.channel.send("OK");
        }).catch(e => {
          message.channel.send("TIMEUP");
        });
      });
    }
  });

  client.on('ready', () => {
    console.log("on ready");
  });
  client.login(token);
})();