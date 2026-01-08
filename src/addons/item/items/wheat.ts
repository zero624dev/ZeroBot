import type { Client } from "discord.js";
import { Item } from "../item";

export default class Wheat extends Item {
    constructor(client: Client) {
        super(client, {
            id: "wheat",
            nameLocalizations: {
                "ko": "밀",
                "en-US": "Wheat"
            },
            category: ["crops"],
            shop: {
                sell: 2050,
            }
        });
    }
}