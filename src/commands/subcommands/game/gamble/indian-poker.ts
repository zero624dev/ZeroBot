import {
    ComponentType,
    ButtonStyle,
    Colors,
    ApplicationCommandOptionType,
    type Locale,
    type ButtonInteraction,
    type InteractionReplyOptions,
    type InteractionUpdateOptions,
    type ChatInputCommandInteraction,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";
import { getUser, subtractUserWallet, addUserWallet } from "../../../../addons/database/repository/GameRepo";
import { MathUtils } from "../../../../core/utils/utils";
import { colors } from "../../../../config";

export interface IScripts {
    not_enough_money: string;
    user_indian_poker: (username: string) => string;
    description: string;
    balance: string;
    bet: string;
    die: (bot: string, user: string, result: string) => string;
    win: string;
    lose: string;
    draw: string;
}

export default class PetPet extends SubCommand {
    symbol = ["♣️", "♥️", "♦️", "♠️"];
    symbolName = ["clubs", "hearts", "diamonds", "spades"];
    num2txt: { [key: number]: string } = { 1: "A", 11: "J", 12: "Q", 13: "K" };
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            not_enough_money: "소지금이 최소 베팅액인 **1,000**보다 부족해요.",
            user_indian_poker: (username: string) => `${username}님의 인디언 포커`,
            description: "도전(Go)할지 포기(Die)할지 고르세요.",
            balance: "잔고",
            bet: "베팅액",
            die: (bot: string, user: string, result: string) => `포기했습니다.\n상대는 \`${bot}\`, 당신은 \`${user}\`로 \`${result}\`였습니다.`,
            win: "승리",
            lose: "패배",
            draw: "무승부"
        },
        "en-US": {
            not_enough_money: "You don't have enough money to bet the minimum amount of **1,000**.",
            user_indian_poker: (username: string) => `${username}'s Indian Poker`,
            description: "Choose whether to **Go** or **Die**.",
            balance: "Balance",
            bet: "Bet",
            die: (bot: string, user: string, result: string) => `You have surrendered.\nOpponent: \`${bot}\`, You: \`${user}\` - ${result}.`,
            win: "Win",
            lose: "Lose",
            draw: "Draw"
        }
    };

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "indian-poker",
            description: "Reward: 1.8x",
            nameLocalizations: {
                ko: "인디언포커"
            },
            descriptionLocalizations: {
                ko: "배율: 1.8x"
            },
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "bet",
                    description: "Reward: 1.8x",
                    nameLocalizations: {
                        ko: "베팅액"
                    },
                    descriptionLocalizations: {
                        ko: "배율: 1.8x"
                    },
                    minValue: 1_000,
                    maxValue: 100_000,
                    required: true,
                }
            ]
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            let betAmount = interaction.options.getInteger("bet", true);
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
            const subcommandName = `${interaction.options.getSubcommandGroup()} ${interaction.options.getSubcommand()}`;

            getUser(interaction.user.id, "wallet").then((res) => {
                return res ?? 0;
            }).then((wallet) => {
                if (wallet < betAmount) {
                    betAmount = wallet;
                }
                if (betAmount < 1000) {
                    return resolve({
                        content: scripts.not_enough_money,
                        ephemeral: true
                    });
                }
                subtractUserWallet(interaction.user.id, betAmount).then(() => {
                    const bot = [MathUtils.randomRange(0, 3), MathUtils.randomRange(1, 13)];
                    resolve({
                        embeds: [
                            {
                                title: scripts.user_indian_poker(interaction.user.tag),
                                description: scripts.description,
                                fields: [
                                    {
                                        name: scripts.bet,
                                        value: `> ${betAmount.toLocaleString(interaction.locale)}`
                                    }
                                ],
                                image: {
                                    url: `https://raw.githubusercontent.com/zero624dev/ZeroBotPlayingCard/main/playingCards/${this.symbolName[bot[0]]}${bot[1]}.png`
                                },
                                thumbnail: {
                                    url: "https://raw.githubusercontent.com/zero624dev/ZeroBotPlayingCard/main/playingCards/backside.png"
                                },
                                footer: { text: "A < 2-10 < J < Q < K" },
                                color: colors.accent,
                            }
                        ],
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.Button,
                                        customId: `${interaction.user.id}|${interaction.commandName}|${subcommandName}|${betAmount}|go|${bot.join("|")}`,
                                        label: "⚔️ Go",
                                        style: ButtonStyle.Primary
                                    },
                                    {
                                        type: ComponentType.Button,
                                        customId: `${interaction.user.id}|${interaction.commandName}|${subcommandName}|${betAmount}|die|${bot.join("|")}`,
                                        label: "🛡️ Die",
                                        style: ButtonStyle.Danger
                                    }
                                ]
                            }
                        ]
                    });
                }).catch(reject);
            }).catch(reject);
        });
    }

    button(interaction: ButtonInteraction, args: string[]) {
        return new Promise<InteractionUpdateOptions>((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

            getUser(interaction.user.id, "wallet").then((res) => res ?? 0).then((wallet) => {
                const betAmount = parseInt(args[0], 10);
                const reward = Math.round(betAmount * 1.8);

                const bot = [Number(args[2]), Number(args[3])], user = [MathUtils.randomRange(0, 3), 0];
                if (bot[0] == user[0]) {
                    user[1] = [MathUtils.randomRange(1, bot[1] - 1), MathUtils.randomRange(bot[1] + 1, 13)][bot[1] == 1 ? 1 : bot[1] == 13 ? 0 : MathUtils.randomRange(0, 1)];
                } else {
                    user[1] = MathUtils.randomRange(1, 13);
                }

                const embed = {
                    title: scripts.user_indian_poker(interaction.user.tag),
                    image: {
                        url: `https://raw.githubusercontent.com/zero624dev/ZeroBotPlayingCard/main/playingCards/${this.symbolName[bot[0]]}${bot[1]}.png`
                    },
                    thumbnail: {
                        url: `https://raw.githubusercontent.com/zero624dev/ZeroBotPlayingCard/main/playingCards/${this.symbolName[user[0]]}${user[1]}.png`
                    },
                    footer: { text: "A < 2-10 < J < Q < K" },
                    color: colors.accent,
                };

                if (args[1] === "die") {
                    addUserWallet(interaction.user.id, Math.round(betAmount / 2)).then(() => {
                        resolve({
                            embeds: [
                                {
                                    ...embed,
                                    description: scripts.die(
                                        `${this.symbol[bot[0]]}${this.num2txt[bot[1]] || bot[1]}`,
                                        `${this.symbol[user[0]]}${this.num2txt[user[1]] || user[1]}`,
                                        bot[1] > user[1] ? scripts.lose : bot[1] == user[1] ? scripts.draw : scripts.win
                                    ),
                                    fields: [
                                        {
                                            name: scripts.balance,
                                            value: `> ${wallet.toLocaleString(interaction.locale)} (+${Math.round(betAmount / 2).toLocaleString(interaction.locale)})`
                                        }
                                    ],
                                    color: Colors.Orange
                                }
                            ], components: []
                        });
                    }).catch(reject);
                } else if (args[1] === "go") {
                    if (bot[1] < user[1]) {
                        addUserWallet(interaction.user.id, reward).then(() => {
                            resolve({
                                embeds: [
                                    {
                                        ...embed,
                                        description: `**${scripts.win}**`,
                                        fields: [
                                            {
                                                name: scripts.balance,
                                                value: `> ${wallet.toLocaleString(interaction.locale)} (+${reward.toLocaleString(interaction.locale)})`
                                            }
                                        ],
                                    }
                                ], components: []
                            });
                        }).catch(reject);
                    } else if (bot[1] == user[1]) {
                        addUserWallet(interaction.user.id, betAmount).then(() => {
                            resolve({
                                embeds: [
                                    {
                                        ...embed,
                                        description: `**${scripts.draw}**`,
                                        fields: [
                                            {
                                                name: scripts.balance,
                                                value: `> ${wallet.toLocaleString(interaction.locale)} (+${betAmount.toLocaleString(interaction.locale)})`
                                            }
                                        ],
                                        color: Colors.Orange
                                    }
                                ], components: []
                            });
                        }).catch(reject);
                    } else {
                        resolve({
                            embeds: [
                                {
                                    ...embed,
                                    description: `**${scripts.lose}**`,
                                    fields: [
                                        {
                                            name: scripts.balance,
                                            value: `> ${wallet.toLocaleString(interaction.locale)} (-${betAmount.toLocaleString(interaction.locale)})`
                                        }
                                    ],
                                    color: colors.error
                                }
                            ], components: []
                        });
                    }
                }
            });
        });
    }
}