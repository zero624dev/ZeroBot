import fs from "fs";
import path from "path";
import { colors } from "../config";
import { StringUtils } from "./utils/utils";
import { Collection, type Client, type ApplicationCommandData } from "discord.js";
import type { Item } from "../addons/item/item";
import type { ClientEvent, Command, SubCommand } from "./types";
import { sendLog } from "./logger";
import util from "util";
import { commands, items } from "./cache";

export function loadEvents(client: Client) {
  const eventDir = path.join(import.meta.dir, "../events");

  fs.readdirSync(eventDir).forEach(async (evt) => {
    const E = await import(`${eventDir}/${evt}`);
    const event = new E.default(client) as ClientEvent<keyof import("discord.js").ClientEvents>;
    const eventName = evt.slice(0, -3);

    client[event.func](eventName, (...args) => {
      return event.run(...args as any).catch((err: any) => {
        if (err.handled) {
          console.error(err.handled, err.error);
          sendLog(client, {
            embeds: [{
              title: err.handled,
              description: `\`\`\`\n${StringUtils.ellipsis(err.error.toString(), 4000)}\n\`\`\``,
              color: colors.error,
            }],
          });
        } else {
          console.error(eventName, err);
          sendLog(client, {
            embeds: [{
              title: `Event Error - ${eventName}`,
              description: `\`\`\`\n${StringUtils.ellipsis(err.toString(), 4000)}\n\`\`\``,
              color: colors.error,
            }],
          });
        }
      });
    });
  });
}

export function loadCommands(client: Client) {
  const commandDir = path.join(import.meta.dir, "../commands");
  const subcommandDir = path.join(import.meta.dir, "../commands/subcommands");
  commands.clear();

  const commandData: Record<string, ApplicationCommandData[]> = {
    global: [],
  };

  fs.readdirSync(commandDir).filter((f) => {
    return f.endsWith(".ts");
  }).forEach((cmd) => {
    try {
      const command: Command = new (require(`${commandDir}/${cmd}`).default)(client);
      commands.set(command.data.name, command);
      if (command.data.type)
        if (command.options.guilds?.length) {
          command.options.guilds.forEach((guildId) => {
            if (!commandData[guildId]) {
              commandData[guildId] = [];
            }
            commandData[guildId].push(command.data);
          });
        } else {
          commandData["global"].push(command.data);
        }
    } catch (e) {
      console.error(`${commandDir}/${cmd}\n`, e);
      sendLog(client, {
        embeds: [{
          title: `Command Load Failed - ${cmd}`,
          description: `\`\`\`\n${StringUtils.ellipsis((e ?? "").toString(), 4000)}\n\`\`\``,
          color: colors.error,
        }],
      });
    }
  });

  fs.readdirSync(subcommandDir).forEach((commandName) => {
    fs.readdirSync(`${subcommandDir}/${commandName}`, { withFileTypes: true }).forEach((subcmd) => {
      if (subcmd.isDirectory()) {
        fs.readdirSync(`${subcommandDir}/${commandName}/${subcmd.name}`).forEach((file) => {
          try {
            const subcommandName = file.slice(0, -3);
            const command = commands.get(commandName);
            const subcommand: SubCommand = new (require(`${subcommandDir}/${commandName}/${subcmd.name}/${file}`).default)(command);

            if (!(command?.subcommands instanceof Collection)) {
              throw new Error(`${commandName}: Command do not have subcommands as properties.`);
            }

            subcommand.subcommandGroup = subcmd.name;
            command.subcommands.set(`${subcmd.name} ${subcommandName}`, subcommand);
            (command.data as any).options.find((o: any) => o.name == subcmd.name).options.push(subcommand.data);
          } catch (e) {
            console.error(`${subcommandDir}/${commandName}/${subcmd.name}\n`, e);
            sendLog(client, {
              embeds: [{
                title: `SubCommand Load Failed - ${commandName} ${subcmd.name} ${file}`,
                description: `\`\`\`\n${StringUtils.ellipsis((e ?? "").toString(), 4000)}\n\`\`\``,
                color: colors.error,
              }],
            });
          }
        });
      } else {
        try {
          const subcommandName = subcmd.name.slice(0, -3);
          const command = commands.get(commandName);
          const subcommand: SubCommand = new (require(`${subcommandDir}/${commandName}/${subcmd.name}`).default)(command);

          if (!(command?.subcommands instanceof Collection)) {
            throw new Error(`${commandName}: Command do not have subcommands as properties.`);
          }

          command.subcommands.set(subcommandName, subcommand);
          (command.data as any).options.push(subcommand.data);
        } catch (e) {
          console.error(`${subcommandDir}/${commandName}/${subcmd.name}\n`, e);
          sendLog(client, {
            embeds: [{
              title: `SubCommand Load Failed - ${commandName} ${subcmd.name}`,
              description: `\`\`\`\n${StringUtils.ellipsis((e ?? "").toString(), 4000)}\n\`\`\``,
              color: colors.error,
            }],
          });
        }
      }
    });
  });

  client.application?.commands.fetch().then((commands) => {
    Object.entries(commandData).forEach(([key, value]) => {
      if (key == "global") {
        client.application?.commands.set(value).then((uploads) => {
          const changed = [
            ...uploads.filter((upload) => {
              return !commands.has(upload.id);
            }).map((cmd) => {
              return `+ ${cmd.name}`;
            }),
            ...commands.filter((upload) => {
              return !uploads.has(upload.id);
            }).map((cmd) => {
              return `- ${cmd.name}`;
            }),
          ];
          if (changed.length) {
            sendLog(client, {
              embeds: [{
                title: "Auto-Uploaded",
                fields: [
                  {
                    name: "Global [Success]",
                    value: `\`\`\`diff\n${changed.join("\n")}\`\`\``,
                    inline: true,
                  },
                ],
                timestamp: new Date().toISOString(),
                color: colors.accent,
              }],
            });
          }
        }).catch((err) => {
          const index = Number(Object.keys(err.rawError.errors)[0]);
          sendLog(client, {
            embeds: [{
              title: "Auto-Uploaded",
              fields: [
                {
                  name: "Global [Failed]",
                  value: `\`\`\`fix\n${err.toString()}\n\n${util.inspect(commandData["global"][index], false, 10)}\`\`\``,
                  inline: true,
                },
              ],
              timestamp: new Date().toISOString(),
              color: colors.error,
            }],
          });
        });
      } else {
        client.application?.commands.set(value, key);
      }
    });
  });
}

export function loadItems(client: Client) {
  const itemDir = path.join(import.meta.dir, "../addons/item/items");

  fs.readdirSync(itemDir).forEach((item) => {
    try {
      const Item: Item = new (require(`${itemDir}/${item}`).default)(client);
      items.set(Item.id, Item);
    } catch (e) {
      console.error(`${itemDir}/${item}\n`, e);
      sendLog(client, {
        embeds: [{
          title: `Item Load Failed - ${item}`,
          description: `\`\`\`\n${StringUtils.ellipsis((e ?? "").toString(), 4000)}\n\`\`\``,
          color: colors.error,
        }],
      });
    }
  });
}
