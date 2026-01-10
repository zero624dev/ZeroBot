import type { Message, Client } from "discord.js";
import { ClientEvent } from "../core/types";
import { editsnipe } from "../core/cache";

export default class MessageUpdate extends ClientEvent<"messageUpdate"> {
  constructor(client: Client) {
    super(client);
  }

  public run(message: Message<true>) {
    return new Promise<void>(() => {
      if (message.channel.isDMBased() || message.channel.isVoiceBased() || message.author.bot
        || !(message.channel.isThread() ? message.channel.parent : message.channel)?.topic?.includes("#snipe")) return;

      const msg = {
        author: message.author,
        channelId: message.channelId,
        content: message.content,
        createdAt: message.createdAt,
        editedAt: message.editedAt ?? new Date(),
        reference: message.reference ? `https://discord.com/channels/${message.reference.guildId}/${message.reference.channelId}/${message.reference.messageId}` : undefined,
      };

      const snipes = editsnipe.get(message.channelId);

      if (snipes) {
        const now = Date.now();
        editsnipe.set(
          message.channelId,
          snipes.filter(({ createdAt }) => {
            return now - createdAt.getTime() < 18000000;
          }).concat(msg),
        );
      } else {
        editsnipe.set(message.channelId, [msg]);
      }
    });
  }
}
