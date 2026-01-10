import {
  ApplicationCommandOptionType,
  ComponentType,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type InteractionUpdateOptions,
  type InteractionReplyOptions,
  type ButtonInteraction,
  type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../core/types";
import { colors } from "../../../config";
import { getRankedUsersByWallet } from "../../../addons/database/repository/GameRepo";

export interface IScripts {
  wallet_rank: string;
  nth_place: (place: string | number) => string;
  cash_notation: (number: string) => string;
}

export default class Rank extends SubCommand {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      wallet_rank: "지갑 순위",
      nth_place: (place) => `${place}위`,
      cash_notation: (number) => `${number}`,
    },
    "en-US": {
      wallet_rank: "Wallet Rankings",
      nth_place: (place) => `${place}th`,
      cash_notation: (number) => `${number}`,
    },
  };

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "rankings",
      description: "Shows currency rankings",
      nameLocalizations: {
        ko: "순위",
      },
      descriptionLocalizations: {
        ko: "화폐 보유 순위를 보여줘요.",
      },
    });
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>((resolve, reject) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

      interaction.deferReply().then(() => {
        getRankedUsersByWallet(15, 0).then(async ({ users, count }) => {
          return {
            users: await this.setUsername(users),
            count: count,
          };
        }).then(({ users, count }) => {
          resolve({
            embeds: [
              {
                title: `${scripts.wallet_rank} (${scripts.nth_place(`1-${Math.min(15, count)}`)})`,
                fields: users.map((v, i) => {
                  return {
                    name: ["🥇", "🥈", "🥉"][i] ?? scripts.nth_place(i + 1),
                    value: `**@${v.username}**\n> ${scripts.cash_notation(v.wallet.toLocaleString(interaction.locale))}`,
                    inline: true,
                  };
                }),
                color: colors.accent,
              },
            ],
            components: [
              {
                type: ComponentType.ActionRow,
                components: [
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Primary,
                    label: "◀",
                    custom_id: "disabled1",
                    disabled: true,
                  },
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Secondary,
                    label: `1 / ${Math.ceil(count / 15)}`,
                    custom_id: "disabled2",
                    disabled: true,
                  },
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Primary,
                    label: "▶",
                    custom_id: `${interaction.user.id}|${interaction.commandName}|${interaction.options.getSubcommand()}|2`,
                    disabled: count <= 15,
                  },
                ],
              },
            ],
          });
        }).catch(reject);
      }).catch(reject);
    });
  }

  button(interaction: ButtonInteraction<"cached">, args: string[]) {
    return new Promise<InteractionUpdateOptions>((resolve, reject) => {
      const page = parseInt(args[0], 10);
      interaction.update({
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                style: ButtonStyle.Primary,
                label: "◀",
                custom_id: "disabled1",
                disabled: true,
              },
              {
                type: ComponentType.Button,
                style: ButtonStyle.Secondary,
                emoji: {
                  name: "loading",
                  id: "1078092859611283498",
                  animated: true,
                },
                custom_id: "disabled2",
                disabled: true,
              },
              {
                type: ComponentType.Button,
                style: ButtonStyle.Primary,
                label: "▶",
                custom_id: "disabled3",
                disabled: true,
              },
            ],
          },
        ],
      }).then(() => {
        getRankedUsersByWallet(page * 15, (page - 1) * 15).then(async ({ users, count }) => {
          return {
            users: await this.setUsername(users),
            count: count,
          };
        }).then(({ users, count }) => {
          const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
          const [, commandName, subcommandName] = interaction.customId.split("|");
          const maxPage = Math.ceil(count / 15);
          resolve({
            embeds: [{
              title: `${scripts.wallet_rank} (${scripts.nth_place(`${(page - 1) * 15 + 1}-${page == maxPage ? count : page * 15}`)})`,
              fields: users.map((v, i) => {
                return {
                  name: ["🥇", "🥈", "🥉"][i + (page - 1) * 15] ?? scripts.nth_place(i + 1 + (page - 1) * 15),
                  value: `**@${v.username}**\n> ${scripts.cash_notation(v.wallet.toLocaleString(interaction.locale))}`,
                  inline: true,
                };
              }),
              color: colors.accent,
            }],
            components: [
              {
                type: ComponentType.ActionRow,
                components: [
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Primary,
                    label: "◀",
                    custom_id: `${interaction.user.id}|${commandName}|${subcommandName}|${page - 1}`,
                    disabled: page == 1,
                  },
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Secondary,
                    label: `${page} / ${maxPage}`,
                    custom_id: "disabled2",
                    disabled: true,
                  },
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Primary,
                    label: "▶",
                    custom_id: `${interaction.user.id}|${commandName}|${subcommandName}|${page + 1}`,
                    disabled: page == maxPage,
                  },
                ],
              },
            ],
          });
        }).catch(reject);
      }).catch(reject);
    });
  }

  async setUsername(users: { id: string; wallet: number }[]): Promise<{ id: string; wallet: number; username: string }[]> {
    const usersWithUsername = [];
    for (let i = 0; i < users.length; i++) {
      usersWithUsername[i] = {
        ...users[i],
        username: await this.client.users.fetch(users[i].id).then((user) => {
          return user.tag;
        }),
      };
    }
    return usersWithUsername;
  }
}
