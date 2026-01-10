import {
  type InteractionReplyOptions,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  ApplicationCommandType,
  type Client,
} from "discord.js";
import { Command } from "../core/types";

export default class Eval extends Command {
  constructor(client: Client) {
    super(client, {
      name: "test",
      description: "test command.",
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: "user",
          description: "test",
          required: false,
        },
      ],
    }, {
      guilds: ["678566031874064394"],
      whitelist: ["532239959281893397"],
    });
  }

  chatInput(interaction: ChatInputCommandInteraction<"cached">) {
    return new Promise<InteractionReplyOptions>((resolve, reject) => {
      resolve({
        content: "Test command works!",
      });
    });
  }
}

// const voiceChannel = interaction.member.voice.channel as any;

// const connection = joinVoiceChannel({
//     channelId: voiceChannel.id,
//     guildId: voiceChannel.guildId,
//     selfDeaf: true,
//     adapterCreator: voiceChannel.guild.voiceAdapterCreator
// });

// const player = createAudioPlayer({
//     behaviors: {
//         noSubscriber: NoSubscriberBehavior.Pause
//     }
// });
// connection.subscribe(player);

// const args = [
//     '-reconnect', '1',
//     '-reconnect_streamed', '1',
//     '-reconnect_delay_max', '5',
//     '-i', "https://cdn.discordapp.com/attachments/966658591811600385/1200778440442380318/Sunny.mp3",
//     '-analyzeduration', '0',
//     '-loglevel', '0',
//     '-ar', '48000',
//     '-ac', '2',
//     '-f', "opus",
//     "-acodec", "libopus"
// ];

// const resource = createAudioResource(new FFmpeg({ args, shell: false }), { inputType: StreamType.OggOpus, inlineVolume: true });
// resource.volume?.setVolume(50 / 100);
// player.play(resource);
