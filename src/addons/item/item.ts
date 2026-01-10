import type { Locale, Client } from "discord.js";

type ItemCategory = "crops" | "seeds";

interface ItemOptions {
  id: string;
  nameLocalizations: Partial<Record<Locale, string>>;
  category: ItemCategory[];
  shop?: {
    buy?: number;
    sell?: number;
  };
  farm?: {
    sprite: string;
    time: number;
    harvest: { id: string; min: number; max: number };
  };
}

export class Item {
  client: Client;
  id: ItemOptions["id"];
  nameLocalizations: ItemOptions["nameLocalizations"];
  category: ItemOptions["category"];
  shop: ItemOptions["shop"];
  farm: ItemOptions["farm"];

  constructor(client: Client, options: ItemOptions) {
    this.client = client;
    this.id = options.id;
    this.nameLocalizations = options.nameLocalizations;
    this.category = options.category;
    this.shop = options.shop;
    this.farm = options.farm;
  }

  getName(locale: Locale): string {
    return this.nameLocalizations[locale] ?? this.nameLocalizations["en-US"]!;
  }
}
