import {
    ChatInputCommandInteraction,
    ApplicationCommandOptionType,
    ComponentType,
    ButtonStyle,
    type InteractionReplyOptions,
    type Locale,
    type ButtonInteraction,
    type InteractionUpdateOptions,
} from "discord.js";
import { SubCommand, type Command } from "../../../core/types";
import mongoose from "mongoose";
import { colors } from "../../../config";
import { mentionCommand } from "../../../core/utils/utils";

export interface IScripts {
    only_one_account_can_be_created: string;
    delete_account_with_command: (command: string) => string;
    create_account_title: string;
    create_account_description: string;
    create_account_footer: string;
    agree_to_terms_and_conditions: string;
    complete_registration: string;
    decline_terms_and_conditions: string;
    cancel_registration: string;
}

export default class Ship extends SubCommand {
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            only_one_account_can_be_created: "계정은 하나만 생성할 수 있어요.",
            delete_account_with_command: (command) => `${command}으로 계정을 삭제할 수 있어요.`,
            create_account_title: "이용약관 동의",
            create_account_description: "[서비스 이용약관](https://zerobot-policies.pages.dev/terms), [개인정보 처리방침](https://zerobot-policies.pages.dev/privacy)",
            create_account_footer: "아래 ⭕ 버튼을 눌러 약관에 동의해주세요.",
            agree_to_terms_and_conditions: "서비스 이용약관에 동의하셨어요.",
            complete_registration: "계정 생성을 완료했어요.",
            decline_terms_and_conditions: "서비스 이용약관에 거부하셨어요.",
            cancel_registration: "계정 생성을 취소했어요.",
        },
        "en-US": {
            only_one_account_can_be_created: "You can only create one account.",
            delete_account_with_command: (command) => `You can delete the account with ${command}.`,
            create_account_title: "Terms & Conditions Agreement",
            create_account_description: "[Terms of Service](https://zerobot.kr/terms), [Privacy Policy](https://zerobot.kr/privacy)",
            create_account_footer: "You can agree by pressing the ⭕ button below.",
            agree_to_terms_and_conditions: "You have agreed to the Terms & Conditions Agreement.",
            complete_registration: "You have completed your registration.",
            decline_terms_and_conditions: "You have declined the Terms & Conditions Agreement.",
            cancel_registration: "You have canceled the registration.",
        }
    };

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "create",
            description: "Create an account.",
            nameLocalizations: {
                "ko": "생성"
            },
            descriptionLocalizations: {
                "ko": "계정을 생성합니다."
            }
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

            mongoose.model("User").exists({ _id: interaction.user.id }).then((exists) => {
                if (exists) {
                    return resolve({
                        embeds: [
                            {
                                title: scripts.only_one_account_can_be_created,
                                description: scripts.delete_account_with_command(mentionCommand(this.client, this.parent.data.name, "delete")),
                                color: colors.error
                            }
                        ]
                    });
                }
                resolve({
                    embeds: [
                        {
                            title: scripts.create_account_title,
                            description: scripts.create_account_description,
                            footer: { text: scripts.create_account_footer, icon_url: interaction.user.displayAvatarURL() },
                            color: colors.accent
                        }
                    ], components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    customId: `${interaction.user.id}|${interaction.commandName}|${this.data.name}|agree`,
                                    emoji: "⭕",
                                    style: ButtonStyle.Primary
                                },
                                {
                                    type: ComponentType.Button,
                                    customId: `${interaction.user.id}|${interaction.commandName}|${this.data.name}|decline`,
                                    emoji: "❌",
                                    style: ButtonStyle.Primary
                                }
                            ]
                        }
                    ]
                });
            }).catch(reject);
        });
    }

    button(interaction: ButtonInteraction, args: string[]) {
        return new Promise<InteractionUpdateOptions>((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

            if (args[0] == "agree") {
                mongoose.model("User").create({ _id: interaction.user.id }).then(() => {
                    resolve({
                        embeds: [
                            {
                                title: scripts.agree_to_terms_and_conditions,
                                description: scripts.complete_registration,
                                color: colors.accent
                            }
                        ], components: []
                    });
                }).catch(reject);
            } else {
                resolve({
                    embeds: [
                        {
                            title: scripts.decline_terms_and_conditions,
                            description: scripts.cancel_registration,
                            color: colors.error
                        }
                    ], components: []
                });
            }
        });
    }
}