import {
  ApplicationCommandType,
  type Client,
} from "discord.js";
import { Command } from "../core/types";

export default class Account extends Command {
  constructor(client: Client) {
    super(client, {
      type: ApplicationCommandType.ChatInput,
      name: "account",
      description: "Account management command.",
      nameLocalizations: {
        ko: "계정",
      },
      descriptionLocalizations: {
        ko: "계정 관리 명령어",
      },
      options: [],
    }, {
      cooldown: 1000 * 5,
      subcommandRequired: true,
    });
  }
}
