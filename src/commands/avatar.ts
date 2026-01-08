import {
    type InteractionReplyOptions,
    UserContextMenuCommandInteraction,
    ApplicationCommandType,
    type Locale,
    type Client
} from "discord.js";
import { Command } from "../core/types";
import { colors } from "../config";

export interface IScripts {
    user_avatar: (username: string) => string,
}

export default class BotInfo extends Command {
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            user_avatar: (username: string) => `${username}님의 아바타`
        },
        "en-US": {
            user_avatar: (username: string) => `${username}'s avatar`
        }
    };

    constructor(client: Client) {
        super(client, {
            name: "show avatar",
            nameLocalizations: {
                ko: "아바타 보기"
            },
            type: ApplicationCommandType.User,
            dmPermission: false,
        });
    }

    userContextMenu(interaction: UserContextMenuCommandInteraction<"cached">) {
        return new Promise<InteractionReplyOptions>((resolve) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
            resolve({
                embeds: [
                    {
                        title: scripts.user_avatar(interaction.targetUser.username),
                        image: { url: (interaction.targetMember ?? interaction.targetUser).displayAvatarURL({ extension: "png", size: 2048 }) },
                        color: colors.accent
                    }
                ]
            });
        });
    }
}
