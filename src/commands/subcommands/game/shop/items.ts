import {
  ComponentType,
  TextInputStyle,
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
  type Locale,
  type ModalSubmitInteraction,
  type ModalComponentData,
  type InteractionUpdateOptions,
  type StringSelectMenuInteraction,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";
import { getUser, subtractUserWallet, addUserInventory, hasUserInventory, setUser, addUserWallet } from "../../../../addons/database/repository/GameRepo";
import { colors } from "../../../../config";
import { items } from "../../../../core/cache";

export interface IScripts {
  shop: string;
}

export default class extends SubCommand {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      shop: "상점",
    },
    "en-US": {
      shop: "Shop",
    },
  };

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "items",
      description: "Shows the items in the shop.",
      nameLocalizations: {
        ko: "항목",
      },
      descriptionLocalizations: {
        ko: "상점에 있는 아이템을 보여줘요.",
      },
    });
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>((resolve) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

      resolve({
        embeds: [
          {
            title: scripts.shop,
            color: colors.accent,
          },
        ],
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.StringSelect,
                custom_id: `${interaction.user.id}|${interaction.commandName}|${interaction.options.getSubcommandGroup()} ${interaction.options.getSubcommand()}|category`,
                options: [
                  {
                    label: "농작물",
                    value: "crops",
                    emoji: { name: "🌾" },
                  },
                  {
                    label: "씨앗",
                    value: "seeds",
                    emoji: { name: "🌱" },
                  },
                ],
                placeholder: "카테고리를 선택해주세요.",
              },
            ],
          },
        ],
      });
    });
  }

  stringSelect(interaction: StringSelectMenuInteraction, args: string[]) {
    return new Promise<InteractionUpdateOptions>((resolve, reject) => {
      if (args[0] === "category") {
        const category = interaction.values[0];
        const filteredItems = items.filter((item) => {
          return item.category.includes(category as any) && item.shop;
        });
        const refCmd = interaction.customId.split("|").slice(1, 3).join("|");
        resolve({
          components: [
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.StringSelect,
                  custom_id: `${interaction.user.id}|${refCmd}|category`,
                  options: [
                    {
                      label: "농작물",
                      value: "crops",
                      description: "농작물을 판매할 수 있습니다.",
                      emoji: { name: "🌾" },
                    },
                    {
                      label: "씨앗",
                      value: "seeds",
                      description: "씨앗을 구매할 수 있습니다.",
                      emoji: { name: "🌱" },
                    },
                  ].map((option) => {
                    return { ...option, default: option.value === category };
                  }),
                  placeholder: "카테고리를 선택해주세요.",
                },
              ],
            },
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.StringSelect,
                  custom_id: `${interaction.user.id}|${refCmd}|item`,
                  options: filteredItems.map((item) => {
                    const { sell, buy } = item.shop ?? {};
                    return {
                      label: item.getName(interaction.locale),
                      value: item.id,
                      description: `판매가: ${sell?.toLocaleString() ?? "X"} 원 / 구매가: ${buy?.toLocaleString() ?? "X"} 원`,
                    };
                  }),
                  placeholder: "아이템을 선택해주세요.",
                },
              ],
            },
          ],
        });
      } else if (args[0] === "item") {
        const item = interaction.values[0];
        const itemInfo = items.get(item);

        if (!itemInfo) {
          return reject(`items["${item}"] is not defined`);
        }

        const components: ModalComponentData["components"][number][] = [];

        if (itemInfo.shop?.sell) {
          components.push(
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.TextInput,
                  customId: "sell",
                  label: "판매 개수",
                  placeholder: `개당 ${itemInfo.shop.sell.toLocaleString()} 원`,
                  style: TextInputStyle.Short,
                  minLength: 1,
                  maxLength: 16,
                  required: false,
                },
              ],
            },
          );
        }

        if (itemInfo.shop?.buy) {
          components.push(
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.TextInput,
                  customId: "buy",
                  label: "구매 개수",
                  placeholder: `개당 ${itemInfo.shop.buy.toLocaleString()} 원`,
                  style: TextInputStyle.Short,
                  minLength: 1,
                  maxLength: 16,
                  required: false,
                },
              ],
            },
          );
        }

        interaction.showModal({
          title: `${itemInfo.getName(interaction.locale)}`, components: components, customId: `${interaction.user.id}|${interaction.customId.split("|").slice(1, 3).join("|")}|trade|${item}`,
        }).catch(reject);
      }
    });
  }

  modalSubmit(interaction: ModalSubmitInteraction<"cached">, args: string[]) {
    return new Promise<InteractionReplyOptions>((resolve, reject) => {
      if (args[0] === "trade") {
        const item = args[1];
        const itemInfo = items.get(item);

        if (!itemInfo) {
          return reject(`items["${item}"] is not defined`);
        }

        const sell = interaction.fields.fields.has("sell") ? parseInt(interaction.fields.getTextInputValue("sell"), 10) || 0 : 0;
        const buy = interaction.fields.fields.has("buy") ? parseInt(interaction.fields.getTextInputValue("buy"), 10) || 0 : 0;

        let text = "";

        getUser(interaction.user.id, "wallet").then((res) => {
          return res ?? 0;
        }).then(async (wallet) => {
          if (sell != 0) {
            if (sell < 0) {
              text += "판매 개수는 0보다 작을 수 없어요.\n";
            } else {
              const itemCount = await hasUserInventory(interaction.user.id, item).catch(reject);

              if (!itemCount) {
                text += "해당 아이템을 가지고 있지 않아요.\n";
              } else {
                const resultCount = Math.max(itemCount - sell, 0);

                const filter = resultCount ? { "_id": interaction.user.id, "inventory.id": item } : { _id: interaction.user.id };
                const data = resultCount ? { $set: { "inventory.$.count": resultCount } } : { $pull: { inventory: { id: item } } };
                await setUser(filter, data).catch(reject);

                const count = Math.min(itemCount, sell);

                if (!itemInfo.shop?.sell) {
                  return reject(`items["${item}"].shop.sell is not defined`);
                }

                const price = count * itemInfo.shop?.sell;

                await addUserWallet(interaction.user.id, price).catch(reject);

                text += `${item} ${count}개를 ${price.toLocaleString()} 원에 판매했어요. (소지금: ${(wallet += price).toLocaleString()} 원)\n`;
              }
            }
          }

          if (buy != 0) {
            if (!itemInfo.shop?.buy) {
              return reject(`items["${item}"].shop.buy is not defined`);
            }

            const price = buy * itemInfo.shop?.buy;

            if (buy < 0) {
              text += "구매 개수는 0보다 작을 수 없어요.\n";
            } else if (wallet < price) {
              text += `${(price - wallet).toLocaleString()} 원이 부족해요. (소지금: ${wallet.toLocaleString()} 원)\n`;
            } else {
              await addUserInventory(interaction.user.id, item, buy).catch(reject);
              await subtractUserWallet(interaction.user.id, price).catch(reject);

              text += `${item} ${buy.toLocaleString()}개를 ${price.toLocaleString()} 원에 구매했어요. (소지금: ${(wallet - price).toLocaleString()} 원)\n`;
            }
          }

          resolve({ content: text || "아무 일도 일어나지 않았어요.", flags: ["Ephemeral"] });
        }).catch(reject);
      }
    });
  }
}
