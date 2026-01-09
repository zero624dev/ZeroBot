import {
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
    ChatInputCommandInteraction,
    ApplicationCommandOptionType,
    type InteractionReplyOptions,
    type Locale,
    type InteractionUpdateOptions,
} from "discord.js";
import { type Command, SubCommand } from "../../../core/types";
import { MathUtils } from "../../../core/utils/utils";
import { colors } from "../../../config";

export interface IScripts {
    game_title: string;
    participants_field_name: string;
    user_turn: (username: string) => string;
    end_in_user_turn: (username: string) => string;
    start_button_label: string;
    join_button_label: string;
    rotate_button_label: string;
    you_have_already_joined: string;
    game_is_full: string;
    please_start_game: string;
    wait_your_turn: string;
    not_participant: string;
}

export default class extends SubCommand {
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            game_title: "해적 룰렛",
            participants_field_name: "참가자",
            user_turn: (username: string) => `${username}님의 차례에요.`,
            end_in_user_turn: (username: string) => `${username}님의 차례에서 끝났어요.`,
            start_button_label: "시작",
            join_button_label: "참가",
            rotate_button_label: "뒷면으로 돌리기",
            you_have_already_joined: "이미 참가 중이에요.",
            game_is_full: "인원이 가득찼어요.",
            please_start_game: "게임을 시작해주세요.",
            wait_your_turn: "차례를 기다려주세요.",
            not_participant: "당신은 참가자가 아니에요.",
        },
        "en-US": {
            game_title: "Pirate Roulette",
            participants_field_name: "Players",
            user_turn: (username: string) => `${username}'s turn.`,
            end_in_user_turn: (username: string) => `Ended in ${username}'s turn.`,
            start_button_label: "Start",
            join_button_label: "Join",
            rotate_button_label: "Turn it to the back.",
            you_have_already_joined: "You've already participated.",
            game_is_full: "Game is full.",
            please_start_game: "Please start the game.",
            wait_your_turn: "Please wait your turn.",
            not_participant: "You are not a participant.",
        }
    }

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "pirate-roulette",
            description: "Starts a pirate roulette game.",
            nameLocalizations: {
                ko: "해적룰렛"
            },
            descriptionLocalizations: {
                ko: "해적룰렛 게임을 시작합니다."
            },
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve) => {
            const commandName = interaction.commandName;
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

            resolve({
                embeds: [
                    {
                        title: scripts.game_title,
                        fields: [
                            { name: scripts.participants_field_name, value: `<@${interaction.user.id}>`, inline: true },
                        ],
                        color: colors.accent
                    }
                ], components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                customId: `${interaction.user.id}|${commandName}|${this.data.name}|start`,
                                label: scripts.start_button_label,
                                style: ButtonStyle.Primary,
                            },
                            {
                                type: ComponentType.Button,
                                customId: `all|${commandName}|${this.data.name}|join`,
                                label: scripts.join_button_label,
                                style: ButtonStyle.Primary,
                            }
                        ]
                    }
                ]
            });
        });
    }

    button(interaction: ButtonInteraction<"cached">, args: string[]) {
        return new Promise<InteractionUpdateOptions>((resolve) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
            const participants = interaction.message.embeds[0].fields[0].value.match(/\d+/g) as string[] ?? [];
            const [, commandName, subcommandName] = interaction.customId.split("|");

            if (args[0] == "start") {
                MathUtils.shuffleArray(participants);
                const first = participants.shift();
                resolve({
                    embeds: [
                        {
                            title: scripts.game_title,
                            description: scripts.user_turn(`<@${first}>`),
                            fields: [
                                { name: scripts.participants_field_name, value: `__<@${first}>__ ${participants.map(v => `<@${v}>`).join(' ')}`, inline: true },
                            ],
                            image: {
                                url: "https://cdn.discordapp.com/attachments/843156045865418752/973202912727683152/PirateRoulette.png"
                            },
                            footer: {
                                text: `20 remain • 5% • ${this.client.user?.username}`
                            },
                            color: colors.accent
                        }
                    ], components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    customId: `all|${commandName}|${subcommandName}|knife0|0|0`,
                                    emoji: "<:toomyeong:851385935282700310>",
                                    style: ButtonStyle.Primary,
                                },
                                {
                                    type: ComponentType.Button,
                                    customId: `all|${commandName}|${subcommandName}|knife1|0|0`,
                                    emoji: "<:toomyeong:851385935282700310>",
                                    style: ButtonStyle.Primary,
                                },
                                {
                                    type: ComponentType.Button,
                                    customId: `all|${commandName}|${subcommandName}|knife2|0|0`,
                                    emoji: "<:toomyeong:851385935282700310>",
                                    style: ButtonStyle.Primary,
                                },
                                {
                                    type: ComponentType.Button,
                                    customId: `all|${commandName}|${subcommandName}|knife3|0|0`,
                                    emoji: "<:toomyeong:851385935282700310>",
                                    style: ButtonStyle.Primary,
                                },
                                {
                                    type: ComponentType.Button,
                                    customId: `all|${commandName}|${subcommandName}|knife4|0|0`,
                                    emoji: "<:toomyeong:851385935282700310>",
                                    style: ButtonStyle.Primary,
                                }
                            ]
                        },
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    customId: `all|${commandName}|${subcommandName}|knife5|0|0`,
                                    emoji: "<:toomyeong:851385935282700310>",
                                    style: ButtonStyle.Primary,
                                },
                                {
                                    type: ComponentType.Button,
                                    customId: `all|${commandName}|${subcommandName}|knife6|0|0`,
                                    emoji: "<:toomyeong:851385935282700310>",
                                    style: ButtonStyle.Primary,
                                },
                                {
                                    type: ComponentType.Button,
                                    customId: `all|${commandName}|${subcommandName}|knife7|0|0`,
                                    emoji: "<:toomyeong:851385935282700310>",
                                    style: ButtonStyle.Primary,
                                },
                                {
                                    type: ComponentType.Button,
                                    customId: `all|${commandName}|${subcommandName}|knife8|0|0`,
                                    emoji: "<:toomyeong:851385935282700310>",
                                    style: ButtonStyle.Primary,
                                },
                                {
                                    type: ComponentType.Button,
                                    customId: `all|${commandName}|${subcommandName}|knife9|0|0`,
                                    emoji: "<:toomyeong:851385935282700310>",
                                    style: ButtonStyle.Primary,
                                }
                            ]
                        },
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    customId: `all|${commandName}|${subcommandName}|rotate`,
                                    emoji: "🔄",
                                    label: scripts.rotate_button_label,
                                    style: ButtonStyle.Secondary,
                                }
                            ]
                        }
                    ]
                });
            } else if (args[0] == "join") {
                if (participants.includes(interaction.user.id)) {
                    interaction.reply({
                        embeds: [
                            {
                                title: scripts.you_have_already_joined,
                                color: colors.error
                            }
                        ], flags: ["Ephemeral"]
                    });
                } else if (participants.length < 6) {
                    participants.push(interaction.user.id);
                    resolve({
                        embeds: [
                            {
                                title: scripts.game_title,
                                description: participants.length == 5 ? `${scripts.game_is_full}\n${scripts.please_start_game}` : undefined,
                                fields: [
                                    { name: scripts.participants_field_name, value: `<@${participants.join("> <@")}>`, inline: true },
                                ],
                                color: colors.accent
                            }
                        ], components: participants.length > 10 ? [
                            {
                                type: ComponentType.ActionRow,
                                components: (interaction.message.components[0] as any).components.slice(0, 1)
                            }
                        ] : undefined
                    });
                } else {
                    interaction.reply({
                        embeds: [
                            {
                                title: scripts.game_is_full,
                                footer: { text: `Game Is Full • ${this.client.user?.username}` },
                                color: colors.error
                            }
                        ], flags: ["Ephemeral"]
                    })
                }
            } else {
                const turn = (interaction.message.embeds[0].fields[0].value.match(/__\D+\d+\D+__/) ?? [""])[0].replace(/\D+/g, '');
                if (participants.includes(interaction.user.id)) {
                    if (turn == interaction.user.id) {
                        const { components } = interaction.message;
                        if (args[0].startsWith("knife")) {
                            let index = participants.indexOf(turn) + 1;
                            if (index > participants.length - 1) index = 0;
                            const board = [...(components[0] as any).components, ...(components[1] as any).components].map((v: any) => v.customId.split('|').slice(-2));
                            board[parseInt(args[0].substring(5))][0] = 1;
                            const remain = board.reduce((p, c) => p - Number(c[0]) - Number(c[1]), 20);
                            const isJump = Math.random() * 100 < 1 / (remain + 1) * 100;
                            resolve({
                                embeds: [
                                    {
                                        title: scripts.game_title,
                                        description: isJump ? scripts.end_in_user_turn(`<@${interaction.user.id}>`) : scripts.user_turn(`<@${participants[index]}>`),
                                        fields: [
                                            { name: scripts.participants_field_name, value: participants.map((v, i) => i == index && !isJump ? `__<@${v}>__` : `<@${v}>`).join(' '), inline: true },
                                        ],
                                        image: {
                                            url: isJump ? "https://cdn.discordapp.com/attachments/843156045865418752/973202912425680906/PirateRouletteJump.png" :
                                                "https://cdn.discordapp.com/attachments/843156045865418752/973202912727683152/PirateRoulette.png"
                                        },
                                        footer: {
                                            text: isJump ? `END • ${this.client.user?.username}` : `${remain} remain • ${(1 / remain * 100).toFixed(2)}% • ${this.client.user?.username}`
                                        },
                                        color: colors.accent
                                    }
                                ],
                                components: isJump ? [] : [
                                    ...this.getBoard(commandName, subcommandName, board),
                                    {
                                        type: ComponentType.ActionRow,
                                        components: [
                                            {
                                                type: ComponentType.Button,
                                                customId: `all|${commandName}|${subcommandName}|flip`,
                                                emoji: "🔄",
                                                label: scripts.rotate_button_label,
                                                style: ButtonStyle.Secondary,
                                            }
                                        ]
                                    }
                                ]
                            });
                        } else {
                            const board = [...(components[0] as any).components, ...(components[1] as any).components].map((v: any) => v.customId.split('|').slice(-2).reverse());
                            resolve({
                                components: [
                                    ...this.getBoard(commandName, subcommandName, board),
                                    {
                                        type: ComponentType.ActionRow,
                                        components: [
                                            {
                                                type: ComponentType.Button,
                                                customId: `all|${commandName}|${subcommandName}|rotate`,
                                                emoji: "🔄",
                                                label: scripts.rotate_button_label,
                                                style: ButtonStyle.Secondary,
                                            }
                                        ]
                                    }
                                ]
                            });
                        }
                    } else {
                        interaction.reply({
                            embeds: [
                                {
                                    title: scripts.wait_your_turn,
                                    color: colors.error
                                }
                            ], flags: ["Ephemeral"]
                        });
                    }
                } else {
                    interaction.reply({
                        embeds: [
                            {
                                title: scripts.not_participant,
                                color: colors.error
                            }
                        ], flags: ["Ephemeral"]
                    });
                }
            }
        });
    }

    getBoard(commandName: string, subcommandName: string, board: any[]) {
        const boardComponents: any[] = board.map((v, i) => ({
            type: ComponentType.Button,
            customId: `all|${commandName}|${subcommandName}|knife${i}|${v[0]}|${v[1]}`,
            emoji: v[0] == "1" ? "🗡️" : "<:toomyeong:851385935282700310>",
            style: ButtonStyle.Primary,
            disabled: v[0] == "1"
        }));
        return [
            {
                type: ComponentType.ActionRow,
                components: boardComponents.slice(0, 5)
            },
            {
                type: ComponentType.ActionRow,
                components: boardComponents.slice(5, 10)
            }
        ];
    }
} 