import {
    ApplicationCommandOptionType,
    ButtonInteraction,
    ChatInputCommandInteraction,
    StringSelectMenuInteraction,
    type InteractionUpdateOptions,
    type InteractionReplyOptions,
    type Locale,
} from "discord.js";
import { Command, SubCommand } from "../../../core/types";
import { getMenuOptionPage } from "../../../core/utils/utils";
import { colors, DEEPL_TOKEN } from "../../../config";

export interface IScripts {
    language: { [key: string]: string };
    source_language: (lang: string) => string;
    target_language: (lang: string) => string;
    result_embed_title: string;
    source_language_placeholder: string;
    target_language_placeholder: string;
}

export default class Translate extends SubCommand {
    supportedLang = [
        'BG', 'CS', 'DA', 'DE', 'EL',
        'EN', 'ES', 'ET', 'FI', 'FR',
        'HU', 'ID', 'IT', 'JA', 'KO',
        'LT', 'LV', 'NB', 'NL', 'PL',
        'PT', 'RO', 'RU', 'SK', 'SL',
        'SV', 'TR', 'UK', 'ZH'
    ];
    lang2emoji: any = {
        "BG": "🇧🇬", "CS": "🇨🇿", "DA": "🇩🇰", "DE": "🇩🇪", "EL": "🇬🇷",
        "EN": "🇬🇧", "ES": "🇪🇸", "ET": "🇪🇪", "FI": "🇫🇮", "FR": "🇫🇷",
        "HU": "🇭🇺", "ID": "🇮🇩", "IT": "🇮🇹", "JA": "🇯🇵", "KO": "🇰🇷",
        "LT": "🇱🇹", "LV": "🇱🇻", "NB": "🇳🇴", "NL": "🇳🇱", "PL": "🇵🇱",
        "PT": "🇵🇹", "RO": "🇷🇴", "RU": "🇷🇺", "SK": "🇸🇰", "SL": "🇸🇮",
        "SV": "🇸🇪", "TR": "🇹🇷", "UK": "🇺🇦", "ZH": "🇨🇳"
    };
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            language: {
                BG: '불가리아어',
                CS: '체코어',
                DA: '덴마크어',
                DE: '독일어',
                EL: '그리스어',
                EN: '영어',
                ES: '스페인어',
                ET: '에스토니아어',
                FI: '핀란드어',
                FR: '프랑스어',
                HU: '헝가리어',
                ID: '인도네시아어',
                IT: '이탈리아어',
                JA: '일본어',
                KO: '한국어',
                LT: '리투아니아어',
                LV: '라트비아어',
                NB: '노르웨이어',
                NL: '네덜란드어',
                PL: '폴란드어',
                PT: '포르투갈어',
                RO: '루마니아어',
                RU: '러시아어',
                SK: '슬로바키아어',
                SL: '슬로베니아어',
                SV: '스웨덴어',
                TR: '터키어',
                UK: '우크라이나어',
                ZH: '중국어'
            },
            source_language: (lang: string) => `번역 대상 : ${lang}`,
            target_language: (lang: string) => `번역 결과 : ${lang}`,
            result_embed_title: "번역기",
            source_language_placeholder: "번역 대상 언어를 선택해주세요.",
            target_language_placeholder: "번역 결과 언어를 선택해주세요.",
        },
        "en-US": {
            language: {
                BG: 'Bulgarian',
                CS: 'Czech',
                DA: 'Danish',
                DE: 'German',
                EL: 'Greek',
                EN: 'English',
                ES: 'Spanish',
                ET: 'Estonian',
                FI: 'Finnish',
                FR: 'French',
                HU: 'Hungarian',
                ID: 'Indonesian',
                IT: 'Italian',
                JA: 'Japanese',
                KO: 'Korean',
                LT: 'Lithuanian',
                LV: 'Latvian',
                NB: 'Norwegian',
                NL: 'Dutch',
                PL: 'Polish',
                PT: 'Portuguese',
                RO: 'Romanian',
                RU: 'Russian',
                SK: 'Slovak',
                SL: 'Slovenian',
                SV: 'Swedish',
                TR: 'Turkish',
                UK: 'Ukrainian',
                ZH: 'Chinese'
            },
            source_language: (lang: string) => `Source : ${lang}`,
            target_language: (lang: string) => `Result : ${lang}`,
            result_embed_title: "Translate",
            source_language_placeholder: "Please select a source language.",
            target_language_placeholder: "Please select a result language.",
        }
    }

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "translate",
            description: "Translate text to another language.",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "text",
                    description: "The text to translate.",
                    nameLocalizations: {
                        ko: "텍스트"
                    },
                    descriptionLocalizations: {
                        ko: "번역할 텍스트."
                    },
                    required: true,
                    maxLength: 200
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
            const text = interaction.options.getString("text", true);

            const targetLang = text.split("").map(c => {
                if (c.match(/[ㄱ-ㅎㅏ-ㅣ가-힣]/)) return 1;
                else return 0;
            }).reduce((a: number, b) => a + b, 0) / text.length > 0.5 ? "EN" : "KO";
            this.translate(text, null, targetLang).then(data => {
                if (data.errorCode) {
                    resolve({
                        embeds: [
                            {
                                title: data.errorMessage,
                                footer: { text: `Error Occurred • ${data.errorCode} • ${this.client.user?.username}` },
                                color: colors.error
                            }
                        ]
                    })
                } else {
                    const sourceLang = data.translations[0].detected_source_language;
                    resolve({
                        embeds: [
                            {
                                title: scripts.result_embed_title,
                                fields: [
                                    { name: scripts.source_language(scripts.language[sourceLang]), value: text, inline: false },
                                    { name: scripts.target_language(scripts.language[targetLang]), value: data.translations[0].text, inline: false },
                                ],
                                footer: { text: `Provided by DeepL API • ${this.client.user?.username}`, icon_url: "https://static.deepl.com/img/favicon/tile_144.png" },
                                color: colors.accent
                            }
                        ],
                        components: [
                            {
                                components: [
                                    {
                                        customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|selectSrcLang|${sourceLang}|${targetLang}`,
                                        label: scripts.language[sourceLang],
                                        style: 1,
                                        type: 2,
                                    },
                                    {
                                        customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|changeLang|${sourceLang}|${targetLang}`,
                                        emoji: "🔁",
                                        style: 1,
                                        type: 2,
                                    },
                                    {
                                        customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|selectTarLang|${sourceLang}|${targetLang}`,
                                        label: scripts.language[targetLang],
                                        style: 1,
                                        type: 2,
                                    }
                                ], type: 1
                            },
                        ]
                    });
                }
            }).catch(reject);
        });
    }

    button(interaction: ButtonInteraction, args: string[]) {
        return new Promise<InteractionUpdateOptions>((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
            const [action, srcLang, tarLang] = args;

            if (action == "changeLang") {
                const text = interaction.message.embeds[0].fields?.[1].value as string;
                this.translate(text, tarLang, srcLang).then(data => {
                    if (data.message) {
                        resolve({
                            embeds: [
                                {
                                    title: data.message,
                                    color: colors.error
                                }
                            ]
                        })
                    } else {
                        resolve({
                            embeds: [
                                {
                                    title: scripts.result_embed_title,
                                    fields: [
                                        { name: scripts.source_language(scripts.language[tarLang]), value: text, inline: false },
                                        { name: scripts.target_language(scripts.language[srcLang]), value: data.translations[0].text, inline: false },
                                    ],
                                    footer: { text: `Provided by DeepL API • ${this.client.user?.username}`, icon_url: "https://static.deepl.com/img/favicon/tile_144.png" },
                                    color: colors.accent
                                }
                            ],
                            components: [
                                {
                                    components: [
                                        {
                                            customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|selectSrcLang|${tarLang}|${srcLang}`,
                                            label: scripts.language[tarLang],
                                            style: 1,
                                            type: 2,
                                        },
                                        {
                                            customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|changeLang|${tarLang}|${srcLang}`,
                                            emoji: "🔁",
                                            style: 1,
                                            type: 2,
                                        },
                                        {
                                            customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|selectTarLang|${tarLang}|${srcLang}`,
                                            label: scripts.language[srcLang],
                                            style: 1,
                                            type: 2,
                                        }
                                    ], type: 1
                                },
                            ]
                        });
                    }
                }).catch(reject);
            } else {
                resolve({
                    embeds: interaction.message.embeds,
                    components: [
                        interaction.message.components?.[0] as any,
                        {
                            components: [
                                {
                                    customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|${action}|${srcLang}|${tarLang}|`,
                                    options: getMenuOptionPage({
                                        data: this.supportedLang.filter(lang => lang != (action == "selectSrcLang" ? srcLang : tarLang)),
                                        format: (lang) => ({ label: scripts.language[lang], emoji: this.lang2emoji[lang], value: lang })
                                    }),
                                    placeholder: action == "selectSrcLang" ? scripts.source_language_placeholder : scripts.target_language_placeholder,
                                    type: 3
                                },
                            ], type: 1
                        },
                    ]
                })
            }
        });
    }

    stringSelect(interaction: StringSelectMenuInteraction, args: string[]) {
        return new Promise<InteractionUpdateOptions>((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
            const text = interaction.message.embeds[0].fields?.[0].value as string;
            const select = interaction.values[0];
            const action = args.shift();
            let [srcLang, tarLang] = args;

            if (/^[0-9]{1,}p$/.test(select)) {
                resolve({
                    embeds: interaction.message.embeds,
                    components: [
                        interaction.message.components?.[0] as any,
                        {
                            components: [
                                {
                                    customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|${action}|${srcLang}|${tarLang}|`,
                                    options: getMenuOptionPage({
                                        data: this.supportedLang.filter(lang => lang != (action == "selectSrcLang" ? srcLang : tarLang)),
                                        format: (lang) => ({ label: scripts.language[lang], emoji: this.lang2emoji[lang], value: lang }),
                                        page: parseInt(select.slice(0, -1))
                                    }),
                                    placeholder: action == "selectSrcLang" ? scripts.source_language_placeholder : scripts.target_language_placeholder,
                                    type: 3
                                },
                            ], type: 1
                        },
                    ]
                })
            }

            if (action == "selectSrcLang") {
                if (select == tarLang) tarLang = srcLang;
                srcLang = select;
            } else if (action == "selectTarLang") {
                if (select == srcLang) srcLang = tarLang;
                tarLang = select;
            }

            this.translate(text, srcLang, tarLang).then(data => {
                if (data.message) {
                    resolve({
                        embeds: [
                            {
                                title: data.message,
                                color: colors.error
                            }
                        ]
                    })
                } else {
                    resolve({
                        embeds: [
                            {
                                title: scripts.result_embed_title,
                                fields: [
                                    { name: scripts.source_language(scripts.language[srcLang]), value: text, inline: false },
                                    { name: scripts.target_language(scripts.language[tarLang]), value: data.translations[0].text, inline: false },
                                ],
                                footer: { text: `Provided by DeepL API • ${this.client.user?.username}`, icon_url: "https://static.deepl.com/img/favicon/tile_144.png" },
                                color: colors.accent
                            }
                        ],
                        components: [
                            {
                                components: [
                                    {
                                        customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|selectSrcLang|${srcLang}|${tarLang}`,
                                        label: scripts.language[srcLang],
                                        style: 1,
                                        type: 2,
                                    },
                                    {
                                        customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|changeLang|${srcLang}|${tarLang}`,
                                        emoji: "🔁",
                                        style: 1,
                                        type: 2,
                                    },
                                    {
                                        customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|selectTarLang|${srcLang}|${tarLang}`,
                                        label: scripts.language[tarLang],
                                        style: 1,
                                        type: 2,
                                    }
                                ], type: 1
                            },
                        ]
                    });
                }
            }).catch(reject);
        });
    }

    translate(text: string, source: string | null, target: string) {
        return new Promise<any>((resolve, reject) => {
            fetch("https://api-free.deepl.com/v2/translate", {
                method: "POST",
                body: JSON.stringify({ text: [text], source_lang: source, target_lang: target }),
                headers: {
                    "Authorization": `DeepL-Auth-Key ${DEEPL_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }).then(res => res.json()).then(resolve).catch(reject);
        })
    }
}