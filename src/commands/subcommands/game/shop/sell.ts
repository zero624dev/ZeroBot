import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  type ApplicationCommandOptionChoiceData,
  type InteractionReplyOptions,
  type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";
import { getUser, subtractUserInventory, addUserWallet } from "../../../../addons/database/repository/GameRepo";
import { StringUtils } from "../../../../core/utils/utils";
import { colors } from "../../../../config";
import { items } from "../../../../core/cache";

export interface IScripts {
  no_item: string;
  cannot_sell: string;
  not_have_item: string;
  sold: (item: string, amount: string, price: string) => string;
  item_n_each_price: (item: string, count: string, price: string) => string;
}

export default class extends SubCommand {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      no_item: "존재하지 않는 아이템이에요.",
      cannot_sell: "해당 아이템은 판매할 수 없어요.",
      not_have_item: "해당 아이템을 가지고 있지 않아요.",
      sold: (item, amount, price) => `**${item}** **${amount}개**를 **${price}**에 판매했어요.`,
      item_n_each_price: (item, count, price) => `${item} x${count} (개당 ${price})`,
    },
    "en-US": {
      no_item: "The item does not exist.",
      cannot_sell: "You can't sell this item.",
      not_have_item: "You don't have the item.",
      sold: (item, amount, price) => `Sold **${amount}** **${item}** for **${price}**.`,
      item_n_each_price: (item, count, price) => `${item} x${count} (${price} each)`,
    },
  };

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "sell",
      description: "Sell item to the shop.",
      nameLocalizations: {
        ko: "판매",
      },
      descriptionLocalizations: {
        ko: "상점에서 아이템을 판매합니다.",
      },
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "item",
          description: "Select the item to sell.",
          nameLocalizations: {
            ko: "아이템",
          },
          descriptionLocalizations: {
            ko: "판매할 아이템을 선택합니다.",
          },
          required: true,
          autocomplete: true,
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "amount",
          description: "Amount of item to sell",
          nameLocalizations: {
            ko: "개수",
          },
          descriptionLocalizations: {
            ko: "판매할 아이템의 개수",
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
          }], flags: ["Ephemeral"],
        });
      }

      const sell = item.shop?.sell;

      if (!sell) {
        return resolve({
          embeds: [{
            title: scripts.cannot_sell,
            color: colors.error,
          }], flags: ["Ephemeral"],
        });
      }

      const amount = interaction.options.getInteger("amount", true);

      subtractUserInventory(interaction.user.id, itemId, amount).then((subtractAmount) => {
        if (!subtractAmount) {
          return resolve({
            embeds: [{
              title: scripts.not_have_item,
              color: colors.error,
            }], flags: ["Ephemeral"],
          });
        }

        const price = subtractAmount * sell;

        addUserWallet(interaction.user.id, price).then(() => {
          resolve({ content: scripts.sold(item.getName(interaction.locale), subtractAmount.toLocaleString(interaction.locale), price.toLocaleString(interaction.locale)), flags: ["Ephemeral"] });
        }).catch(reject);
      }).catch(reject);
    });
  }

  autocomplete(interaction: AutocompleteInteraction<"cached">) {
    return new Promise<ApplicationCommandOptionChoiceData[]>((resolve, reject) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
      const search = (interaction.options.getString("item") ?? "").trim();

      getUser(interaction.user.id, "inventory").then((res) => res ?? []).then((inventory) => {
        const itemList = inventory.map(({ count, id }) => {
          const item = items.get(id)!;
          return {
            itemCount: count, item: item, localedlName: item?.getName(interaction.locale) ?? id, similarity: Math.max(
              StringUtils.similarity(id, search),
              ...Object.values(item?.nameLocalizations ?? {}).map((name) => StringUtils.similarity(name, search)),
            ),
          };
        }).filter(({ item, similarity }) => {
          return item?.shop?.sell && (!search || similarity > 0);
        });

        resolve(
          (!search
            ? itemList.sort((a, b) => {
              return a.localedlName.localeCompare(b.localedlName);
            })
            : itemList.sort((a, b) => {
              return b.similarity - a.similarity;
            })).slice(0, 25).map(({ localedlName, itemCount, item }) => {
            return {
              name: scripts.item_n_each_price(localedlName, itemCount.toLocaleString(interaction.locale), item.shop!.sell!.toLocaleString(interaction.locale)),
              value: item.id,
            };
          }),
        );
      }).catch(reject);
    });
  }
}
