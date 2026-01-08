import type { Client } from "discord.js";
import { Item } from "../item";

export default class WheatSeeds extends Item {
    constructor(client: Client) {
        super(client, {
            id: "wheat_seeds",
            nameLocalizations: {
                "ko": "밀씨앗",
                "en-US": "Wheat Seeds"
            },
            category: ["seeds"],
            shop: {
                buy: 100,
            },
            farm: {
                sprite: "wheat",
                time: 15 * 60 * 1000,
                harvest: { id: "wheat", min: 1, max: 1 },
            }
        });
    }
}