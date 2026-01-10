import {
  ApplicationCommandType,
  Collection,
  type Client,
} from "discord.js";
import { Command, SubCommand } from "../core/types";

export default class Meme extends Command {
  subcommands = new Collection<string, SubCommand>();

  constructor(client: Client) {
    super(client, {
      type: ApplicationCommandType.ChatInput,
      name: "meme",
      description: "Meme commands.",
      nameLocalizations: {
        ko: "밈",
      },
      descriptionLocalizations: {
        ko: "밈 명령어.",
      },
      options: [],
    });
  }
}
