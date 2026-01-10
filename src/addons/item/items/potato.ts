import type { Client } from "discord.js";
import { Item } from "../item";

export default class Potato extends Item {
  constructor(client: Client) {
    super(client, {
      id: "potato",
      nameLocalizations: {
        "ko": "감자",
        "en-US": "Potato",
      },
      category: ["crops", "seeds"],
      shop: {
        sell: 970,
        buy: 1000,
      },
      farm: {
        sprite: "potato",
        time: 15 * 60 * 1000,
        harvest: { id: "potato", min: 2, max: 4 },
      },
    });
  }
}
