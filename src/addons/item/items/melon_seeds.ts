import type { Client } from "discord.js";
import { Item } from "../item";

export default class MelonSeeds extends Item {
    constructor(client: Client) {
        super(client, {
            id: "melon_seeds",
            nameLocalizations: {
                "ko": "수박씨앗",
                "en-US": "Melon Seeds"
            },
            category: ["seeds"],
            shop: {
                buy: 1000,
            },
            farm: {
                sprite: "melon",
                time: 30 * 60 * 1000,
                harvest: { id: "melon", min: 1, max: 1 },
            }
        });
    }
}