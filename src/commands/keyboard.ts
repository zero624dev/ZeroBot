import {
  type InteractionReplyOptions,
  ApplicationCommandType,
  type Locale,
  type Client,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { Command } from "../core/types";
import { assemble, disassemble } from "hangul-js";
import { colors } from "../config";

export interface IScripts {
  title: string;
  input: string;
  output: string;
}

export default class BotInfo extends Command {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      title: "알파벳 <-> 한글",
      input: "입력",
      output: "출력",
    },
    "en-US": {
      title: "English <-> Korean",
      input: "Input",
      output: "Output",
    },
  };

  e2k: any = {
    q: "ㅂ", w: "ㅈ", e: "ㄷ", r: "ㄱ", t: "ㅅ", y: "ㅛ", u: "ㅕ", i: "ㅑ", o: "ㅐ", p: "ㅔ",
    a: "ㅁ", s: "ㄴ", d: "ㅇ", f: "ㄹ", g: "ㅎ", h: "ㅗ", j: "ㅓ", k: "ㅏ", l: "ㅣ", z: "ㅋ",
    x: "ㅌ", c: "ㅊ", v: "ㅍ", b: "ㅠ", n: "ㅜ", m: "ㅡ", Q: "ㅃ", W: "ㅉ", E: "ㄸ", R: "ㄲ", T: "ㅆ",
    O: "ㅒ", P: "ㅖ", Y: "ㅛ", U: "ㅕ", I: "ㅑ", A: "ㅁ", S: "ㄴ", D: "ㅇ", F: "ㄹ", G: "ㅎ", H: "ㅗ",
    J: "ㅓ", K: "ㅏ", L: "ㅣ", Z: "ㅋ", X: "ㅌ", C: "ㅊ", V: "ㅍ", B: "ㅠ", N: "ㅜ", M: "ㅡ",
  };

  k2e: any = {
    ㅂ: "q", ㅈ: "w", ㄷ: "e", ㄱ: "r", ㅅ: "t", ㅛ: "y", ㅕ: "u", ㅑ: "i", ㅐ: "o", ㅔ: "p",
    ㅁ: "a", ㄴ: "s", ㅇ: "d", ㄹ: "f", ㅎ: "g", ㅗ: "h", ㅓ: "j", ㅏ: "k", ㅣ: "l",
    ㅋ: "z", ㅌ: "x", ㅊ: "C", ㅍ: "v", ㅠ: "b", ㅜ: "n", ㅡ: "m",
    ㅃ: "Q", ㅉ: "W", ㄸ: "E", ㄲ: "R", ㅆ: "T", ㅒ: "O", ㅖ: "P",
  };

  constructor(client: Client) {
    super(client, {
      name: "Change En/Ko Key",
      nameLocalizations: {
        ko: "한/영 키 변환",
      },
      type: ApplicationCommandType.Message,
      dmPermission: false,
    });
  }

  messageContextMenu(interaction: MessageContextMenuCommandInteraction<"cached">) {
    return new Promise<InteractionReplyOptions>((resolve) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
      const input = interaction.targetMessage.content;
      const result = assemble(disassemble(input).map((i) => this.e2k[i] ?? this.k2e[i] ?? i));

      resolve({
        embeds: [
          {
            title: scripts.title,
            fields: [
              { name: scripts.input, value: input },
              { name: scripts.output, value: result },
            ],
            color: colors.accent,
          },
        ],
      });
    });
  }
}
