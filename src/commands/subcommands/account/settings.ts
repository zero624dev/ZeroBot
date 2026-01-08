import {
    ChatInputCommandInteraction,
    ApplicationCommandOptionType,
    ComponentType,
    ButtonStyle,
    TextInputStyle,
    type InteractionReplyOptions,
    type Locale,
    type ButtonInteraction,
    type InteractionUpdateOptions,
    type StringSelectMenuInteraction,
    type Interaction,
    type ModalSubmitInteraction,
} from "discord.js";
import { SubCommand, type Command } from "../../../core/types";
import mongoose from "mongoose";
import { colors, NEIS_TOKEN } from "../../../config";

export interface IScripts {
    account_setting_menu: string;
    please_select_menu: string;
    school_setting: string;
    school_setting_desc: string;
}

export default class Ship extends SubCommand {
    schoolKind: any = {
        "고등학교": "high",
        "중학교": "middle",
        "초등학교": "elementary"
    };

    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            account_setting_menu: "계정 설정 메뉴",
            please_select_menu: "설정할 메뉴를 선택해주세요.",
            school_setting: "학교 설정",
            school_setting_desc: "학교 관련 명령어에서 사용할 정보를 설정합니다."

            
        },
        "en-US": {
            account_setting_menu: "Account Setting Menu",
            please_select_menu: "Please select the menu to set.",
            school_setting: "School Setting",
            school_setting_desc: "Set the information to use in school-related commands."
        }
    };

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "settings",
            description: "Account settings.",
            nameLocalizations: {
                "ko": "설정"
            },
            descriptionLocalizations: {
                "ko": "계정을 설정해요."
            }
        });

        // Intl.supportedValuesOf('timeZone').forEach(tz => {
        //     const [continent, region] = tz.split('/');
        //     this.timezones[continent]?.push(region) ?? (this.timezones[continent] = [region]);
        // });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve) => {
            resolve(this.getMenu(interaction, "main"));
        });
    }

    stringSelect(interaction: StringSelectMenuInteraction, args: string[]) {
        return new Promise<InteractionUpdateOptions>((resolve, reject) => {
            if (args[0] == "selectSchool") {
                const select = interaction.values[0];
                const schoolInfo = select.split("|");
                const schoolName = interaction.component.options.find((o: any) => o.value == select)?.label!;

                interaction.deferUpdate().then(() => {
                    if (args[1]) {
                        this.getClassInfo(schoolInfo, args[1]).then(data => {
                            const classes = args[2] ? data.filter(v => Number(v.CLASS_NM) == Number(args[2]) || v.CLASS_NM == args[2]) : data;
                            if (!classes.length) {
                                return resolve({
                                    embeds: [
                                        {
                                            title: "반을 찾을 수 없어요.",
                                            color: colors.error
                                        }
                                    ]
                                });
                            } else if (classes.length == 1) {
                                mongoose.model("User").findByIdAndUpdate(interaction.user.id, {
                                    $set: {
                                        school: {
                                            kind: schoolInfo[2],
                                            code: schoolInfo.slice(0, 2),
                                            grade: args[1],
                                            classNum: args[2]
                                        }
                                    }
                                }).then(() => {
                                    resolve({
                                        embeds: [
                                            {
                                                title: "학교 설정 업데이트",
                                                description: `${schoolName}\n${args[1]} - ${args[2]} ${classes[0].DEPT_NM ?? ""}`,
                                                color: colors.accent
                                            }
                                        ], components: []
                                    });
                                });
                            } else {
                                resolve({
                                    components: [
                                        {
                                            type: ComponentType.ActionRow,
                                            components: [
                                                {
                                                    type: ComponentType.StringSelect,
                                                    customId: schoolName,
                                                    options: interaction.component.options.map(o => {
                                                        return ({ ...o, default: o.value == select });
                                                    }),
                                                    disabled: true
                                                }
                                            ]
                                        },
                                        {
                                            type: ComponentType.ActionRow,
                                            components: [
                                                {
                                                    type: ComponentType.StringSelect,
                                                    customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|selectClass|${select}`,
                                                    placeholder: "반을 선택해주세요.",
                                                    options: classes.slice(0, 25).map(c => ({
                                                        label: `${args[1]} - ${c.CLASS_NM}`,
                                                        description: c.DDDEP_NM,
                                                        value: `${args[1]}|${c.CLASS_NM}|${c.DDDEP_NM}`
                                                    }))
                                                }
                                            ]
                                        }
                                    ]
                                })
                            }
                        });
                    } else {
                        const schoolName = interaction.component.options.find((o: any) => o.value == select)?.label;
                        mongoose.model("User").findByIdAndUpdate(interaction.user.id, {
                            $set: { school: { kind: schoolInfo[2], code: schoolInfo.slice(0, 2) } }
                        }).then(() => {
                            resolve({
                                embeds: [
                                    {
                                        title: "학교 설정 업데이트",
                                        description: schoolName,
                                        color: colors.accent
                                    }
                                ], components: []
                            });
                        });
                    }
                }).catch(reject);
            } else if (args[0] == "selectClass") {
                const select = interaction.values[0];
                const schoolInfo = select.split("|");

                interaction.deferUpdate().then(() => {
                    mongoose.model("User").findByIdAndUpdate(interaction.user.id, {
                        $set: {
                            school: {
                                kind: args[3],
                                code: args.slice(1, 3),
                                grade: schoolInfo[0],
                                classNum: schoolInfo[1],
                                department: schoolInfo[2]
                            }
                        }
                    }).then(() => {
                        resolve({
                            embeds: [
                                {
                                    title: "학교 설정 업데이트",
                                    description: `${(interaction.message.components[0] as any).components[0].customId!}\n${schoolInfo[0]} - ${schoolInfo[1]} ${schoolInfo[2]}`,
                                    color: colors.accent
                                }
                            ], components: []
                        });
                    });
                }).catch(reject);
            } else {
                const value = interaction.values[0];
                resolve(this.getMenu(interaction, value));
            }
        });
    }

    button(interaction: ButtonInteraction, args: string[]) {
        return new Promise<InteractionUpdateOptions>((resolve, reject) => {
            if (args[0] == "back") {
                resolve(this.getMenu(interaction, "main"));
            } else if (args[0] == "school") {
                if (args[1] == "showInfo") {
                    interaction.deferReply({ ephemeral: true }).then(() => {
                        mongoose.model("User").findById(interaction.user.id, "school").then(user => {
                            if (!user?.school) {
                                return interaction.editReply({
                                    embeds: [
                                        {
                                            title: "설정된 학교 정보가 없어요.",
                                            color: colors.error
                                        }
                                    ]
                                }).catch(reject);
                            }
                            this.getSchool(user.school.code).then(schoolInfo => {
                                interaction.editReply({
                                    embeds: [
                                        {
                                            title: schoolInfo.SCHUL_NM,
                                            description: user.school.grade ? `${Number(user.school.grade) || user.school.grade} - ${Number(user.school.classNum) || user.school.classNum} ${user.school.department ?? ""}` : undefined,
                                            color: colors.accent
                                        }
                                    ]
                                }).catch(reject);
                            }).catch(reject);
                        }).catch(reject);
                    }).catch(reject);
                } else if (args[1] == "deleteInfo") {
                    interaction.deferReply({ ephemeral: true }).then(() => {
                        mongoose.model("User").findByIdAndUpdate(interaction.user.id, { $unset: { school: "" } }).then(() => {
                            resolve({
                                embeds: [
                                    {
                                        title: "학교 정보 삭제",
                                        description: "학교 정보가 삭제되었어요.",
                                        color: colors.accent
                                    }
                                ]
                            });
                        }).catch(reject);
                    }).catch(reject);
                
                } else if (args[1] == "setSchool") {
                    interaction.showModal({
                        title: "힉교 설정",
                        customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|searchSchool|reply`,
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.TextInput,
                                        customId: "schoolName",
                                        label: "학교 이름",
                                        style: TextInputStyle.Short,
                                        maxLength: 50,
                                        required: true,
                                    }
                                ]
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.TextInput,
                                        customId: "grade",
                                        label: "학년",
                                        style: TextInputStyle.Short,
                                        maxLength: 3,
                                        required: false,
                                    }
                                ]
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.TextInput,
                                        customId: "classNum",
                                        label: "반",
                                        style: TextInputStyle.Short,
                                        maxLength: 3,
                                        required: false,
                                    }
                                ]
                            }
                        ],
                    }).catch(reject);
                }
            }
        });
    }

    modalSubmit(interaction: ModalSubmitInteraction, args: string[]) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            if (args[0] == "searchSchool") {
                const schoolName = interaction.fields.getTextInputValue("schoolName");
                const grade = interaction.fields.getTextInputValue("grade");
                const classNum = interaction.fields.getTextInputValue("classNum");
                interaction.deferReply({ ephemeral: true }).then(() => {
                    fetch(
                        `https://open.neis.go.kr/hub/schoolInfo?KEY=${NEIS_TOKEN}&Type=json&SCHUL_NM=${encodeURI(schoolName)}`
                    ).then(res => res.json()).then((data: any) => {
                        const result = data.schoolInfo?.[1]?.row;
                        if (!result) {
                            return resolve({
                                embeds: [
                                    {
                                        title: "학교를 찾을 수 없어요.",
                                        color: colors.error
                                    }
                                ]
                            });
                        }
                        resolve({
                            embeds: [
                                {
                                    title: `나이스 "${schoolName}" 검색 결과`,
                                    color: colors.accent
                                }
                            ],
                            components: [
                                {
                                    type: ComponentType.ActionRow,
                                    components: [
                                        {
                                            type: ComponentType.StringSelect,
                                            customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|selectSchool|${grade}|${classNum}`,
                                            placeholder: "학교를 선택해주세요.",
                                            options: result.slice(0, 25).map((school: any) => {
                                                return ({
                                                    label: school.SCHUL_NM,
                                                    description: school.ORG_RDNMA,
                                                    value: `${school.ATPT_OFCDC_SC_CODE}|${school.SD_SCHUL_CODE}|${this.schoolKind[school.SCHUL_KND_SC_NM]}`
                                                })
                                            })
                                        }
                                    ]
                                }
                            ]
                        });
                    }).catch(reject);
                }).catch(reject);
            }
        });
    }

    getMenu(interaction: Interaction, menu: string): InteractionReplyOptions & InteractionUpdateOptions {
        const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

        if (menu == "school") {
            return {
                embeds: [{
                    title: "학교 설정",
                    description: "아래 버튼을 클릭해 설정창을 열어주세요.",
                    footer: {
                        text: "나이스에 등록된 학교만 지원합니다."
                    },
                    color: colors.accent
                }],
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                label: "내 정보",
                                customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|school|showInfo`,
                                style: ButtonStyle.Success
                            },
                            {
                                type: ComponentType.Button,
                                label: "학교 설정",
                                customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|school|setSchool`,
                                style: ButtonStyle.Primary
                            },
                            {
                                type: ComponentType.Button,
                                emoji: "🗑️",
                                label: "정보 삭제",
                                customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|school|deleteInfo`,
                                style: ButtonStyle.Danger
                            },
                        ]
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                label: "뒤로 가기",
                                customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}|back`,
                                style: ButtonStyle.Secondary
                            },
                        ]
                    }
                ]
            }
        } else if (menu == "timezone") {
            return {

            }
        } else {
            return {
                embeds: [{
                    title: scripts.account_setting_menu,
                    color: colors.accent
                }],
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.StringSelect,
                                customId: `${interaction.user.id}|${this.parent.data.name}|${this.data.name}`,
                                placeholder: scripts.please_select_menu,
                                options: [
                                    {
                                        label: scripts.school_setting,
                                        description: scripts.school_setting_desc,
                                        value: "school",
                                        emoji: "🏫",
                                    },
                                    // {
                                    //     label: "게임 전적 설정",
                                    //     description: "게임 전적 관련 명령어에서 사용할 정보를 설정합니다.",
                                    //     value: "game_stats",
                                    //     emoji: "🎮",
                                    // },
                                    // {
                                    //     label: "시간대 설정",
                                    //     description: "시간대가 필요한 명령어에서 사용할 정보를 설정합니다.",
                                    //     value: "timezone",
                                    //     emoji: "🌏",
                                    // }
                                ]
                            }
                        ]
                    }
                ]
            }
        }
    }

    private getSchool(code: [string, string]) {
        return new Promise<any>((resolve, reject) => {
            fetch(`https://open.neis.go.kr/hub/schoolInfo?KEY=${NEIS_TOKEN}&Type=json&ATPT_OFCDC_SC_CODE=${code[0]}&SD_SCHUL_CODE=${code[1]}`)
                .then(res => res.json()).then((data: any) => {
                    resolve(data.schoolInfo?.[1]?.row?.[0]);
                }).catch(reject);
        });
    }

    private getClassInfo(code: string[], grade?: string) {
        return new Promise<any[]>((resolve, reject) => {
            fetch(`https://open.neis.go.kr/hub/classInfo?KEY=${NEIS_TOKEN}&Type=json&ATPT_OFCDC_SC_CODE=${code[0]}&SD_SCHUL_CODE=${code[1]}&AY=${new Date().getFullYear()}&GRADE=${grade ?? ''}`)
                .then(res => res.json()).then((data: any) => {
                    resolve(data.classInfo?.[1]?.row ?? []);
                }).catch(reject);
        });
    }
}