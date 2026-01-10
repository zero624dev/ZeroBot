import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  type InteractionReplyOptions,
  type Locale,
} from "discord.js";
import { Command, SubCommand } from "../../../core/types";
import sharp from "sharp";
import { colors } from "../../../config";

export interface IScripts {
  option_required: string;
  color_picker: string;
  invalid_input: string;
  unsupported_image: string;
  invalid_color: string;
  image_is_too_big: string;
}

export default class ColorPicker extends SubCommand {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      option_required: "옵션을 최소 하나 입력해주세요.",
      invalid_input: "잘못된 입력값이에요.",
      invalid_color: "유효한 색깔이 아니에요.",
      color_picker: "색상 추출",
      unsupported_image: "지원되지 않는 이미지 형식이에요.",
      image_is_too_big: "1MB 이상의 이미지는 불러올 수 없어요.",
    },
    "en-US": {
      option_required: "Please provide at least one option.",
      invalid_input: "Invalid input value.",
      invalid_color: "Invalid color.",
      color_picker: "Color Picker",
      unsupported_image: "Unsupported image format.",
      image_is_too_big: "Max image size is 1MB.",
    },
  };

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "color-picker",
      description: "Pick a color from an image or a HEX/RGB value.",
      nameLocalizations: {
        ko: "색상추출",
      },
      descriptionLocalizations: {
        ko: "이미지나 HEX/RGB 값에서 색상을 추출해요.",
      },
      options: [
        {
          name: "color",
          description: "The color to pick.",
          nameLocalizations: {
            ko: "색상",
          },
          descriptionLocalizations: {
            ko: "추출할 색상을 입력해주세요.",
          },
          type: ApplicationCommandOptionType.String,
        },
        {
          name: "attachment",
          description: "The image to pick the color from.",
          nameLocalizations: {
            ko: "이미지",
          },
          descriptionLocalizations: {
            ko: "색상을 추출할 이미지를 첨부해주세요.",
          },
          type: ApplicationCommandOptionType.Attachment,
        },
      ],
    });
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>(async (resolve, reject) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;
      const attachment = interaction.options.getAttachment("attachment");
      const color = interaction.options.getString("color");

      if (!color && !attachment) {
        return resolve({
          embeds: [
            {
              title: scripts.option_required,
              color: colors.error,
            },
          ], flags: ["Ephemeral"],
        });
      }

      try {
        let hex = "", rgb = "";
        const embeds = [];
        const files = [];

        if (attachment) {
          if (attachment.size > 1024 * 1024) {
            return resolve({
              embeds: [
                {
                  title: scripts.image_is_too_big,
                  color: colors.error,
                },
              ], flags: ["Ephemeral"],
            });
          }

          const buffer = await fetch(attachment.url).then((r) => r.arrayBuffer());
          await sharp(buffer).raw().toBuffer({ resolveWithObject: true }).then(({ data }) => {
            hex = this.rgbToHex(data[0], data[1], data[2]);
            rgb = `${data[0]}, ${data[1]}, ${data[2]}`;
          }).catch(() => {
            resolve({
              embeds: [
                {
                  title: scripts.unsupported_image,
                  color: colors.error,
                },
              ], flags: ["Ephemeral"],
            });
          });

          embeds.push({
            title: scripts.color_picker,
            thumbnail: { url: attachment.url },
            description: `RGB: ${rgb}\nHEX: ${hex}`,
            image: { url: `attachment://${hex.slice(1)}.png` },
            footer: { text: "Color Picker • ZeroBot" },
            color: parseInt(hex.slice(1), 16),
          });
          files.push({
            attachment: sharp({
              create: {
                width: 512,
                height: 512,
                channels: 4,
                background: hex,
              },
            }).png(),
            name: `${hex.slice(1)}.png`,
          });
        }

        if (color) {
          if (this.isValidRGB(color)) {
            const [r, g, b] = color.split(",").map(Number);
            rgb = `${r}, ${g}, ${b}`;
            hex = this.rgbToHex(r, g, b);
          } else if (this.isValidHex(color)) {
            rgb = this.hexTorgb(color.slice(1)).join(", ");
            hex = color;
          } else if (this.isValidHex(`#${color}`)) {
            rgb = this.hexTorgb(color).join(", ");
            hex = `#${color}`;
          } else {
            return reject({
              embeds: [
                {
                  title: scripts.invalid_input,
                  color: colors.error,
                },
              ],
            });
          }

          if (files[0]?.name == `${hex.slice(1)}.png`) return;

          embeds.push({
            title: scripts.color_picker,
            description: `RGB: ${rgb}\nHEX: ${hex}`,
            image: { url: `attachment://${hex.slice(1)}.png` },
            footer: { text: "Color Picker • ZeroBot" },
            color: parseInt(hex.slice(1), 16),
          });
          files.push({
            attachment: sharp({
              create: {
                width: 512,
                height: 512,
                channels: 4,
                background: hex,
              },
            }).png(),
            name: `${hex.slice(1)}.png`,
          });
        }

        resolve({
          embeds, files,
        });
      } catch (err) {
        console.error(err);
        resolve({
          embeds: [
            {
              title: scripts.invalid_color,
              color: colors.error,
            },
          ],
        });
      }
    });
  }

  isValidRGB(rgb: string) {
    return /(\d{1,3}\s*,\s*){2}\d{1,3}/.test(rgb);
  }

  isValidHex(hex: string) {
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(hex);
  }

  rgbToHex(r: number, g: number, b: number) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  hexTorgb(string: string) {
    var aRgbHex = string.match(/.{1,2}/g) ?? ["0", "0", "0"];
    var aRgb = [
      parseInt(aRgbHex[0], 16),
      parseInt(aRgbHex[1], 16),
      parseInt(aRgbHex[2], 16),
    ];
    return aRgb;
  }
}
