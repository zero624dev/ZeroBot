import {
    ApplicationCommandOptionType,
    type ChatInputCommandInteraction,
    type InteractionReplyOptions,
    type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";

export interface IScripts {
}

export default class extends SubCommand {
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
        },
        "en-US": {
        }
    };

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "timetable",
            description: "Shows timetable information.",
            nameLocalizations: {
                ko: "시간표"
            },
            descriptionLocalizations: {
                ko: "시간표 정보를 보여줘요."
            },
            options: [{
                type: ApplicationCommandOptionType.String,
                name: "school",
                description: "School name to check timetable.",
                nameLocalizations: {
                    ko: "학교"
                },
                descriptionLocalizations: {
                    ko: "시간표를 확인할 학교 이름."
                },
                required: false,
                autocomplete: true
            }]
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            resolve({
                content: "soon:tm:",
                ephemeral: true
            })
        });
    }
}