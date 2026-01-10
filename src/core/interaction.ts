import type {
  UserContextMenuCommandInteraction,
  ChatInputCommandInteraction,
  RepliableInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  AnySelectMenuInteraction,
  MessageContextMenuCommandInteraction,
  InteractionReplyOptions,
  InteractionEditReplyOptions,
  Locale,
  AutocompleteInteraction,
  Interaction,
} from "discord.js";
import type { SubCommand, Command } from "../core/types";
import type { IScripts } from "../events/interactionCreate";
import { commands } from "../core/cache";
import { colors } from "../config";
import { mentionCommand } from "../core/utils/utils";
import { existsUser } from "../addons/database/repository/UserRepo";

type TScripts = Partial<Record<Locale, IScripts>>;

export function chatInput(interaction: ChatInputCommandInteraction<"cached">, scripts: TScripts) {
  return new Promise(async (_, reject) => {
    const command = commands.get(interaction.commandName)!;
    let subcommand: SubCommand | undefined = undefined;

    const commandFullName = [
      interaction.commandName,
      interaction.options.getSubcommandGroup(false),
      interaction.options.getSubcommand(false),
    ].filter((f) => f).join(" ").trim();

    if (command.subcommands) {
      const subcommandGroup = interaction.options.getSubcommandGroup(false);
      const subcommandName = interaction.options.getSubcommand(false) ?? "";
      subcommand = command.subcommands.get(subcommandGroup ? `${subcommandGroup} ${subcommandName}` : subcommandName);
      if (!subcommand) {
        return reject({
          handled: `Subcommand Error - ${commandFullName}`,
          error: "Subcommand not found.",
        });
      }
    }

    checkCommandExecutable(interaction, scripts, command, subcommand).then((res) => {
      if (res) {
        (subcommand ?? command).chatInput?.(interaction).then((res) => {
          if (interaction.replied || interaction.deferred) {
            interaction.editReply(res as InteractionEditReplyOptions).catch((err) => {
              reject({
                handled: `Command Edit Reply Error - ${commandFullName}`,
                error: err,
              });
            });
          } else {
            interaction.reply(res as InteractionReplyOptions).catch((err) => {
              reject({
                handled: `Command Reply Error - ${commandFullName}`,
                error: err,
              });
            });
          }
        }).catch((err) => {
          reject({
            handled: `Command Execution Error - ${commandFullName}`,
            error: err,
          });
        });
      }
    }).catch(reject);
  });
}

export function messageContextMenu(interaction: MessageContextMenuCommandInteraction<"cached">, scripts: TScripts) {
  return new Promise<void>((_, reject) => {
    const command = commands.get(interaction.commandName)!;

    checkCommandExecutable(interaction, scripts, command).then((res) => {
      if (res) {
        command.messageContextMenu?.(interaction).then((res) => {
          if (interaction.replied || interaction.deferred) {
            interaction.editReply(res as InteractionEditReplyOptions).catch((err) => {
              reject({
                handled: `MessageContextMenu Edit Reply Error - ${interaction.commandName}`,
                error: err,
              });
            });
          } else {
            interaction.reply(res as InteractionReplyOptions).catch((err) => {
              reject({
                handled: `MessageContextMenu Reply Error - ${interaction.commandName}`,
                error: err,
              });
            });
          }
        }).catch((err) => {
          reject({
            handled: `MessageContextMenu Execution Error - ${interaction.commandName}`,
            error: err,
          });
        });
      }
    }).catch(reject);
  });
}

export function userContextMenu(interaction: UserContextMenuCommandInteraction<"cached">, scripts: TScripts) {
  return new Promise<void>((_, reject) => {
    const command = commands.get(interaction.commandName)!;

    checkCommandExecutable(interaction, scripts, command).then((res) => {
      if (res) {
        command.userContextMenu?.(interaction).then((res) => {
          if (interaction.replied || interaction.deferred) {
            interaction.editReply(res as InteractionEditReplyOptions).catch((err) => {
              reject({
                handled: `UserContextMenu Edit Reply Error - ${interaction.commandName}`,
                error: err,
              });
            });
          } else {
            interaction.reply(res as InteractionReplyOptions).catch((err) => {
              reject({
                handled: `UserContextMenu Reply Error - ${interaction.commandName}`,
                error: err,
              });
            });
          }
        }).catch((err) => {
          reject({
            handled: `UserContextMenu Execution Error - ${interaction.commandName}`,
            error: err,
          });
        });
      }
    }).catch(reject);
  });
}

export function hasCustomId(interaction: ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction, scripts: Partial<Record<Locale, IScripts>>) {
  return new Promise<void>(async (_, reject) => {
    const script = scripts[interaction.locale] ?? scripts["en-US"]!;
    let [id, commandName, ...args] = interaction.customId.split("|");
    const command = commands.get(commandName)!;
    let subcommand: SubCommand | undefined = undefined;

    if (!command) {
      interaction.reply({
        embeds: [{
          title: script.command_not_found,
          color: colors.error,
        }],
        ephemeral: true,
      }).catch(reject);
    }

    if (command.subcommands) {
      const subcommandName = args.shift()!;
      commandName += ` ${subcommandName}`;
      subcommand = command.subcommands.get(subcommandName);
      if (!subcommand) {
        return reject({
          handled: `Subcommand Error - ${commandName}`,
          error: `${subcommandName}: Subcommand not found.`,
        });
      }
    }

    if (id !== interaction.user.id && id !== "all" && id !== "") {
      return interaction.reply({
        embeds: [{
          title: script.other_interaction,
          color: colors.error,
        }],
        ephemeral: true,
      }).catch(reject);
    }
    if ((subcommand?.options?.registrationRequired && !(await existsUser(interaction.user.id)))
      || (command.options?.registrationRequired && !(await existsUser(interaction.user.id)))) {
      return interaction.reply({
        embeds: [{
          title: script.need_to_register,
          description: script.register_with_command(mentionCommand(interaction.client, "account", "create")),
          color: colors.error,
        }],
        ephemeral: true,
      }).catch(reject);
    }

    if (interaction.isButton()) {
      (subcommand?.button ? subcommand : command)?.button?.(interaction, args).then((res) => {
        if (interaction.replied || interaction.deferred) {
          interaction.editReply(res).catch((err) => {
            reject({
              handled: `Button Edit Reply Error - ${commandName}`,
              error: err,
            });
          });
        } else {
          interaction.update(res).catch((err) => {
            reject({
              handled: `Button Reply Error - ${commandName}`,
              error: err,
            });
          });
        }
      }).catch((err) => {
        reject({
          handled: `Button Execution Error - ${commandName}`,
          error: err,
        });
      });
    } else if (interaction.isStringSelectMenu()) {
      (subcommand?.stringSelect ? subcommand : command)?.stringSelect?.(interaction, args).then((res) => {
        if (interaction.replied || interaction.deferred) {
          interaction.editReply(res).catch((err) => {
            reject({
              handled: `SelectMenu Edit Reply Error - ${commandName}`,
              error: err,
            });
          });
        } else {
          interaction.update(res).catch((err) => {
            reject({
              handled: `SelectMenu Reply Error - ${commandName}`,
              error: err,
            });
          });
        }
      }).catch((err) => {
        reject({
          handled: `Select Menu Execution Error - ${commandName}`,
          error: err,
        });
      });
    } else if (interaction.isModalSubmit()) {
      (subcommand?.modalSubmit ? subcommand : command)?.modalSubmit?.(interaction, args).then((res) => {
        if (interaction.replied || interaction.deferred) {
          interaction.editReply(res as InteractionEditReplyOptions).catch((err) => {
            reject({
              handled: `Modal Edit Reply Error - ${commandName}`,
              error: err,
            });
          });
        } else {
          interaction.reply(res as InteractionReplyOptions).catch((err) => {
            reject({
              handled: `Modal Reply Error - ${commandName}`,
              error: err,
            });
          });
        }
      }).catch((err) => {
        reject({
          handled: `Modal Execution Error - ${commandName}`,
          error: err,
        });
      });
    }
  });
}

export async function checkCommandExecutable(interaction: RepliableInteraction<"cached">, scripts: TScripts, command?: Command, subcommand?: SubCommand) {
  return new Promise<boolean>((resolve, reject) => {
    const script = scripts[interaction.locale] ?? scripts["en-US"]!;

    if (!command) {
      interaction.reply({
        embeds: [{
          title: script.command_not_found,
          color: colors.error,
        }],
        ephemeral: true,
      }).catch(reject);
      return resolve(false);
    }
    if ((subcommand?.options?.whitelist && !subcommand.options.whitelist.includes(interaction.user.id))
      || (command.options.whitelist && !command.options.whitelist.includes(interaction.user.id))) {
      interaction.reply({
        embeds: [{
          title: script.no_permission,
          color: colors.error,
        }],
        ephemeral: true,
      }).catch(reject);
      return resolve(false);
    }
    const requiredPermissions = subcommand?.options?.permissions ?? command.options.permissions ?? [];
    if (requiredPermissions.length > 0) {
      if (!interaction.member?.permissions?.has(requiredPermissions)) {
        interaction.reply({
          embeds: [{
            title: script.no_permission,
            description: `${script.please_check_permission_below}\n\`\`\`${requiredPermissions.join(", ")}\`\`\``,
            color: colors.error,
          }],
          ephemeral: true,
        }).catch(reject);
        return resolve(false);
      }
      if (!interaction.guild?.members.me?.permissions?.has(requiredPermissions)) {
        interaction.reply({
          embeds: [{
            title: script.bot_does_not_have_permission,
            description: `${script.please_check_permission_below}\n\`\`\`${requiredPermissions.join(", ")}\`\`\``,
            color: colors.error,
          }],
          ephemeral: true,
        }).catch(reject);
        return resolve(false);
      }
    }
    if (subcommand?.options?.cooldown) {
      const cooldown = subcommand.cooldowns!.get(`${interaction.user.id}`) ?? 0;
      if (Date.now() < cooldown) {
        interaction.reply({
          ephemeral: true, embeds: [{
            title: script.cooldown,
            description: script.please_try_again_later(`<t:${Math.ceil(cooldown / 1000)}:R>`),
            color: colors.warn,
          }],
        }).catch(reject);
        return resolve(false);
      }
      subcommand.cooldowns!.set(`${interaction.user.id}`, Date.now() + subcommand.options.cooldown);
    } else if (command.options?.cooldown) {
      const cooldown = command.cooldowns!.get(`${interaction.user.id}`) ?? 0;
      if (Date.now() < cooldown) {
        interaction.reply({
          ephemeral: true, embeds: [{
            title: script.cooldown,
            description: script.please_try_again_later(`<t:${Math.ceil(cooldown / 1000)}:R>`),
            color: colors.warn,
          }],
        }).catch(reject);
        return resolve(false);
      }
      command.cooldowns!.set(`${interaction.user.id}`, Date.now() + command.options.cooldown);
    }
    if (subcommand?.options?.registrationRequired || command.options?.registrationRequired) {
      existsUser(interaction.user.id).then((exists) => {
        if (!exists) {
          interaction.reply({
            embeds: [{
              title: script.need_to_register,
              description: script.register_with_command(mentionCommand(interaction.client, "account", "create")),
              color: colors.error,
            }],
            ephemeral: true,
          });
          return resolve(false);
        }
        return resolve(true);
      }).catch(reject);
    } else {
      resolve(true);
    }
  });
}

export function autocomplete(interaction: AutocompleteInteraction<"cached">) {
  return new Promise<void>(async (_, reject) => {
    const command = commands.get(interaction.commandName);
    let subcommand: SubCommand | undefined = undefined;

    if (command?.subcommands) {
      const subcommandGroup = interaction.options.getSubcommandGroup(false);
      const subcommandName = interaction.options.getSubcommand(false) ?? "";
      subcommand = command.subcommands.get(subcommandGroup ? `${subcommandGroup} ${subcommandName}` : subcommandName);
    }

    (subcommand?.autocomplete ? subcommand : command)?.autocomplete?.(interaction).then((res) => {
      interaction.respond(res).catch((err) => {
        reject({
          handled: `AutoComplete Respond Error - ${interaction.commandName}`,
          error: err,
        });
      });
    }).catch((err) => {
      reject({
        handled: `AutoComplete Execution Error - ${interaction.commandName}`,
        error: err,
      });
    });
  });
}

export function interactionHandler(interaction: Interaction<"cached">, scripts: Partial<Record<Locale, IScripts>>) {
  return new Promise<void>(async (_, reject) => {
    try {
      if (interaction.isChatInputCommand()) {
        chatInput(interaction, scripts).catch(reject);
      } else if (interaction.isMessageContextMenuCommand()) {
        messageContextMenu(interaction, scripts).catch(reject);
      } else if (interaction.isUserContextMenuCommand()) {
        userContextMenu(interaction, scripts).catch(reject);
      } else if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
        hasCustomId(interaction, scripts).catch(reject);
      } else if (interaction.isAutocomplete()) {
        autocomplete(interaction).catch(() => { });
      }
    } catch (err) {
      console.error(interaction);
      reject(err);
    }
  });
}
