import {
    ChatInputCommandInteraction,
    ApplicationCommandOptionType,
    type InteractionReplyOptions,
    type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";
import { getUser, setUser } from "../../../../addons/database/repository/GameRepo";
import { MathUtils } from "../../../../core/utils/utils";
import { colors } from "../../../../config";

export interface IScripts {
    not_enough_money: string;
    user_evenodd: (username: string) => string;
    correct: string;
    wrong: string;
    balance: string;
}

export default class PetPet extends SubCommand {
    returns = {
        1: 1.9, // CORRECT
        0: 0 // WRONG
    };
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            not_enough_money: "소지금이 최소 베팅액인 **1,000**보다 부족해요.",
            user_evenodd: (username: string) => `${username}님의 홀짝`,
            correct: "맞췄습니다!",
            wrong: "틀렸습니다.",
            balance: "잔고"
        },
        "en-US": {
            not_enough_money: "You don't have enough money to bet the minimum amount of **1,000**.",
            user_evenodd: (username: string) => `${username}'s Even/Odd`,
            correct: "You got it right!",
            wrong: "You got it wrong.",
            balance: "Balance"
        }
    };

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "evenodd",
            description: "Reward: 1.9x",
            nameLocalizations: {
                ko: "홀짝"
            },
            descriptionLocalizations: {
                ko: "배율: 1.9x"
            },
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "bet",
                    description: "Reward: 1.9x",
                    nameLocalizations: {
                        ko: "베팅액"
                    },
                    descriptionLocalizations: {
                        ko: "배율: 1.9x"
                    },
                    minValue: 1_000,
                    maxValue: 100_000,
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "guess",
                    description: "Reward: 1.9x",
                    nameLocalizations: {
                        ko: "선택"
                    },
                    descriptionLocalizations: {
                        ko: "배율: 1.9x"
                    },
                    choices: [
                        {
                            name: "odd",
                            nameLocalizations: {
                                ko: "홀",
                            },
                            value: 1,
                        },
                        {
                            name: "even",
                            nameLocalizations: {
                                ko: "짝",
                            },
                            value: 0,
                        }
                    ],
                    required: true,
                }
            ]
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

            let betAmount = interaction.options.getInteger("bet", true);
            const guess = interaction.options.getInteger("guess", true);

            getUser(interaction.user.id, "wallet").then((res) => res ?? 0).then((wallet) => {
                if (wallet < betAmount) {
                    betAmount = wallet;
                }
                if (betAmount < 1000) {
                    return resolve({
                        content: scripts.not_enough_money,
                        ephemeral: true
                    });
                }
                const evenodd = MathUtils.randomRange(0, 1);
                const matching: 1 | 0 = guess == evenodd ? 1 : 0;

                const reward = Math.floor(betAmount * this.returns[matching]);
                const balance = wallet - betAmount + reward;
                setUser(interaction.user.id, { wallet: balance }).then(() => {
                    resolve({
                        embeds: [{
                            title: scripts.user_evenodd(interaction.user.tag),
                            description: `${matching ? scripts.correct : scripts.wrong}`,
                            fields: [
                                {
                                    name: scripts.balance,
                                    value: `${balance.toLocaleString(interaction.locale)} (${matching ? "+" : "-"}${Math.abs(balance - wallet).toLocaleString(interaction.locale)})`,
                                    inline: true
                                }
                            ],
                            color: colors[matching ? "accent" : "error"]
                        }]
                    });
                }).catch(reject);
            }).catch(reject);
        });
    }
}