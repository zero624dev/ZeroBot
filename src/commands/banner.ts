import {
  type InteractionReplyOptions,
  UserContextMenuCommandInteraction,
  ApplicationCommandType,
  type Locale,
  type Client,
} from "discord.js";
import { Command } from "../core/types";
import sharp from "sharp";

export interface IScripts {
  user_banner: (username: string) => string;
}

export default class BotInfo extends Command {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      user_banner: (username: string) => `${username}님의 배너`,
    },
    "en-US": {
      user_banner: (username: string) => `${username}'s banner`,
    },
  };

  constructor(client: Client) {
    super(client, {
      name: "show banner",
      nameLocalizations: {
        ko: "배너 보기",
      },
      type: ApplicationCommandType.User,
      dmPermission: false,
    });
  }

  userContextMenu(interaction: UserContextMenuCommandInteraction<"cached">) {
    return new Promise<InteractionReplyOptions>((resolve) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
      this.client.users.fetch(interaction.targetId, { force: true }).then((user) => {
        if (!user.banner && user.accentColor) {
          resolve({
            embeds: [
              {
                title: scripts.user_banner(user.username),
                image: { url: "attachment://banner.png" },
                color: user.accentColor,
              },
            ], files: [
              {
                attachment: sharp({
                  create: {
                    width: 600,
                    height: 240,
                    channels: 4,
                    background: `#${user.accentColor.toString(16)}`,
                  },
                }).png(),
                name: "banner.png",
              },
            ],
          });
        } else {
          resolve({
            embeds: [
              {
                title: scripts.user_banner(user.username),
                image: { url: user.bannerURL({ size: 2048 }) ?? "" },
                color: user.accentColor ?? undefined,
              },
            ],
          });
        }
      });
    });
  }
}
