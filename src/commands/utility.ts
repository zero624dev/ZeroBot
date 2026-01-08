import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    Collection,
    type Client
} from "discord.js";
import { Command, type SubCommand } from "../core/types";

export default class extends Command {
    subcommands: Collection<string, SubCommand> = new Collection();

    constructor(client: Client) {
        super(client, {
            type: ApplicationCommandType.ChatInput,
            name: "utility",
            description: "Utility commands.",
            nameLocalizations: {
                ko: "유틸리티"
            },
            descriptionLocalizations: {
                ko: "유틸리티 명령어."
            },
            options: [
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: "search",
                    description: "Search Commands",
                    nameLocalizations: {
                        ko: "검색"
                    },
                    descriptionLocalizations: {
                        ko: "검색 명령어"
                    },
                    options: [ ]
                },
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: "school",
                    description: "School Commands",
                    nameLocalizations: {
                        ko: "학교"
                    },
                    descriptionLocalizations: {
                        ko: "학교 명령어"
                    },
                    options: [ ]
                },
                // {
                //     type: ApplicationCommandOptionType.Subcommand,
                //     name: "pick",
                //     description: "Pick a item from list",
                //     nameLocalizations: {
                //         ko: "선태"
                //     },
                //     descriptionLocalizations: {
                //       ko: ""
                //     }
                // }
            ]
        });
    }
}