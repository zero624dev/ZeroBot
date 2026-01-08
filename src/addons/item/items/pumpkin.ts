import type { Client } from "discord.js";
import { Item } from "../item";

export default class PumpkinSeeds extends Item {
    constructor(client: Client) {
        super(client, {
            id: "pumpkin_seeds",
            nameLocalizations: {
                "ko": "호박씨앗",
                "en-US": "Pumpkin Seeds"
            },
            category: ["seeds"],
            shop: {
                buy: 1000,
            },
            farm: {
                sprite: "pumpkin",
                time: 30 * 60 * 1000,
                harvest: { id: "pumpkin", min: 1, max: 1 },
            }
        });
    }
}