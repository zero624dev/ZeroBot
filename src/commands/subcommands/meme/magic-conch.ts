import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  type InteractionReplyOptions,
  type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../core/types";
import { MathUtils } from "../../../core/utils/utils";
import { colors } from "../../../config";

export interface IScripts {
  magic_conch_shell: string;
  question: string;
  answer: string;
  answer_dialogues: string[];
}

export default class MagicConch extends SubCommand {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      magic_conch_shell: "마법의 소라고동",
      question: "질문",
      answer: "대답",
      answer_dialogues: [
        "언젠가는.",
        "가만히 있어.",
        "둘 다 안 돼.",
        "그것도 안 돼.",
        "그럼.",
        "다시 한 번 물어봐.",
        "안 돼.",
      ],
    },
    "en-US": {
      magic_conch_shell: "Magic Conch Shell",
      question: "Question",
      answer: "Answer",
      answer_dialogues: [
        "Maybe someday.",
        "Nothing.",
        "Neither.",
        "I don't think so.",
        "Yes.",
        "Try asking again.",
        "No.",
      ],
    },
  };

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "magic-conch",
      description: "Asks a <question> to the Magic Conch Shell.",
      nameLocalizations: {
        ko: "마법의소라고동",
      },
      descriptionLocalizations: {
        ko: "마법의 소라고동에게 질문해요.",
      },
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "question",
          description: "The question to ask.",
          nameLocalizations: {
            ko: "질문",
          },
          descriptionLocalizations: {
            ko: "질문할 내용.",
          },
          required: true,
        },
      ],
    });
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>((resolve) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
      resolve({
        embeds: [
          {
            author: { name: scripts.magic_conch_shell, icon_url: "https://media.discordapp.net/attachments/843156045865418752/959647592994725888/91YDA4kSb-L.png" },
            fields: [
              { name: scripts.question, value: interaction.options.getString("question", true), inline: false },
              { name: scripts.answer, value: MathUtils.randomArray(scripts.answer_dialogues), inline: false },
            ],
            color: colors.accent,
          },
        ],
      });
    });
  }
}
