import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  type ApplicationCommandOptionChoiceData,
  type InteractionReplyOptions,
  type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";
import { getUser, subtractUserWallet, addUserInventory } from "../../../../addons/database/repository/GameRepo";
import { StringUtils } from "../../../../core/utils/utils";
import { colors } from "../../../../config";
import { items } from "../../../../core/cache";

export interface IScripts {
  no_item: string;
  cannot_buy: string;
  not_enough_money: (n: string) => string;
  bought: (item: string, amount: string, price: string) => string;
  item_each_price: (item: string, price: string) => string;
}

export default class extends SubCommand {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      no_item: "존재하지 않는 아이템이에요.",
      cannot_buy: "해당 아이템은 구매할 수 없어요.",
      not_enough_money: (n) => `${n} 원이 부족해요.`,
      bought: (item, amount, price) => `**${item}** **${amount}**개를 **${price}**에 구매했어요.`,
      item_each_price: (item, price) => `${item} (개당 ${price})`,
    },
    "en-US": {
      no_item: "The item does not exist.",
      cannot_buy: "You can't purchase this item.",
      not_enough_money: (n) => `You are short of ${n} won.`,
      bought: (item, amount, price) => `Purchased **${amount}** **${item}** for **${price}**.`,
      item_each_price: (item, price) => `${item} (${price} each)`,
    },
  };

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "buy",
      description: "Buy item from the shop.",
      nameLocalizations: {
        ko: "구매",
      },
      descriptionLocalizations: {
        ko: "상점에서 아이템을 구매합니다.",
      },
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "item",
          description: "Select the item to buy.",
          nameLocalizations: {
            ko: "아이템",
          },
          descriptionLocalizations: {
            ko: "구매할 아이템을 선택합니다.",
          },
          required: true,
          autocomplete: true,
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "amount",
          description: "Amount of item to buy",
          nameLocalizations: {
            ko: "개수",
          },
          descriptionLocalizations: {
            ko: "구매할 아이템의 개수",
          },
          required: true,
          minValue: 1,
        },
      ],
    });
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>((resolve, reject) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
      const itemId = interaction.options.getString("item", true);
      const item = items.get(itemId);

      if (!item) {
        return resolve({
          embeds: [{
            title: scripts.no_item,
            color: colors.error,
          }],
          flags: ["Ephemeral"],
        });
      }

      const buy = item.shop?.buy;

      if (!buy) {
        return resolve({
          embeds: [{
            title: scripts.cannot_buy,
            color: colors.error,
          }],
          flags: ["Ephemeral"],
        });
      }

      const amount = interaction.options.getInteger("amount", true);
      const price = amount * buy;

      getUser(interaction.user.id, "wallet").then((res) => {
        return res ?? 0;
      }).then((wallet) => {
        if (wallet < price) {
          return resolve({
            embeds: [{
              title: scripts.not_enough_money((price - wallet).toLocaleString(interaction.locale)),
              color: colors.error,
            }],
            flags: ["Ephemeral"],
          });
        }

        addUserInventory(interaction.user.id, itemId, amount).then(() => {
          subtractUserWallet(interaction.user.id, price).then(() => {
            resolve({
              embeds: [{
                description: scripts.bought(item.getName(interaction.locale), amount.toLocaleString(interaction.locale), price.toLocaleString(interaction.locale)),
                color: colors.accent,
              }],
              flags: ["Ephemeral"],
            });
          }).catch(reject);
        }).catch(reject);
      }).catch(reject);
    });
  }

  autocomplete(interaction: AutocompleteInteraction<"cached">) {
    return new Promise<ApplicationCommandOptionChoiceData[]>((resolve) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
      const search = (interaction.options.getString("item") ?? "").trim();

      const itemList = items.map((item) => {
        return {
          item: item, localedlName: item.getName(interaction.locale), similarity: Math.max(
            StringUtils.similarity(item.id, search),
            ...Object.values(item.nameLocalizations).map((name) => StringUtils.similarity(name, search)),
          ),
        };
      }).filter(({ item, similarity }) => {
        return item.shop?.buy && (!search || similarity > 0);
      });

      resolve(
        (!search
          ? itemList.sort((a, b) => {
            return a.localedlName.localeCompare(b.localedlName);
          })
          : itemList.sort((a, b) => {
            return b.similarity - a.similarity;
          })).slice(0, 25).map(({ localedlName, item }) => {
          return {
            name: scripts.item_each_price(localedlName, item.shop!.buy!.toLocaleString(interaction.locale)),
            value: item.id,
          };
        }),
      );
    });
  }
}
