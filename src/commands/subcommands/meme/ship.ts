import {
    ChatInputCommandInteraction,
    ApplicationCommandOptionType,
    type InteractionReplyOptions,
    type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../core/types";
import crypto from 'crypto';
import { MathUtils } from "../../../core/utils/utils";
import { colors } from "../../../config";

export interface IScripts {
    same_input: string;
    ship_machine: string;
    ship_messages: string[];
}

export default class Ship extends SubCommand {
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            same_input: "같은 걸 비교할 수 없어요.",
            ship_machine: ":heartpulse: **궁합 머신** :heartpulse:",
            ship_messages: [
                "끔찍해요 :sob:",
                "나빠요 :cry:",
                "상당히 낮아요 :frowning:",
                "낮아요 :confused:",
                "평균보다 낮아요 :neutral_face:",
                "겨우 절반이에요 :no_mouth:",
                "나쁘지 않아요 :slight_smile:",
                "꽤 좋아요 :smiley:",
                "대단해요 :smile:",
                "놀라워요! :heart_eyes:",
                "완벽해요!! :heart:"
            ]
        },
        "en-US": {
            same_input: "What are you trying to do here.",
            ship_machine: ":heartpulse: **SHIP MACHINE** :heartpulse:",
            ship_messages: [
                "Awful :sob:",
                "Bad :cry:",
                "Pretty Low :frowning:",
                "Not Too Great :confused:",
                "Worse Than Average :neutral_face:",
                "Barely :no_mouth:",
                "Not Bad :slight_smile:",
                "Pretty Good :smiley:",
                "Great :smile:",
                "Amazing! :heart_eyes:",
                "PERFECT!! :heart:"
            ]
        }
    };

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "ship",
            description: "Shows the ship between <ship1> and <ship2>.",
            nameLocalizations: {
                ko: "궁합"
            },
            descriptionLocalizations: {
                ko: "두 대상의 궁합을 확인합니다."
            },
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "ship1",
                    description: "The first thing to ship.",
                    nameLocalizations: {
                        ko: "대상1"
                    },
                    descriptionLocalizations: {
                        ko: "궁합을 확인할 첫 번째 대상."
                    },
                    required: true,
                    maxLength: 50
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "ship2",
                    description: "The second thing to ship.",
                    nameLocalizations: {
                        ko: "대상2"
                    },
                    descriptionLocalizations: {
                        ko: "궁합을 확인할 두 번째 대상."
                    },
                    required: true,
                    maxLength: 50
                }
            ]
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
            const ship1 = interaction.options.getString("ship1", true);
            const ship2 = interaction.options.getString("ship2", true);
            if (ship1 == ship2) {
                resolve({
                    embeds: [
                        {
                            title: scripts.same_input,
                            color: colors.error
                        }
                    ], ephemeral: true
                });
            } else {
                const percentage = (parseInt(crypto.createHash('md5').update(ship1).digest('hex'), 16) +
                    parseInt(crypto.createHash('md5').update(ship2).digest('hex'), 16)) % 101;
                resolve({
                    embeds: [
                        {
                            title: scripts.ship_machine,
                            description: `:small_red_triangle_down: \`${ship1}\`\n:small_red_triangle: \`${ship2}\`\n**${percentage}%** [\`${this.getBar(percentage)}\`](https://shipping.fandom.com/wiki/Shipping) ${scripts.ship_messages[Math.ceil((percentage + .1) / 10) - 1]}`,
                            color: 16751103 //"#ff99ff"
                        }
                    ]
                });
            }
        });
    }

    getBar(percentage: number) {
        const ration = MathUtils.clamp(Math.round(percentage / 10), 0, 10);
        return `${"█".repeat(ration)}${" ​".repeat(10 - ration)}`
    }
}