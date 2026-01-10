import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  type InteractionReplyOptions,
  type Locale,
} from "discord.js";
import { Command, SubCommand } from "../../../core/types";
import { assemble, disassemble } from "hangul-js";
import { colors } from "../../../config";

export interface IScripts {
  title: string;
  input: string;
  output: string;
}

export default class ColorPicker extends SubCommand {
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

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "keyboard",
      description: "Converts English-Korean according to the keyboard position",
      nameLocalizations: {
        ko: "키보드",
      },
      descriptionLocalizations: {
        ko: "키보드를 기준으로 영어-한글을 변환합니다.",
      },
      options: [
        {
          name: "text",
          description: "The text to convert.",
          nameLocalizations: {
            ko: "텍스트",
          },
          descriptionLocalizations: {
            ko: "변환할 텍스트.",
          },
          type: ApplicationCommandOptionType.String,
        },
      ],
    });
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>(async (resolve) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
      const input = interaction.options.getString("text", true);
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
