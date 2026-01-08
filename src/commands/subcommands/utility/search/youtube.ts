import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    ComponentType,
    ApplicationCommandOptionType,
    type ApplicationCommandOptionChoiceData,
    type InteractionReplyOptions,
    type Locale,
    type StringSelectMenuInteraction,
    type InteractionUpdateOptions,
    LimitedCollection,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";
import { StringUtils } from "../../../../core/utils/utils";
import YouTube, { type Video } from "youtube-sr";
import { colors } from "../../../../config";

export interface IScripts {
    youtube_search_for_query: (query: string) => string;
    no_result: string;
}

export default class extends SubCommand {
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            youtube_search_for_query: (query: string) => `유튜브 "${query}" 검색 결과`,
            no_result: "결과가 없습니다"
        },
        "en-US": {
            youtube_search_for_query: (query: string) => `Youtube Search for "${query}"`,
            no_result: "There's no result"
        }
    };

    history: LimitedCollection<string, Video[]> = new LimitedCollection({ maxSize: 100 });

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "youtube",
            description: "Search on YouTube.",
            nameLocalizations: {
                ko: "유튜브"
            },
            descriptionLocalizations: {
                ko: "유튜브에 검색해요."
            },
            options: [{
                type: ApplicationCommandOptionType.String,
                name: "query",
                description: "Search query.",
                nameLocalizations: {
                    ko: "검색어"
                },
                descriptionLocalizations: {
                    ko: "검색할 내용."
                },
                maxLength: 98,
                required: true,
                autocomplete: true
            }]
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            interaction.deferReply().then(() => {
                const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

                const splits = interaction.options.getString("query", true).split("|");
                const last = splits.pop() ?? "";
                let index = 0;
                if (/^\d$/.test(last)) {
                    index = parseInt(last);
                } else {
                    splits.push(last);
                }
                const query = splits.join("|");

                this.getSearchResult(query).then((results) => {
                    if (!results.length) {
                        return resolve({
                            embeds: [
                                {
                                    author: { name: scripts.youtube_search_for_query(query), icon_url: "https://www.youtube.com/s/desktop/1c21ae68/img/favicon_144x144.png" },
                                    description: scripts.no_result,
                                    footer: { text: `Provided by Youtube Search • ${this.client.user?.username}` },
                                    color: colors.accent
                                }
                            ]
                        });
                    }
                    const select = results[index];
                    resolve({
                        embeds: [
                            {
                                author: { name: scripts.youtube_search_for_query(query), icon_url: "https://www.youtube.com/s/desktop/1c21ae68/img/favicon_144x144.png" },
                                title: StringUtils.ellipsis(`${StringUtils.ellipsis(select.channel?.name, 25)} - ${select.title}`, 100),
                                url: select.url,
                                description: select.description,
                                image: { url: select.thumbnail?.url ?? "" },
                                footer: { text: `Provided by Youtube Search • ${this.client.user?.username}` },
                                color: colors.accent
                            }
                        ],
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        customId: `${interaction.user.id}|${interaction.commandName}|${interaction.options.getSubcommandGroup()} ${interaction.options.getSubcommand()}`,
                                        options: results.slice(0, 25).map((item, i: number) => ({
                                            label: StringUtils.ellipsis(`${StringUtils.ellipsis(item.channel?.name, 25)} - ${item.title}`, 100),
                                            value: `${query}${i.toString().padStart(2, '0')}`,
                                            default: i == index
                                        }))
                                    }
                                ]
                            }
                        ]
                    });
                }).catch(reject);
            }).catch(reject);
        });
    }

    stringSelect(interaction: StringSelectMenuInteraction<"cached">) {
        return new Promise<InteractionUpdateOptions>((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

            const query = interaction.values[0].slice(0, -2);
            const index = parseInt(interaction.values[0].slice(-2)) || 0;

            this.getSearchResult(query).then((results) => {
                if (!results.length) {
                    return resolve({
                        embeds: [
                            {
                                author: { name: scripts.youtube_search_for_query(query), icon_url: "https://www.youtube.com/s/desktop/1c21ae68/img/favicon_144x144.png" },
                                description: scripts.no_result,
                                footer: { text: `Provided by Youtube Search • ${this.client.user?.username}` },
                                color: colors.accent
                            }
                        ]
                    });
                }
                const select = results[index];
                resolve({
                    embeds: [
                        {
                            author: { name: scripts.youtube_search_for_query(query), icon_url: "https://www.youtube.com/s/desktop/1c21ae68/img/favicon_144x144.png" },
                            title: StringUtils.ellipsis(`${StringUtils.ellipsis(select.channel?.name, 25)} - ${select.title}`, 100),
                            url: select.url,
                            description: select.description,
                            image: { url: select.thumbnail?.url ?? "" },
                            footer: { text: `Provided by Youtube Search • ${this.client.user?.username}` },
                            color: colors.accent
                        }
                    ],
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.StringSelect,
                                    customId: interaction.customId,
                                    options: results.slice(0, 25).map((item, i: number) => ({
                                        label: StringUtils.ellipsis(`${StringUtils.ellipsis(item.channel?.name, 25)} - ${item.title}`, 100),
                                        value: `${query}${i.toString().padStart(2, '0')}`,
                                        default: i == index
                                    }))
                                }
                            ]
                        }
                    ]
                });
            }).catch(reject);
        });
    }

    autocomplete(interaction: AutocompleteInteraction<"cached">) {
        return new Promise<ApplicationCommandOptionChoiceData[]>((resolve, reject) => {
            const query = interaction.options.getString("query", true).slice(0, 96);
            if (!query) return resolve([]);
            this.getSearchResult(query).then((results) => {
                resolve(
                    results.slice(0, 10).map((item, index: number) => {
                        return {
                            name: StringUtils.ellipsis(`${StringUtils.ellipsis(item.channel?.name, 25)} - ${item.title}`, 100),
                            value: `${query}|${index}`
                        };
                    })
                )
            }).catch(reject);
        });
    }

    getSearchResult(query: string) {
        return new Promise<Video[]>((resolve, reject) => {
            const cached = this.history.get(query);
            if (cached) return resolve(cached);
            
            YouTube.search(query, { limit: 25, type: "video" }).then((results) => {
                this.history.set(query, results);
                resolve(results);
            }).catch(reject);
        });
    }
}
