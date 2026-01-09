import {
    ButtonStyle,
    ComponentType,
    Colors,
    ApplicationCommandOptionType,
    type ButtonInteraction,
    type InteractionReplyOptions,
    type InteractionUpdateOptions,
    type ChatInputCommandInteraction,
    type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";
import { MathUtils } from "../../../../core/utils/utils";
import { getUser, addUserWallet, subtractUserWallet } from "../../../../addons/database/repository/GameRepo";

type Card = {
    num: number | string;
    symbol: string;
}

type BlackjackData = {
    wallet: number;
    bet: number;
    playerCards: Card[];
    botCards: Card[];
    turn: number;
}

export interface IScripts {
    not_enough_money: string;
    user_blackjack: (username: string) => string;
    player: string;
    computer: string;
    win: string;
    lose: string;
    draw: string;
    bet: string;
    balance: string;
}

export default class PetPet extends SubCommand {
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            not_enough_money: "소지금이 최소 베팅액인 **1,000**보다 부족해요.",
            user_blackjack: (username: string) => `${username}님의 블랙잭`,
            player: "플레이어",
            computer: "컴퓨터",
            win: "승리",
            lose: "패배",
            draw: "무승부",
            bet: "베팅액",
            balance: "잔고"
        },
        "en-US": {
            not_enough_money: "You don't have enough money to bet the minimum amount of **1,000**.",
            user_blackjack: (username: string) => `${username}'s Blackjack`,
            player: "Player",
            computer: "Computer",
            win: "Win",
            lose: "Lose",
            draw: "Draw",
            bet: "Bet",
            balance: "Balance"
        }
    };

    returns = {
        win: 1.9,
        neutral: 1,
        lose: 0,
    };

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "blackjack",
            description: "Reward: 1.9x",
            nameLocalizations: {
                ko: "블랙잭"
            },
            descriptionLocalizations: {
                ko: "배율: 1.9x"
            },
            options: [
                {
                    name: "bet",
                    description: "Reward: 1.9x",
                    nameLocalizations: {
                        ko: "베팅액"
                    },
                    descriptionLocalizations: {
                        ko: "배율: 1.9x"
                    },
                    type: ApplicationCommandOptionType.Integer,
                    minValue: 1_000,
                    maxValue: 100_000,
                    required: true,
                }
            ]
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
            let betAmount = interaction.options.getInteger("bet", true);

            getUser(interaction.user.id, "wallet").then((res) => res ?? 0).then((wallet) => {
                if (wallet < betAmount) {
                    betAmount = wallet;
                }
                if (betAmount < 1000) {
                    return resolve({
                        content: scripts.not_enough_money,
                        flags: ["Ephemeral"]
                    });
                }
                subtractUserWallet(interaction.user.id, betAmount).then(() => {
                    const bjData: BlackjackData = {
                        wallet: wallet - betAmount,
                        bet: betAmount,
                        playerCards: [],
                        botCards: [],
                        turn: 1,
                    };
                    for (let i = 0; i < 2; i++) {
                        bjData.playerCards.push(this.generateCard(bjData.playerCards.concat(bjData.botCards)));
                        bjData.botCards.push(this.generateCard(bjData.playerCards.concat(bjData.botCards)));
                    }
                    this.game(interaction, bjData).then(resolve).catch(reject);
                }).catch(reject);
            }).catch(reject);
        });
    }

    public button(interaction: ButtonInteraction<"cached">, args: string[]) {
        return new Promise<InteractionUpdateOptions>((resolve, reject) => {
            const [action, bet, playerCards, botCards, turn] = args;

            getUser(interaction.user.id, "wallet").then(res => res ?? 0).then((wallet) => {
                this.game(interaction,
                    {
                        wallet,
                        bet: parseInt(bet, 10),
                        playerCards: playerCards.split(",").map((card) => {
                            return { num: parseInt(card.slice(0, -1), 10) || card.slice(0, -1), symbol: card.slice(-1) };
                        }),
                        botCards: botCards.split(",").map((card) => {
                            return { num: parseInt(card.slice(0, -1), 10) || card.slice(0, -1), symbol: card.slice(-1) };
                        }),
                        turn: parseInt(turn, 10),
                    },
                    action
                ).then(resolve).catch(reject);
            }).catch(reject);
        });
    }

    private generateCard(excludes: Card[] = []): Card {
        const cardSymbol = MathUtils.randomArray(["♠", "♥", "♣", "♦"]);
        const cardNum = MathUtils.randomArray(["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"].filter((num) => {
            return !excludes.find((c) => {
                return c.num == num && c.symbol == cardSymbol;
            });
        }));

        return {
            num: cardNum,
            symbol: cardSymbol,
        };
    }

    private getValue(arr: Card[]) {
        let value = 0, numAces = 0;

        for (const card of arr) {
            if (card.num == "A") {
                value += 11;
                numAces += 1;
            } else if (typeof card.num == "string") {
                value += 10;
            } else {
                value += card.num;
            }
        }

        while (value > 21 && numAces > 0) {
            value -= 10;
            numAces -= 1;
        }

        return value;
    }

    private game(interaction: ChatInputCommandInteraction | ButtonInteraction, bjData: BlackjackData, action?: string): Promise<InteractionReplyOptions & InteractionUpdateOptions> {
        return new Promise((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

            const outcomes = {
                win: {
                    text: scripts.win,
                    // Use constant colors instead of client-config to satisfy typing
                    color: Colors.Blurple
                },
                lose: {
                    text: scripts.lose,
                    color: Colors.Red
                },
                neutral: {
                    text: scripts.draw,
                    color: Colors.Grey
                },
            };

            if (action == "hit") {
                bjData.playerCards.push(this.generateCard(bjData.playerCards.concat(bjData.botCards)));
                bjData.turn += 1;
            } else if (action == "stand") {
                while (this.getValue(bjData.botCards) < 17) {
                    bjData.botCards.push(this.generateCard(bjData.playerCards.concat(bjData.botCards)));
                    bjData.turn += 1;
                }
            }

            const playerValue = this.getValue(bjData.playerCards);
            const botValue = this.getValue(bjData.botCards);
            let gameEnd = true;
            let gameResult: "neutral" | "lose" | "win" = "neutral";

            if (action) {
                if (action == "hit") {
                    if (playerValue > 21) {
                        gameResult = "lose";
                    } else if (playerValue == 21) {
                        gameResult = "win";
                    } else {
                        gameEnd = false;
                    }
                } else if (action == "stand") {
                    if (botValue > 21 || playerValue > botValue) {
                        gameResult = "win";
                    } else if (playerValue < botValue) {
                        gameResult = "lose";
                    } else if (playerValue == botValue) {
                        gameResult = "neutral";
                    } else {
                        gameEnd = false;
                    }
                }
            } else {
                gameEnd = false;
            }

            const bjDataString = `${bjData.bet}|${bjData.playerCards.map((card) => {
                return `${card.num}${card.symbol}`;
            }).join(",")}|${bjData.botCards.map((card) => {
                return `${card.num}${card.symbol}`;
            }).join(",")}|${bjData.turn}`;

            const econFunction = gameEnd ? addUserWallet : () => {
                return new Promise((_resolve) => {
                    _resolve(null);
                });
            };

            const outcome = Math.floor(bjData.bet * this.returns[gameResult]);
            econFunction(interaction.user.id, outcome).then(() => {
                let refCmd = "";
                if (interaction.isChatInputCommand()) {
                    refCmd = `${interaction.commandName}|${interaction.options.getSubcommandGroup()} ${interaction.options.getSubcommand()}`
                } else {
                    refCmd = interaction.customId.split("|").slice(1, 3).join("|");
                }
                resolve({
                    embeds: [
                        {
                            title: scripts.user_blackjack(interaction.user.tag),
                            description: gameEnd ? `**${outcomes[gameResult].text}**` : undefined,
                            fields: [
                                {
                                    name: `${scripts.player} [${playerValue}]`,
                                    value: bjData.playerCards.map((card) => {
                                        return `\`${card.num}${card.symbol}\``;
                                    }).join(" "),
                                    inline: true,
                                },
                                {
                                    name: `${scripts.computer} [${gameEnd ? botValue : "?"}]`,
                                    value: `${gameEnd ? bjData.botCards.map((card) => {
                                        return `\`${card.num}${card.symbol}\``;
                                    }).join(" ") : `\`${bjData.botCards[0].num}${bjData.botCards[0].symbol}\` \`?\``}`,
                                    inline: true,
                                },
                                {
                                    name: gameEnd ? scripts.balance : scripts.bet,
                                    value: gameEnd
                                        ? `${bjData.wallet.toLocaleString(interaction.locale)} (${gameResult == "lose" ? "-" : "+"}${(outcome || bjData.bet).toLocaleString(interaction.locale)})`
                                        : `${bjData.bet.toLocaleString(interaction.locale)}`,
                                    inline: false
                                }
                            ],
                            footer: {
                                text: `A = 1 or 11, J Q K = 10 | Turn ${bjData.turn}`,
                            },
                            color: outcomes[gameResult].color,
                        },
                    ],
                    components: gameEnd ? [] : [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    label: "⚔️ Hit",
                                    style: ButtonStyle.Primary,
                                    customId: `${interaction.user.id}|${refCmd}|hit|${bjDataString}`,
                                },
                                {
                                    type: ComponentType.Button,
                                    label: "🛡️ Stand",
                                    style: ButtonStyle.Danger,
                                    customId: `${interaction.user.id}|${refCmd}|stand|${bjDataString}`,
                                }
                            ]
                        }
                    ],
                });
            }).catch(reject);
        });
    }
}