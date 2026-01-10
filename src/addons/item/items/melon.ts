import type { Client } from "discord.js";
import { Item } from "../item";

export default class Melon extends Item {
  constructor(client: Client) {
    super(client, {
      id: "melon",
      nameLocalizations: {
        "ko": "수박",
        "en-US": "Melon",
      },
      category: ["crops"],
      shop: {
        sell: 4700,
      },
    });
  }
}
