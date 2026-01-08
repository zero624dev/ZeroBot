import {
    ChatInputCommandInteraction,
    ApplicationCommandOptionType,
    type InteractionReplyOptions,
    type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";
import { getUser, setUser } from "../../../../addons/database/repository/GameRepo";
import { colors } from "../../../../config";

export interface IScripts {
    not_enough_money: (m: string, m2: string) => string;
    expanded: (c: number) => string;
    no_more_expansion: string;
}

export default class PetPet extends SubCommand {
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            not_enough_money: (m1, m2) => `${m1}원이 부족해요. (소지금: ${m2})`,
            expanded: (c) => `농장을 ${c}번 확장했어요.`,
            no_more_expansion: "농장을 더 이상 확장할 수 없어요."
        },
        "en-US": {
            not_enough_money: (m1, m2) => `You don't have enough money. (Short of ${m1} won, Wallet: ${m2})`,
            expanded: (c) => `Expanded the farm ${c} times.`,
            no_more_expansion: "You can't expand the farm anymore."
        }
    };

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "expand",
            description: "Expand your farm.",
            nameLocalizations: {
                ko: "확장"
            },
            descriptionLocalizations: {
                ko: "농장을 확장해요."
            },
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "amount",
                    description: "The amount of land to expand.",
                    nameLocalizations: {
                        ko: "칸수"
                    },
                    descriptionLocalizations: {
                        ko: "확장할 땅 칸수"
                    },
                    minValue: 1,
                }
            ]
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
            getUser(interaction.user.id, ["farm", "wallet"]).then((res) => {
                return { farm: [], wallet: 0, ...(res ?? {}) };
            }).then(({ farm, wallet }) => {
                const maxLandCount = 80;

                if (farm.length >= maxLandCount) {
                    return resolve({
                        embeds: [{
                            title: scripts.no_more_expansion,
                            color: colors.error
                        }],
                        ephemeral: true
                    });
                }

                const amount = Math.min(interaction.options.getInteger("amount") ?? 1, maxLandCount - farm.length);
                let price = 0, expandCount = 0;

                if (farm.length < 8) {
                    const count = farm.length + amount < 8 ? amount : 8 - farm.length;
                    price += 50_000 * count;
                    expandCount += count;
                }
                if (farm.length < 24) {
                    const count = farm.length + amount - expandCount < 24 ? amount - expandCount : 16 - (farm.length >= 8 ? farm.length - 8 : 0);
                    price += 100_000 * count;
                    expandCount += count;
                }
                if (farm.length < 48) {
                    const count = farm.length + amount - expandCount < 48 ? amount - expandCount : 24 - (farm.length >= 24 ? farm.length - 24 : 0);
                    price += 250_000 * count;
                    expandCount += count;
                }
                if (farm.length < 80) {
                    const count = farm.length + amount - expandCount < 80 ? amount - expandCount : 32 - (farm.length >= 48 ? farm.length - 48 : 0);
                    price += 500_000 * count;
                    expandCount += count;
                }

                if (wallet < price) {
                    return resolve({
                        embeds: [{
                            title: scripts.not_enough_money((price - wallet).toLocaleString(interaction.locale), wallet.toLocaleString(interaction.locale)),
                            color: colors.error
                        }],
                        ephemeral: true
                    });
                }

                setUser(interaction.user.id, {
                    $push: {
                        farm: new Array(amount).fill({ crop: "none", plantedAt: 0 })
                    },
                    wallet: wallet - price
                }, true).then(() => {
                    resolve({
                        embeds: [{
                            title: scripts.expanded(amount),
                            color: colors.accent
                        }],
                        ephemeral: true
                    });
                }).catch(reject);
            }).catch(reject);

        });
    }
}