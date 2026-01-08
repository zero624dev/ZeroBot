import type { Client } from "discord.js";
import { Item } from "../item";

export default class Pumpkin extends Item {
    constructor(client: Client) {
        super(client, {
            id: "pumpkin",
            nameLocalizations: {
                "ko": "호박",
                "en-US": "Pumpkin"
            },
            category: ["crops"],
            shop: {
                sell: 4700,
            }
        });
    }
}