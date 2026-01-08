import {
    ChatInputCommandInteraction,
    ApplicationCommandOptionType,
    type InteractionReplyOptions,
    type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../core/types";
import { getUser } from "../../../addons/database/repository/GameRepo";
import { colors } from "../../../config";
import { items } from "../../../core/cache";

export interface IScripts {
    user_inventory: (username: string) => string;
    user_inventory_empty: string;
    item_count: (n: string) => string;
}

export default class Inventory extends SubCommand {
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            user_inventory: (username) => `${username}님의 인벤토리`,
            user_inventory_empty: "인벤토리가 비어있습니다.",
            item_count: (n) => `${n} 개`,
        },
        "en-US": {
            user_inventory: (username) => `${username}'s Inventory`,
            user_inventory_empty: "Inventory is empty.",
            item_count: (n) => n,
        }
    };

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "inventory",
            description: "Shows your current inventory.",
            nameLocalizations: {
                ko: "인벤토리"
            },
            descriptionLocalizations: {
                ko: "현재 인벤토리를 보여줘요."
            }
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

            getUser(interaction.user.id, "inventory").then((inventory) => {
                resolve({
                    embeds: [
                        {
                            title: scripts.user_inventory(interaction.user.tag),
                            description: inventory?.length ? undefined : scripts.user_inventory_empty,
                            fields: (inventory ?? []).map((item) => {
                                return {
                                    name: items.get(item.id)?.getName(interaction.locale) ?? item.id,
                                    value: scripts.item_count(item.count.toLocaleString(interaction.locale)),
                                    inline: false
                                };
                            }),
                            color: colors.accent,
                        }
                    ]
                });
            }).catch(reject);
        });
    }
}