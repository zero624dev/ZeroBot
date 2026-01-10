import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  type InteractionReplyOptions,
  type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";
import { getUser, setUser } from "../../../../addons/database/repository/GameRepo";
import { MathUtils } from "../../../../core/utils/utils";
import { colors } from "../../../../config";

export interface IScripts {
  not_enough_money: string;
  user_slots: (username: string) => string;
  balance: string;
}

export default class PetPet extends SubCommand {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      not_enough_money: "소지금이 최소 베팅액인 **1,000**보다 부족해요.",
      user_slots: (username: string) => `${username}님의 슬롯머신`,
      balance: "잔고",
    },
    "en-US": {
      not_enough_money: "You don't have enough money to bet the minimum amount of **1,000**.",
      user_slots: (username: string) => `${username}'s Slots`,
      balance: "Balance",
    },
  };

  symbols = [
    "🍒",
    "🍋",
    "🍎",
    "🔔",
    "👑",
    "💎",
    "🏆",
    "7️⃣",
    "⭐",
    "🍇",
    "✨",
    "🍑",
    "🍍",
    "🍅",
    "🍉",
    "🍓",
    "🍈",
    "🍊",
    "🍌",
    "🍐",
  ];

  returns = {
    1: 100, // JACKPOT
    2: 5, // TWO
    3: 0, // NONE
  };

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "slots",
      description: "Rewards: Jackpot = 100x, 2 of a kind = 5x",
      nameLocalizations: {
        ko: "슬롯",
      },
      descriptionLocalizations: {
        ko: "배율: 잭팟 = 100x, 2개 일치 = 5x",
      },
      options: [
        {
          name: "bet",
          nameLocalizations: {
            ko: "베팅액",
          },
          description: "Rewards: Jackpot = 100x, 2 of a kind = 5x",
          descriptionLocalizations: {
            ko: "배율: 잭팟 = 100x, 2개 일치 = 5x",
          },
          type: ApplicationCommandOptionType.Integer,
          required: true,
          minValue: 1_000,
          maxValue: 100_000,
        },
      ],
    }, {
      cooldown: 1000 * 5,
    });
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>((resolve, reject) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
      let betAmount = interaction.options.getInteger("bet", true);

      getUser(interaction.user.id, "wallet").then((res) => {
        return res ?? 0;
      }).then((wallet) => {
        if (wallet < betAmount) {
          betAmount = wallet;
        }
        if (betAmount < 1000) {
          return resolve({
            content: scripts.not_enough_money,
            flags: ["Ephemeral"],
          });
        }
        const slots: string[] = [];
        for (let i = 0; i < 3; i++) {
          slots.push(MathUtils.randomArray(this.symbols));
        }
        const matchingCount = new Set(slots).size as keyof typeof this.returns;
        const reward = Math.floor(betAmount * this.returns[matchingCount]);
        const balance = wallet - betAmount + reward;
        setUser(interaction.user.id, { wallet: balance }).then(() => {
          resolve({
            embeds: [
              {
                title: scripts.user_slots(interaction.user.tag),
                description: `${matchingCount == 1 ? "**JACKPOT**\n" : ""}${slots.map((v) => {
                  return `${v}`;
                }).join(" ")}${matchingCount == 1 ? "\n**JACKPOT**" : ""}`,
                fields: [
                  {
                    name: scripts.balance,
                    value: `${balance.toLocaleString(interaction.locale)} (${matchingCount == 3 ? "-" : "+"}${Math.abs(balance - wallet).toLocaleString(interaction.locale)})`,
                    inline: true,
                  },
                ],
                color: colors[matchingCount < 3 ? "accent" : "error"],
              },
            ],
          });
        }).catch(reject);
      }).catch(reject);
    });
  }
}
