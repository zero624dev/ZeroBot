import {
    ChatInputCommandInteraction,
    ApplicationCommandOptionType,
    type InteractionReplyOptions,
    type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";
import { getUser, setUser, addUserInventory } from "../../../../addons/database/repository/GameRepo";
import { colors } from "../../../../config";
import { items } from "../../../../core/cache";

export interface IScripts {
    no_land: string;
    no_harvest: string;
}

export default class PetPet extends SubCommand {
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            no_land: "가지고 있는 땅이 없어요.",
            no_harvest: "수확할 작물이 없어요."
        },
        "en-US": {
            no_land: "You don't have any land.",
            no_harvest: "There's no crop to harvest."
        }
    };

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "harvest",
            description: "Harvest the fully grown crops in your farm.",
            nameLocalizations: {
                ko: "수확"
            },
            descriptionLocalizations: {
                ko: "농장에 다 자란 작물을 수확해요."
            }
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

            getUser(interaction.user.id, "farm").then((farm) => {
                if (!farm) {
                    return resolve({
                        embeds: [{
                            title: scripts.no_land,
                            color: colors.error
                        }], flags: ["Ephemeral"]
                    });
                }

                const harvests: { [key: string]: number } = {};

                for (let i = 0; i < farm.length; i++) {
                    if (farm[i].crop != "none") {
                        const cropInfo = items.get(farm[i].crop)?.farm;
                        if (!cropInfo) {
                            return reject(`${farm[i].crop}: crop info not found`);
                        }
                        if (Date.now() - farm[i].plantedAt >= cropInfo.time) {
                            if (!harvests[cropInfo.harvest.id]) {
                                harvests[cropInfo.harvest.id] = 0;
                            }
                            harvests[cropInfo.harvest.id] += Math.floor(Math.random() * (cropInfo.harvest.max - cropInfo.harvest.min + 1)) + cropInfo.harvest.min;
                            farm[i] = { crop: "none", plantedAt: 0 };
                        }
                    }
                }

                const harvestCrops = Object.keys(harvests);
                const cropText = farm.filter((slot) => {
                    return slot.crop != "none";
                }).reduce((acc: { crop: string, time: number, count: number }[], cur) => {
                    if (!acc[0] || acc[acc.length - 1].crop != cur.crop) {
                        acc.push({ crop: cur.crop, time: cur.plantedAt + (items.get(cur.crop)?.farm?.time ?? 0), count: 1 });
                    } else {
                        const time = cur.plantedAt + (items.get(cur.crop)?.farm?.time ?? 0);
                        if (Math.abs(acc[acc.length - 1].time - time) < 1000) {
                            acc[acc.length - 1].count++;
                        } else {
                            acc.push({ crop: cur.crop, time: time, count: 1 });
                        }
                    }
                    return acc;
                }, []).map((slot: { crop: string, time: number, count: number }) => {
                    return `> ${items.get(slot.crop)?.getName(interaction.locale)}(x${slot.count}) <t:${Math.floor(slot.time / 1000)}:R>`;
                }).join("\n");

                if (!harvestCrops.length) {
                    return resolve({
                        embeds: [{
                            title: scripts.no_harvest,
                            description: cropText,
                            color: colors.error
                        }], flags: ["Ephemeral"]
                    });
                }

                harvestCrops.forEach((crop) => {
                    addUserInventory(interaction.user.id, crop, harvests[crop], true).then(() => { }).catch(reject);
                });

                setUser(interaction.user.id, { farm: farm }).then(() => {
                    resolve({
                        embeds: [{
                            description: `${harvestCrops.map((crop) => {
                                return `**${items.get(crop)?.getName(interaction.locale)}**: **${harvests[crop].toLocaleString(interaction.locale)}**`;
                            }).join("\n")}\n${cropText}`,
                            color: colors.accent
                        }],
                        flags: ["Ephemeral"]
                    });
                }).catch(reject);
            }).catch(reject);
        });
    }
}