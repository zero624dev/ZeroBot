import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    ChatInputCommandInteraction,
    type InteractionReplyOptions,
    type Locale
} from "discord.js";
import { Command } from "../core/types";
import { colors } from "../config";
import { editsnipe, snipe } from "../core/cache";

export interface IScripts {
    there_are_no_messages_on_channel_to_snipe: (channel: string) => string;
    there_are_no_messages_to_snipe_from_user_on_channel: (channel: string, user: string) => string;
    not_available_channel: (channel: string) => string;
    please_add_tag_to_the_channel_topic: string;
}

export default class Eval extends Command {
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            there_are_no_messages_on_channel_to_snipe: (channel) => `${channel}에는 스나이프할 메시지가 없어요.`,
            there_are_no_messages_to_snipe_from_user_on_channel: (user, channel) => `${channel}에는 ${user}님에게서 스나이프할 메시지가 없어요.`,
            not_available_channel: (channel) => `${channel}에서는 이 명령어를 사용할 수 없는 채널이에요.`,
            please_add_tag_to_the_channel_topic: "채널 주제에 #snipe를 추가해주세요.\n저장된 메시지는 5시간 후 삭제돼요.",
        },
        "en-US": {
            there_are_no_messages_on_channel_to_snipe: (channel) => `There are no messages to snipe on ${channel}.`,
            there_are_no_messages_to_snipe_from_user_on_channel: (user, channel) => `There are no messages to snipe from ${user} on ${channel}.`,
            not_available_channel: (channel) => `Snipe is not available on ${channel}.`,
            please_add_tag_to_the_channel_topic: "Please add #snipe to the channel topic.\nThe recorded messages will be deleted within 5 hours.",
        }
    }

    constructor(client: any) {
        super(client, {
            type: ApplicationCommandType.ChatInput,
            name: "snipe",
            description: "snipe command.",
            nameLocalizations: {
                ko: "스나이프"
            },
            descriptionLocalizations: {
                ko: "스나이프 명령어."
            },
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "edit",
                    description: "Shows the previous content of the edited message.",
                    nameLocalizations: {
                        ko: "수정"
                    },
                    descriptionLocalizations: {
                        ko: "수정된 메시지의 이전 내용을 보여줘요."
                    },
                    options: [
                        {
                            type: ApplicationCommandOptionType.Channel,
                            name: "channel",
                            description: "The channel to snipe.",
                            nameLocalizations: {
                                ko: "채널"
                            },
                            descriptionLocalizations: {
                                ko: "스나이프할 채널."
                            },
                            required: false
                        },
                        {
                            type: ApplicationCommandOptionType.User,
                            name: "user",
                            description: "The user to snipe.",
                            nameLocalizations: {
                                ko: "유저"
                            },
                            descriptionLocalizations: {
                                ko: "스나이프할 유저."
                            },
                            required: false,
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "delete",
                    description: "Shows the content of the deleted message.",
                    nameLocalizations: {
                        ko: "삭제"
                    },
                    descriptionLocalizations: {
                        ko: "삭제된 메시지의 내용을 보여줘요."
                    },
                    options: [
                        {
                            type: ApplicationCommandOptionType.Channel,
                            name: "channel",
                            description: "The channel to snipe.",
                            nameLocalizations: {
                                ko: "채널"
                            },
                            descriptionLocalizations: {
                                ko: "스나이프할 채널."
                            },
                            required: false
                        },
                        {
                            type: ApplicationCommandOptionType.User,
                            name: "user",
                            description: "The user to snipe.",
                            nameLocalizations: {
                                ko: "유저"
                            },
                            descriptionLocalizations: {
                                ko: "스나이프할 유저."
                            },
                            required: false,
                        }
                    ]
                }
            ],
            dmPermission: false,
        });

        this.client.eventNames
    }

    chatInput(interaction: ChatInputCommandInteraction<"cached">) {
        return new Promise<InteractionReplyOptions>((resolve) => {
            const subcommand = interaction.options.getSubcommand();
            const channel = interaction.options.getChannel("channel") ?? interaction.channel!;
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

            const target = channel.isThread() ? channel.parent : channel;
            if (!target?.isTextBased() || target.isVoiceBased() || !target?.topic?.includes("#snipe")) {
                return resolve({
                    embeds: [
                        {
                            title: scripts.not_available_channel(`<#${channel.id}>`),
                            description: scripts.please_add_tag_to_the_channel_topic,
                            color: colors.error
                        }
                    ]
                });
            }

            if (subcommand === "edit") {
                const now = Date.now();
                const snipes = (editsnipe.get(channel.id) ?? []).reverse().filter(({ createdAt }) => {
                    return now - createdAt.getTime() < 18000000;
                });

                if (!snipes.length) {
                    editsnipe.delete(channel.id);
                    return resolve({
                        embeds: [
                            {
                                title: scripts.there_are_no_messages_on_channel_to_snipe(`<#${channel.id}>`),
                                color: colors.error
                            }
                        ], flags: ["Ephemeral"]
                    });
                }

                const user = interaction.options.getUser("user");
                const sniped = user ? snipes.find((snipe, i) => {
                    if (snipe.author.id === user.id) {
                        return snipes.splice(i, 1);
                    }
                }) : snipes.shift();

                if (snipes.length) {
                    editsnipe.set(channel.id, snipes.reverse());
                } else {
                    editsnipe.delete(channel.id);
                }

                if (!sniped) {
                    return resolve({
                        embeds: [
                            {
                                title: scripts.there_are_no_messages_to_snipe_from_user_on_channel(`@${user?.tag}`, `<#${channel.id}>`),
                                color: colors.error
                            }
                        ], flags: ["Ephemeral"]
                    });
                }

                resolve({
                    embeds: [
                        {
                            author: { name: sniped.author.tag, icon_url: sniped.author.displayAvatarURL() },
                            description: `${sniped.reference ?? `<#${channel.id}>`}\n` + sniped.content,
                            color: colors.accent,
                            timestamp: sniped.editedAt?.toISOString()
                        }
                    ]
                });
            } else if (subcommand === "delete") {
                const now = Date.now();
                const snipes = (snipe.get(channel.id) ?? []).reverse().filter(({ createdAt }) => {
                    return now - createdAt.getTime() < 18000000;
                });

                if (!snipes.length) {
                    snipe.delete(channel.id);
                    return resolve({
                        embeds: [
                            {
                                title: scripts.there_are_no_messages_on_channel_to_snipe(`<#${channel.id}>`),
                                color: colors.error
                            }
                        ], flags: ["Ephemeral"]
                    });
                }

                const user = interaction.options.getUser("user");
                const sniped = user ? snipes.find((snipe, i) => {
                    if (snipe.author.id === user.id) {
                        return snipes.splice(i, 1);
                    }
                }) : snipes.shift();

                if (snipes.length) {
                    snipe.set(channel.id, snipes.reverse());
                } else {
                    snipe.delete(channel.id);
                }

                if (!sniped) {
                    return resolve({
                        embeds: [
                            {
                                title: scripts.there_are_no_messages_to_snipe_from_user_on_channel(`@${user?.tag}`, `<#${channel.id}>`),
                                color: colors.error
                            }
                        ], flags: ["Ephemeral"]
                    });
                }

                resolve({
                    embeds: [
                        {
                            author: { name: sniped.author.tag, icon_url: sniped.author.displayAvatarURL() },
                            description: `${sniped.reference ?? `<#${channel.id}>`}\n` + sniped.content,
                            color: colors.accent,
                            timestamp: sniped.createdAt.toISOString()
                        }
                    ]
                });
            }
        });
    }
}