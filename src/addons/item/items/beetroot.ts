import type { Client } from "discord.js";
import { Item } from "../item";

export default class Beetroot extends Item {
  constructor(client: Client) {
    super(client, {
      id: "beetroot",
      nameLocalizations: {
        "ko": "비트",
        "en-US": "Beetroot",
      },
      category: ["crops"],
      shop: {
        sell: 1350,
      },
    });
  }
}
