import type { Client } from "discord.js";
import { Item } from "../item";

export default class BeetrootSeeds extends Item {
  constructor(client: Client) {
    super(client, {
      id: "beetroot_seeds",
      nameLocalizations: {
        "ko": "비트씨앗",
        "en-US": "Beetroot Seeds",
      },
      category: ["seeds"],
      shop: {
        buy: 1500,
      },
      farm: {
        sprite: "beetroot",
        time: 20 * 60 * 1000,
        harvest: { id: "beetroot", min: 2, max: 4 },
      },
    });
  }
}
