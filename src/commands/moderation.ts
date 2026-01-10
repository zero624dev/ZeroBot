import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
  Collection,
  type InteractionReplyOptions,
  type Locale,
  type Client,
} from "discord.js";
import { Command } from "../core/types";
import { colors } from "../config";

export interface IScripts {
  purged_messages: (n: number) => string;
  purged_messages_from_user: (n: number, u: string) => string;
  failed_to_purge: string;
}

export default class extends Command {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      purged_messages: (n) => `**${n}**개의 메시지를 삭제했어요.`,
      purged_messages_from_user: (n, u) => `<@${u}>님의 **${n}**개의 메시지를 삭제했어요.`,
      failed_to_purge: "메시지를 삭제하지 못했어요.",
    },
    "en-US": {
      purged_messages: (n) => `Purged **${n}** messages.`,
      purged_messages_from_user: (n, u) => `Purged **${n}** messages from <@${u}>.`,
      failed_to_purge: "Failed to purge messages.",
    },
  };

  constructor(client: Client) {
    super(client, {
      type: ApplicationCommandType.ChatInput,
      name: "moderation",
      description: "Moderation Commands.",
      nameLocalizations: {
        ko: "관리",
      },
      descriptionLocalizations: {
        ko: "관리 명령어.",
      },
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "purge",
          description: "Purge messages.",
          nameLocalizations: {
            ko: "지우기",
          },
          descriptionLocalizations: {
            ko: "메시지를 삭제해요.",
          },
          options: [{
            type: ApplicationCommandOptionType.Integer,
            name: "amount",
            description: "Amount of messages to delete.",
            nameLocalizations: {
              ko: "개수",
            },
            descriptionLocalizations: {
              ko: "삭제할 메시지 개수.",
            },
            required: true,
            maxValue: 100,
          }, {
            type: ApplicationCommandOptionType.User,
            name: "user",
            description: "User to delete messages from.",
            nameLocalizations: {
              ko: "유저",
            },
            descriptionLocalizations: {
              ko: "메시지를 삭제할 유저.",
            },
          }],
        },
      ],
      dmPermission: false,
    }, {
      permissions: [
        "ManageMessages",
      ],
    });
  }

  chatInput(interaction: ChatInputCommandInteraction<"cached">) {
    return new Promise<InteractionReplyOptions>((resolve) => {
      const subcommand = interaction.options.getSubcommand();
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

      if (subcommand == "purge") {
        const amount = interaction.options.getInteger("amount", true);
        const target = interaction.options.getUser("user");

        interaction.deferReply({ flags: ["Ephemeral"] }).then(() => {
          new Promise<Collection<string, any>>((resolve, reject) => {
            if (target) {
              interaction.channel!.messages.fetch({ limit: amount, cache: false })
                .then((messages) => interaction.channel?.bulkDelete(messages.filter((m) => m.author.id == target.id), true).then(resolve).catch(reject))
                .catch(reject);
            } else {
              interaction.channel!.bulkDelete(amount, true).then(resolve).catch(reject);
            }
          }).then((deletedMessages) => {
            resolve({
              embeds: [{
                description: target
                  ? scripts.purged_messages_from_user(deletedMessages.size, target.id)
                  : scripts.purged_messages(deletedMessages.size),
                color: colors.accent,
              }], flags: ["Ephemeral"],
            });
          }).catch(() => {
            resolve({
              embeds: [{
                title: scripts.failed_to_purge,
                color: colors.error,
              }], flags: ["Ephemeral"],
            });
          });
        });
      }
    });
  }
}
