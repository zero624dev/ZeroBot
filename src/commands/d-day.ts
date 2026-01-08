import {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    type InteractionReplyOptions,
    type ChatInputCommandInteraction,
    type Locale,
    type AutocompleteInteraction,
    type ApplicationCommandOptionChoiceData,
    ComponentType,
    ButtonStyle,
    ButtonInteraction,
    type InteractionUpdateOptions,
    type Client
} from "discord.js";
import { Command } from "../core/types";
import { colors } from "../config";
import { mentionCommand } from "../core/utils/utils";
import { getUser, setUserSchedule } from "../addons/database/repository/UserRepo";

export interface IScripts {
    invalid_date_format_entered: string;
    invalid_date_format_entered_description: () => string;
    not_exist_d_day: (index: number) => string;
}

export default class Dday extends Command {
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            invalid_date_format_entered: "잘못된 날짜 포맷이 입력되었어요.",
            invalid_date_format_entered_description: () => `\`YYYY-MM-DD\`의 형태로 입력해주세요.\n예시) \`${new Date().getUTCFullYear()}-06-24\``,
            not_exist_d_day: (index) => `${index}번째 디데이가 존재하지 않아요.`
        },
        "en-US": {
            invalid_date_format_entered: "Invalid date format entered.",
            invalid_date_format_entered_description: () => `Please enter it in \`YYYY-MM-DD\` format.\nEx) \`${new Date().getUTCFullYear()}-06-24\``,
            not_exist_d_day: (index) => `The ${index}th D-Day does not exist.`
        }
    }

    constructor(client: Client) {
        super(client, {
            type: ApplicationCommandType.ChatInput,
            name: "d-day",
            description: "Shows the D-Days.",
            nameLocalizations: {
                ko: "디데이"
            },
            descriptionLocalizations: {
                ko: "저장된 디데이를 보여줘요."
            },
            options: [
                {
                    name: "add",
                    description: "Add a D-Day.",
                    nameLocalizations: {
                        ko: "추가"
                    },
                    descriptionLocalizations: {
                        ko: "디데이를 추가해요."
                    },
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "name",
                            description: "The name of the D-Day.",
                            nameLocalizations: {
                                ko: "이름"
                            },
                            descriptionLocalizations: {
                                ko: "디데이의 이름"
                            },
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            maxLength: 50
                        },
                        {
                            name: "date",
                            description: "The date of the D-Day. (YYYY-MM-DD)",
                            nameLocalizations: {
                                ko: "날짜"
                            },
                            descriptionLocalizations: {
                                ko: "디데이의 날짜 (YYYY-MM-DD)"
                            },
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: "remove",
                    description: "Remove a D-Day.",
                    nameLocalizations: {
                        ko: "삭제"
                    },
                    descriptionLocalizations: {
                        ko: "디데이를 삭제해요."
                    },
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "index",
                            description: "The index of the D-Day to remove.",
                            nameLocalizations: {
                                ko: "인덱스"
                            },
                            descriptionLocalizations: {
                                ko: "삭제할 디데이의 인덱스"
                            },
                            type: ApplicationCommandOptionType.Integer,
                            required: true,
                            autocomplete: true
                        }
                    ]
                },
                {
                    name: "list",
                    description: "List of D-Days.",
                    nameLocalizations: {
                        ko: "목록"
                    },
                    descriptionLocalizations: {
                        ko: "디데이 목록을 보여줘요."
                    },
                    type: ApplicationCommandOptionType.Subcommand
                }
            ]
        }, {
            cooldown: 1000 * 5,
            registrationRequired: true
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>(async (resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
            const kst = Date.now() + 9 * 60 * 60 * 1000;
            interaction.deferReply().then(() => {
                getUser(interaction.user.id, "d_day").then(r => r?.schedules ?? []).then(schedules => {
                    switch (interaction.options.getSubcommand()) {
                        case "add":
                            const name = interaction.options.getString("name", true);
                            const date = new Date(interaction.options.getString("date", true));
                            if (isNaN(date.getTime())) {
                                return resolve({
                                    embeds: [{
                                        title: scripts.invalid_date_format_entered,
                                        description: scripts.invalid_date_format_entered_description(),
                                        color: colors.error
                                    }]
                                });
                            } else {
                                schedules.push({ name, date: date.getTime() });
                                schedules = schedules.sort((a: any, b: any) => a.date - b.date);
                                setUserSchedule(interaction.user.id, schedules).catch(reject);
                            }
                            break;
                        case "remove":
                            const index = interaction.options.getInteger("index", true);
                            if (schedules.length > index) {
                                schedules.splice(index, 1);
                                setUserSchedule(interaction.user.id, schedules).catch(reject);
                            } else {
                                return resolve({
                                    embeds: [{
                                        title: scripts.not_exist_d_day(index),
                                        color: colors.error
                                    }]
                                });
                            }
                            break;
                    }
                    resolve({
                        embeds: [
                            {
                                title: "D-Day",
                                description: schedules.length ? undefined : mentionCommand(this.client, "d-day", "add"),
                                fields: schedules.length ? schedules.map((s: any, i: number) => ({
                                    name: `${i + 1}) ${s.name}`,
                                    value: `<t:${Math.round(s.date / 1000)}:D> (<t:${Math.round(s.date / 1000)}:R>)\n\`D-${Math.ceil((s.date - kst) / (1000 * 3600 * 24)) || "day"}\``.replace("--", "+"),
                                    inline: false
                                })) : undefined,
                                color: colors.accent
                            }
                        ],
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.Button,
                                        customId: `${interaction.user.id}|${interaction.commandName}|refresh`,
                                        emoji: "🔄",
                                        style: ButtonStyle.Primary,
                                        disabled: !schedules.length
                                    }
                                ]
                            }
                        ]
                    });
                }).catch(reject);
            }).catch(reject);
        });
    }

    button(interaction: ButtonInteraction) {
        return new Promise<InteractionUpdateOptions>((resolve, reject) => {
            const kst = Date.now() + 9 * 60 * 60 * 1000;
            getUser(interaction.user.id, "d_day").then(r => r?.schedules ?? []).then(schedules => {
                resolve({
                    embeds: [
                        {
                            title: "D-Day",
                            description: schedules.length ? undefined : mentionCommand(this.client, "d-day", "add"),
                            fields: schedules.length ? schedules.map((s: any, i: number) => ({
                                name: `${i + 1}) ${s.name}`,
                                value: `<t:${Math.round(s.date / 1000)}:D> (<t:${Math.round(s.date / 1000)}:R>)\n\`D-${Math.ceil((s.date - kst) / (1000 * 3600 * 24)) || "day"}\``.replace("--", "+"),
                                inline: false
                            })) : undefined,
                            color: colors.accent
                        }
                    ],
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    customId: `${interaction.user.id}|${this.data.name}|refresh`,
                                    emoji: "🔄",
                                    style: ButtonStyle.Primary,
                                    disabled: !schedules.length
                                }
                            ]
                        }
                    ]
                });
            }).catch(reject);
        });
    }

    autocomplete(interaction: AutocompleteInteraction) {
        return new Promise<ApplicationCommandOptionChoiceData[]>((resolve, reject) => {
            getUser(interaction.user.id, "d_day").then(r => r?.schedules ?? []).then(schedules => {
                resolve(schedules.map((v: any, i: number) => ({
                    name: `${v.name} (${new Date(v.date).toLocaleDateString(interaction.locale, {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                    })})`, value: i
                })));
            }).catch(reject);
        });
    }
}
