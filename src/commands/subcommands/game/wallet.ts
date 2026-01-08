import {
    ApplicationCommandOptionType,
    type ChatInputCommandInteraction,
    type InteractionReplyOptions,
    type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../core/types";
import { getUser } from "../../../addons/database/repository/GameRepo";
import { colors } from "../../../config";

export interface IScripts {
    user_wallet: (username: string) => string;
    balance: string;
    cash_notation: (number: string) => string;
}

export default class Wallet extends SubCommand {
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            user_wallet: (username) => `${username}님의 지갑`,
            balance: "잔고",
            cash_notation: (number) => `${number}`
        },
        "en-US": {
            user_wallet: (username) => `${username}'s Wallet`,
            balance: "Balance",
            cash_notation: (number) => `${number}`
        }
    };

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "wallet",
            description: "Shows your current wallet.",
            nameLocalizations: {
                ko: "지갑"
            },
            descriptionLocalizations: {
                ko: "현재 지갑을 보여줘요."
            }
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

            getUser(interaction.user.id, "wallet").then((wallet) => {
                resolve({
                    embeds: [
                        {
                            title: scripts.user_wallet(interaction.user.tag),
                            fields: [
                                { name: scripts.balance, value: scripts.cash_notation((wallet ?? 0).toLocaleString(interaction.locale)), inline: false },
                            ],
                            color: colors.accent
                        }
                    ]
                });
            }).catch(reject)
        });
    }
}