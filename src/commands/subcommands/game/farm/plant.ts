import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    ApplicationCommandOptionType,
    type ApplicationCommandOptionChoiceData,
    type InteractionReplyOptions,
    type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";
import { getUser, setUser, hasUserInventory } from "../../../../addons/database/repository/GameRepo";
import { colors } from "../../../../config";
import { items } from "../../../../core/cache";

export interface IScripts {
    not_have_any_seeds: string;
    not_have_seeds: (seeds: string) => string;
    not_seed: string;
    planted_n_crops: (crop: string, count: number) => string;
}

export default class PetPet extends SubCommand {
    seeds: string[];
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            not_have_any_seeds: "가지고 있는 씨앗이 없어요.",
            not_have_seeds: (seeds) => `**${seeds}**을(를) 가지고 있지 않아요.`,
            not_seed: "씨앗이 아니에요.",
            planted_n_crops: (crop, count) => `**${crop}**을 **${count}**개 심었어요.`
        },
        "en-US": {
            not_have_any_seeds: "You don't have any seeds.",
            not_have_seeds: (seeds) => `You don't have **${seeds}**.`,
            not_seed: "It's not a seed.",
            planted_n_crops: (crop, count) => `Planted **${count}** **${crop}**.`
        }
    };

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "plant",
            description: "Plant a seed in the farm.",
            nameLocalizations: {
                ko: "심기"
            },
            descriptionLocalizations: {
                ko: "농장에 씨앗을 심어요."
            },
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "crop",
                    description: "The crop to plant.",
                    nameLocalizations: {
                        ko: "작물"
                    },
                    descriptionLocalizations: {
                        ko: "심을 작물"
                    },
                    autocomplete: true,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "amount",
                    description: "The amount of seeds to plant.",
                    nameLocalizations: {
                        ko: "수량"
                    },
                    descriptionLocalizations: {
                        ko: "심을 씨앗의 수량"
                    },
                    minValue: 1,
                    required: true
                }
            ]
        });

        this.seeds = Array.from(items.values()).filter((item) => {
            return item.category.includes("seeds");
        }).map(({ id }) => {
            return id;
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
            const crop = interaction.options.getString("crop", true);
            const item = items.get(crop);

            if (crop == "none") {
                return resolve({
                    embeds: [{
                        title: scripts.not_have_any_seeds,
                        color: colors.error
                    }],
                    flags: ["Ephemeral"]
                });
            }

            if (!item?.category.includes("seeds")) {
                return resolve({
                    embeds: [{
                        title: scripts.not_seed,
                        color: colors.error
                    }],
                    flags: ["Ephemeral"]
                });
            }

            hasUserInventory(interaction.user.id, crop).then((hasCount) => {
                if (!hasCount) {
                    return resolve({
                        embeds: [{
                            title: scripts.not_have_seeds(item.getName(interaction.locale)),
                            color: colors.error
                        }],
                        flags: ["Ephemeral"]
                    });
                }

                getUser(interaction.user.id, "farm").then((res) => {
                    return res ?? [];
                }).then((farm) => {
                    const count = Math.min(interaction.options.getInteger("amount") ?? 1, hasCount);
                    const plantedAt = Date.now();
                    let plantedCount = 0;

                    for (let i = 0; i < farm.length; i++) {
                        if (plantedCount == count) {
                            break;
                        }
                        if (farm[i].crop == "none") {
                            farm[i] = { crop: crop, plantedAt: plantedAt };
                            plantedCount++;
                        }
                    }

                    hasCount -= plantedCount;

                    const filter = hasCount ? { "_id": interaction.user.id, "inventory.id": crop } : { _id: interaction.user.id };
                    const data = hasCount ? { "inventory.$.count": hasCount } : { $pull: { inventory: { id: crop } } };
                    setUser(filter, { ...data, farm: farm }).then(() => {
                        resolve({
                            embeds: [{
                                description: scripts.planted_n_crops(item.getName(interaction.locale), plantedCount),
                                color: colors.accent
                            }], flags: ["Ephemeral"]
                        });
                    }).catch(reject);
                });
            });

        });
    }

    autocomplete(interaction: AutocompleteInteraction<"cached">) {
        return new Promise<ApplicationCommandOptionChoiceData[]>((resolve, reject) => {
            getUser(interaction.user.id, "inventory").then((res) => {
                return res ?? [];
            }).then((inventory) => {
                resolve(inventory.filter((item) => {
                    return this.seeds.includes(item.id);
                }).map((item) => {
                    return { name: `${items.get(item.id)?.getName(interaction.locale)} (${item.count})`, value: item.id };
                }));
            }).catch(reject);
        });
    }
}