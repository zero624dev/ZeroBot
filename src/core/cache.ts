import { Collection } from "discord.js";
import type { Item } from "../addons/item/item";
import type { Command, ISnipeMessage } from "./types";

const commands = new Collection<string, Command>();
const items = new Collection<string, Item>();
const snipe = new Collection<string, ISnipeMessage[]>();
const editsnipe = new Collection<string, ISnipeMessage[]>();

export { commands, items, snipe, editsnipe };
