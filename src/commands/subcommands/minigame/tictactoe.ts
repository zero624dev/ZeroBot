import {
  ButtonInteraction,
  ComponentType,
  ButtonStyle,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  type InteractionReplyOptions,
  type InteractionUpdateOptions,
  type ButtonComponent,
} from "discord.js";
import { type Command, SubCommand } from "../../../core/types";
import { colors } from "../../../config";

export interface IScripts {
  game_title: string;
  participants_field_name: string;
  user_turn: (username: string) => string;
  user_victory: (username: string) => string;
  draw: string;
  wait_for_opponent: string;
  wait_your_turn: string;
  not_participant: string;
}

export default class extends SubCommand {
  scripts: Record<string, IScripts> = {
    "ko": {
      game_title: "틱택토",
      participants_field_name: "참가자",
      user_turn: (username: string) => `${username}님의 차례예요.`,
      user_victory: (username: string) => `${username}님이 이겼어요!`,
      draw: "무승부예요!",
      wait_for_opponent: "상대방을 기다리는 중이에요.",
      wait_your_turn: "차례를 기다려주세요.",
      not_participant: "당신은 참가자가 아니에요.",
    },
    "en-US": {
      game_title: "Tic-Tac-Toe",
      participants_field_name: "Participants",
      user_turn: (username: string) => `${username}'s turn.`,
      user_victory: (username: string) => `${username} won!`,
      draw: "Draw!",
      wait_for_opponent: "Waiting for opponent.",
      wait_your_turn: "Please wait your turn.",
      not_participant: "You are not a participant.",
    },
  };

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "tictactoe",
      description: "Starts a tic-tac-toe game.",
      nameLocalizations: {
        ko: "틱택토",
      },
      descriptionLocalizations: {
        ko: "틱택토 게임을 시작합니다.",
      },
    });
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>((resolve) => {
      const commandName = interaction.commandName;
      const subcommandName = interaction.options.getSubcommand();
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"];

      resolve({
        embeds: [
          {
            title: scripts.game_title,
            description: scripts.user_turn(`<@${interaction.user.id}>(❌)`),
            fields: [
              { name: scripts.participants_field_name, value: `__<@${interaction.user.id}>__`, inline: true },
            ],
            color: colors.accent,
          },
        ], components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                customId: `all|${commandName}|${subcommandName}|0`,
                emoji: "<:toomyeong:851385935282700310>",
                style: ButtonStyle.Primary,
              },
              {
                type: ComponentType.Button,
                customId: `all|${commandName}|${subcommandName}|1`,
                emoji: "<:toomyeong:851385935282700310>",
                style: ButtonStyle.Primary,
              },
              {
                type: ComponentType.Button,
                customId: `all|${commandName}|${subcommandName}|2`,
                emoji: "<:toomyeong:851385935282700310>",
                style: ButtonStyle.Primary,
              },
            ],
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                customId: `all|${commandName}|${subcommandName}|3`,
                emoji: "<:toomyeong:851385935282700310>",
                style: ButtonStyle.Primary,
              },
              {
                type: ComponentType.Button,
                customId: `all|${commandName}|${subcommandName}|4`,
                emoji: "<:toomyeong:851385935282700310>",
                style: ButtonStyle.Primary,
              },
              {
                type: ComponentType.Button,
                customId: `all|${commandName}|${subcommandName}|5`,
                emoji: "<:toomyeong:851385935282700310>",
                style: ButtonStyle.Primary,
              },
            ],
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                customId: `all|${commandName}|${subcommandName}|6`,
                emoji: "<:toomyeong:851385935282700310>",
                style: ButtonStyle.Primary,
              },
              {
                type: ComponentType.Button,
                customId: `all|${commandName}|${subcommandName}|7`,
                emoji: "<:toomyeong:851385935282700310>",
                style: ButtonStyle.Primary,
              },
              {
                type: ComponentType.Button,
                customId: `all|${commandName}|${subcommandName}|8`,
                emoji: "<:toomyeong:851385935282700310>",
                style: ButtonStyle.Primary,
              },
            ],
          },
        ],
      });
    });
  }

  button(interaction: ButtonInteraction<"cached">, args: string[]) {
    return new Promise<InteractionUpdateOptions>((resolve) => {
      const players = interaction.message.embeds[0].fields[0].value.match(/\d+/g) as string[] ?? [];
      const turn = Number(!interaction.message.embeds[0].description?.includes("❌"));
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en"];

      if (players.includes(interaction.user.id) || players.length == 1) {
        const [, commandName, subcommandName] = interaction.customId.split("|");

        if (players[turn] && interaction.user.id != players[turn]) {
          return interaction.reply({
            embeds: [
              {
                title: scripts.wait_your_turn,
                color: colors.error,
              },
            ], flags: ["Ephemeral"],
          });
        }

        players[turn] ??= interaction.user.id;
        const board = interaction.message.components.map((c) => (c as any).components.map((btn: ButtonComponent) => {
          const btnArgs = btn.customId?.split("|") ?? [];
          if (btnArgs[3] == args[0]) return turn;
          else return Number(btnArgs[4]);
        }));

        if (this.isWin(board, turn)) {
          resolve({
            embeds: [
              {
                title: scripts.game_title,
                description: scripts.user_victory(`<@${players[turn]}>(${["❌", "⭕"][turn]})`),
                fields: [
                  { name: scripts.participants_field_name, value: players.map((v) => `<@${v}>`).join(" vs "), inline: true },
                ],
                color: colors.accent,
              },
            ], components: this.getBoard(commandName, subcommandName, board, true),
          });
        } else if (board.find((c) => c.includes(NaN))) {
          resolve({
            embeds: [
              {
                title: scripts.game_title,
                description: players.length == 1 ? scripts.wait_for_opponent : scripts.user_turn(`<@${players[turn ? 0 : 1]}>(${["⭕", "❌"][turn]})`),
                fields: [
                  { name: scripts.participants_field_name, value: players.map((v, i) => i != turn ? `__<@${v}>__` : `<@${v}>`).join(" vs "), inline: true },
                ],
                color: colors.accent,
              },
            ], components: this.getBoard(commandName, subcommandName, board),
          });
        } else {
          resolve({
            embeds: [
              {
                title: scripts.game_title,
                description: scripts.draw,
                fields: [
                  { name: scripts.participants_field_name, value: players.map((v) => `<@${v}>`).join(" vs "), inline: true },
                ],
                color: colors.accent,
              },
            ], components: this.getBoard(commandName, subcommandName, board),
          });
        }
      } else {
        interaction.reply({
          embeds: [
            {
              title: scripts.not_participant,
              color: colors.error,
            },
          ], flags: ["Ephemeral"],
        });
      }
    });
  }

  getBoard(commandName: string, subcommandName: string, board: number[][], isEnd = false) {
    return board.map((c, i) => ({
      type: ComponentType.ActionRow,
      components: c.map((btn, j) => ({
        type: ComponentType.Button,
        customId: `all|${commandName}|${subcommandName}|${3 * i + j}|${btn}`,
        emoji: ["❌", "⭕"][btn] ?? "<:toomyeong:851385935282700310>",
        style: ButtonStyle.Primary,
        disabled: !isNaN(btn) || isEnd,
      })),
    })) as any[];
  }

  isWin(board: number[][], turn: number) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] != turn)
          break;
        if (j == 2)
          return true;
      }
    }
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[j][i] != turn)
          break;
        if (j == 2)
          return true;
      }
    }
    for (let i = 0; i < 3; i++) {
      if (board[i][i] != turn)
        break;
      if (i == 2)
        return true;
    }
    for (let i = 0; i < 3; i++) {
      if (board[i][2 - i] != turn)
        break;
      if (i == 2)
        return true;
    }
    return false;
  }
}
