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
  no_account: string;
  create_account_with_command: (command: string) => string;
  delete_account_title: string;
  delete_account_description: string;
  agree_to_deletion: string;
  complete_deletion: string;
  decline_deletion: string;
}

export default class Ship extends SubCommand {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      no_account: "계정이 존재하지 않아요.",
      create_account_with_command: (command) => `${command}으로 계정을 생성할 수 있어요.`,
      delete_account_title: "정말 계정을 삭제하시겠어요?",
      delete_account_description: "일부 명령어를 사용하는데 지장이 있을 수 있어요.",
      agree_to_deletion: "계정 삭제에 동의하셨어요.",
      complete_deletion: "계정을 삭제했어요.",
      decline_deletion: "계정 삭제를 취소하셨어요.",
    },
    "en-US": {
      no_account: "The account does not exist.",
      create_account_with_command: (command) => `You can create an account with ${command}.`,
      delete_account_title: "Are you sure you want to delete the account?",
      delete_account_description: "It may interfere with the use of some commands.",
      agree_to_deletion: "You have agreed to the deletion of the account.",
      complete_deletion: "Your account has been deleted.",
      decline_deletion: "You have declined the deletion of the account.",
    },
  };

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "delete",
      description: "Delete the account.",
      nameLocalizations: {
        ko: "삭제",
      },
      descriptionLocalizations: {
        ko: "계정을 삭제합니다.",
      },
    });
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>((resolve, reject) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

      mongoose.model("User").exists({ _id: interaction.user.id }).then((exists) => {
        if (!exists) {
          return resolve({
            embeds: [
              {
                title: scripts.no_account,
                description: scripts.create_account_with_command(mentionCommand(this.client, this.parent.data.name, "create")),
                color: colors.error,
              },
            ],
          });
        }
        resolve({
          embeds: [
            {
              title: scripts.delete_account_title,
              description: scripts.delete_account_description,
              color: colors.accent,
            },
          ], components: [
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.Button,
                  customId: `${interaction.user.id}|${interaction.commandName}|${this.data.name}|agree`,
                  emoji: "⭕",
                  style: ButtonStyle.Primary,
                },
                {
                  type: ComponentType.Button,
                  customId: `${interaction.user.id}|${interaction.commandName}|${this.data.name}|decline`,
                  emoji: "❌",
                  style: ButtonStyle.Primary,
                },
              ],
            },
          ],
        });
      }).catch(reject);
    });
  }

  button(interaction: ButtonInteraction, args: string[]) {
    return new Promise<InteractionUpdateOptions>((resolve, reject) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

      if (args[0] == "agree") {
        mongoose.model("User").deleteOne({ _id: interaction.user.id }).then(() => {
          resolve({
            embeds: [
              {
                title: scripts.agree_to_deletion,
                description: scripts.complete_deletion,
                color: colors.accent,
              },
            ], components: [],
          });
        }).catch(reject);
      } else {
        resolve({
          embeds: [
            {
              title: scripts.decline_deletion,
              color: colors.error,
            },
          ], components: [],
        });
      }
    });
  }
}
