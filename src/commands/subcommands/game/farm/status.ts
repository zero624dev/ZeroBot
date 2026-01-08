import {
    Collection,
    ChatInputCommandInteraction,
    ApplicationCommandOptionType,
    type InteractionReplyOptions,
    type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { getUser } from "../../../../addons/database/repository/GameRepo";
import { colors } from "../../../../config";
import { items } from "../../../../core/cache";
import { mentionCommand } from "../../../../core/utils/utils";

export interface IScripts {
    user_farm: (username: string) => string;
    no_land: string;
    expand_land_with_command: (command: string) => string;
}

export default class PetPet extends SubCommand {
    sprites: Collection<string, Buffer> = new Collection();
    scripts: { [key in Locale]?: IScripts } = {
        "ko": {
            user_farm: (username: string) => `${username}님의 농장`,
            no_land: "가지고 있는 땅이 없어요.",
            expand_land_with_command: (command: string) => `${command}로 농장을 확장할 수 있어요.`
        },
        "en-US": {
            user_farm: (username: string) => `${username}'s Farm`,
            no_land: "You don't have any land.",
            expand_land_with_command: (command: string) => `You can expand your farm with ${command}.`
        }
    };

    constructor(parent: Command) {
        super(parent, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "status",
            description: "Shows the current status of a farm",
            nameLocalizations: {
                ko: "상태"
            },
            descriptionLocalizations: {
                ko: "현재 농장의 상태를 보여줘요."
            }
        }, {
            cooldown: 1000 * 5
        });

        const spriteDir = path.join(import.meta.dir, "../../../../media/sprites/farm");
        fs.readdirSync(spriteDir, { withFileTypes: true }).forEach((spr) => {
            if (spr.isDirectory()) {
                fs.readdirSync(`${spriteDir}/${spr.name}`).forEach((file) => {
                    sharp(`${spriteDir}/${spr.name}/${file}`).resize({
                        width: 50,
                        height: 50,
                    }).toBuffer().then((buf) => {
                        this.sprites.set(`${spr.name}${file.split(".")[0]}`, buf);
                    });
                });
            } else {
                sharp(`${spriteDir}/${spr.name}`).resize({
                    width: 50,
                    height: 50,
                }).toBuffer().then((buf) => {
                    this.sprites.set(spr.name.split(".")[0], buf);
                });
            }
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

            getUser(interaction.user.id, "farm").then((res) => {
                return res ?? [];
            }).then((farm) => {
                let size = 250;
                if (farm.length > 48) {
                    size = 400;
                } else if (farm.length > 24) {
                    size = 350;
                }

                const farmland = this.sprites.get("farmland");
                if (!farmland) {
                    return reject("farmland sprite not found");
                }

                const water = this.sprites.get("water");
                if (!water) {
                    return reject("water sprite not found");
                }

                const farm2d = this.farm2d(farm);

                const composite: sharp.OverlayOptions[] = [];

                for (let i = 0; i < farm2d.length; i++) {
                    for (let j = 0; j <= i; j++) {
                        const row = i - j, col = j;
                        const x = j - i / 2, y = i - farm2d.length + 1;
                        const land = farm2d[row][col];
                        if (land) {
                            composite.push({
                                input: farmland,
                                left: size / 2 - 25 + x * 44,
                                top: size / 2 - 25 + y * 11
                            });
                            if (land.crop != "none") {
                                const cropInfo = items.get(land.crop)?.farm;
                                if (!cropInfo) {
                                    return reject(`${land.crop}: crop info not found`);
                                }
                                const per = Math.floor(Math.min((Date.now() - land.plantedAt) / cropInfo.time, 1) / 0.142);
                                const sprite = this.sprites.get(`${cropInfo.sprite}${per}`);
                                if (!sprite) {
                                    return reject(`${cropInfo.sprite}${per}: sprite not found`);
                                }
                                composite.push({
                                    input: sprite,
                                    left: size / 2 - 25 + x * 44,
                                    top: size / 2 - 25 + y * 11 - 27
                                });
                            }
                        } else if (land == 0) {
                            composite.push({
                                input: water,
                                left: size / 2 - 25 + x * 44,
                                top: size / 2 - 25 + y * 11
                            });
                        }
                    }
                }
                for (let i = farm2d.length - 1; i > 0; i--) {
                    for (let j = 0; j < i; j++) {
                        const row = farm2d.length - 1 - j, col = farm2d.length - i + j;
                        const x = j + 0.5 - i / 2, y = farm2d.length - i;
                        const land = farm2d[row][col];
                        if (land) {
                            composite.push({
                                input: farmland,
                                left: size / 2 - 25 + x * 44,
                                top: size / 2 - 25 + y * 11
                            });
                            if (land.crop != "none") {
                                const cropInfo = items.get(land.crop)?.farm;
                                if (!cropInfo) {
                                    return reject(`${land.crop}: crop info not found`);
                                }
                                const per = Math.floor(Math.min((Date.now() - land.plantedAt) / cropInfo.time, 1) / 0.142);
                                const sprite = this.sprites.get(`${cropInfo.sprite}${per}`);
                                if (!sprite) {
                                    return reject(`${cropInfo.sprite}${per}: sprite not found`);
                                }
                                composite.push({
                                    input: sprite,
                                    left: size / 2 - 25 + x * 44,
                                    top: size / 2 - 25 + y * 11 - 27
                                });
                            }
                        } else if (land == 0) {
                            composite.push({
                                input: water,
                                left: size / 2 - 25 + x * 44,
                                top: size / 2 - 25 + y * 11
                            });
                        }
                    }
                }

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
                    return `${items.get(slot.crop)?.getName(interaction.locale)}(x${slot.count}) <t:${Math.floor(slot.time / 1000)}:R>`;
                }).join("\n");

                sharp({
                    create: {
                        width: size,
                        height: size,
                        channels: 4,
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    }
                }).composite(composite).png().toBuffer().then((img) => {
                    resolve({
                        embeds: [
                            {
                                title: scripts.user_farm(interaction.user.tag),
                                description: farm[0] ? cropText : `${scripts.no_land}\n${scripts.expand_land_with_command(mentionCommand(this.client, "game", "farm", "expand"))}`,
                                image: { url: "attachment://farm.png" },
                                color: colors.accent
                            }
                        ],
                        files: [{
                            attachment: img,
                            name: "farm.png"
                        }]
                    });
                }).catch(reject);
            }).catch(reject);
        });
    }

    private farm2d(farm: { crop: string, plantedAt: number }[]) {
        const level = Math.ceil(farm.length / 8);
        const size = 1 + level * 2;
        const farm2d = Array.from({ length: size }, () => {
            return Array(size).fill(0);
        });

        let row = Math.floor(size / 2) - 1;
        let col = Math.floor(size / 2) - 1;

        let move = 0;
        let circle = 1;
        let direction = -1;

        for (let i = 0; i < size * size - 1; i++) {
            farm2d[row][col] = farm[i];

            if (move++ % (2 * circle) === 0) {
                direction++;
            }

            if (direction == 0) {
                col += 1;
            } else if (direction == 1) {
                row += 1;
            } else if (direction == 2) {
                col -= 1;
            } else if (direction == 3) {
                row -= 1;
                if (move == 8 * circle) {
                    move = 0;
                    circle++;
                    direction = -1;
                    col -= 1;
                    row -= 1;
                }
            }
        }

        return farm2d;
    }
}