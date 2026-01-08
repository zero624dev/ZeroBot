import {
    ApplicationCommandType,
    Collection,
    type Client,
} from "discord.js";
import { Command, type SubCommand } from "../core/types";

export default class Meme extends Command {
    subcommands: Collection<string, SubCommand> = new Collection();

    constructor(client: Client) {
        super(client, {
            type: ApplicationCommandType.ChatInput,
            name: "minigame",
            description: "Minigame commands.",
            nameLocalizations: {
                ko: "미니게임"
            },
            descriptionLocalizations: {
                ko: "미니게임 명령어."
            },
            options: []
        });
    }
}
