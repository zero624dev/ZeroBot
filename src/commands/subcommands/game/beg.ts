import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  type InteractionReplyOptions,
  type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../core/types";
import { addUserWallet, getUser } from "../../../addons/database/repository/GameRepo";
import { colors } from "../../../config";

export interface IScripts {
  user_beg: (username: string) => string;
  balance: string;
}

export default class Beg extends SubCommand {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      user_beg: (username) => `${username}님의 구걸`,
      balance: "잔고",
    },
    "en-US": {
      user_beg: (username) => `${username}'s Begging`,
      balance: "Balance",
    },
  };

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "beg",
      description: "Beg for money.",
      nameLocalizations: {
        ko: "구걸",
      },
      descriptionLocalizations: {
        ko: "돈 구걸하기",
      },
    }, {
      cooldown: 1000 * 60 * 5,
    });
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>((resolve, reject) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

      getUser(interaction.user.id, "wallet").then((wallet) => {
        const outcome = this.calcAmount();
        addUserWallet(interaction.user.id, outcome).then(() => {
          resolve({
            embeds: [
              {
                title: scripts.user_beg(interaction.user.tag),
                fields: [
                  {
                    name: scripts.balance,
                    value: `${((wallet ?? 0) + outcome).toLocaleString(interaction.locale)} (+${Math.abs(outcome).toLocaleString(interaction.locale)})`,
                    inline: true,
                  },
                ],
                color: colors.accent,
              },
            ],
          });
        }).catch(reject);
      }).catch(reject);
    });
  }

  calcAmount() {
    return Math.floor(Math.pow(1.08648, Math.random() * 100) + 999);
  }
}
