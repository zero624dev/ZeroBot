import type { Interaction, Locale, Client } from "discord.js";
import { ClientEvent } from "../core/types";
import { interactionHandler } from "../core/interaction";

export interface IScripts {
  command_not_found: string;
  no_permission: string;
  bot_does_not_have_permission: string;
  please_check_permission_below: string;
  cooldown: string;
  please_try_again_later: (time: string) => string;
  need_to_register: string;
  register_with_command: (command: string) => string;
  other_interaction: string;
}

export default class InteractionCreate extends ClientEvent<"interactionCreate"> {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      command_not_found: "커맨드를 찾지 못했어요.",
      no_permission: "이 커맨드를 사용할 권한이 없어요.",
      bot_does_not_have_permission: "봇이 이 커맨드를 실행할 권한이 없어요.",
      please_check_permission_below: "아래 권한을 가지고 있는지 확인해주세요.",
      cooldown: "쿨다운",
      please_try_again_later: (time) => `${time}에 다시 시도해주세요.`,
      need_to_register: "이 커맨드를 사용하려면 봇에 가입해야 해요.",
      register_with_command: (command) => `${command}로 가입할 수 있어요.`,
      other_interaction: "다른 사람의 상호작용이에요.",
    },
    "en-US": {
      command_not_found: "Command not found.",
      no_permission: "You don't have permission to use this command.",
      bot_does_not_have_permission: "Bot doesn't have permission to execute this command.",
      please_check_permission_below: "Please check the following permissions.",
      cooldown: "Cooldown",
      please_try_again_later: (time) => `Please try again later at ${time}.`,
      need_to_register: "You need to register to use this command.",
      register_with_command: (command) => `You can register with ${command}.`,
      other_interaction: "This is someone else's interaction.",
    },
  };

  constructor(client: Client) {
    super(client);
  }

  public run(interaction: Interaction<"cached">) {
    return new Promise<void>((_, reject) => {
      interactionHandler(interaction, this.scripts).catch(reject);
    });
  }
}
