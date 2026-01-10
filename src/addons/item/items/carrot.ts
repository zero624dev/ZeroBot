import type { Client } from "discord.js";
import { Item } from "../item";

export default class Carrot extends Item {
  constructor(client: Client) {
    super(client, {
      id: "carrot",
      nameLocalizations: {
        "ko": "당근",
        "en-US": "Carrot",
      },
      category: ["crops", "seeds"],
      shop: {
        sell: 970,
        buy: 1000,
      },
      farm: {
        sprite: "carrot",
        time: 15 * 60 * 1000,
        harvest: { id: "carrot", min: 2, max: 4 },
      },
    });
  }
}
