import {
    type InteractionReplyOptions,
    type InteractionUpdateOptions,
    type Client,
    ChatInputCommandInteraction,
    ApplicationCommandOptionType,
    ApplicationCommandType,
    Collection,
    ButtonInteraction,
} from "discord.js";
import {
    Command,
    type SubCommand
} from "../core/types";

export default class Game extends Command {
    subcommands: Collection<string, SubCommand> = new Collection();

    constructor(client: Client) {
        super(client, {
            type: ApplicationCommandType.ChatInput,
            name: "game",
            description: "Game commands.",
            nameLocalizations: {
                ko: "게임"
            },
            descriptionLocalizations: {
                ko: "게임 명령어."
            },
            options: [
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: "farm",
                    description: "Farm Commands",
                    nameLocalizations: {
                        ko: "농사"
                    },
                    descriptionLocalizations: {
                        ko: "농사 명령어"
                    },
                    options: []
                },
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: "gamble",
                    description: "Gamble Commands",
                    nameLocalizations: {
                        ko: "도박"
                    },
                    descriptionLocalizations: {
                        ko: "도박 명령어"
                    },
                    options: []
                },
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: "shop",
                    description: "shop commands",
                    nameLocalizations: {
                        ko: "상점"
                    },
                    descriptionLocalizations: {
                        ko: "상점 명령어"
                    },
                    options: []
                },
            ]
        }, {
            registrationRequired: true
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            const subcommandGroup = interaction.options.getSubcommandGroup();
            const subcommandName = interaction.options.getSubcommand();
            const subcommand = this.subcommands.get(subcommandGroup ? `${subcommandGroup} ${subcommandName}` : subcommandName);

            if (!subcommand?.chatInput) {
                return reject(`${subcommandName}: Subcommand not found.`);
            }

            subcommand.chatInput(interaction).then(resolve as () => Promise<InteractionReplyOptions>).catch(reject);
        });
    }

    button(interaction: ButtonInteraction, args: string[]) {
        return new Promise<InteractionUpdateOptions>((resolve, reject) => {
            const subcommandName = args.shift() ?? "";
            const subcommand = this.subcommands.get(subcommandName);

            if (!subcommand?.button) {
                return reject(`${subcommandName}: Subcommand not found.`);
            }

            subcommand.button(interaction, args).then(resolve).catch(reject);
        });
    }
}
