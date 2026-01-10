import {
  Collection,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  type InteractionReplyOptions,
  type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../core/types";
import sharp from "sharp";
import path from "path";
import fs from "fs";

export interface IScripts {
}

export default class BlueArchiveLogo extends SubCommand {
  sprites = new Collection<string, Buffer>();
  scripts: Partial<Record<Locale, IScripts>> = {};
  // fontDir: string = path.join(import.meta.dir, "../../../media/fonts/BlueArchiveTitle-Bold.otf");

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "bluearchive-logo",
      description: "Generates a BlueArchive-style logo.",
      nameLocalizations: {
        ko: "블루아카이브로고",
      },
      descriptionLocalizations: {
        ko: "블루아카이브 스타일의 로고를 생성해요.",
      },
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "blue",
          description: "The preceding text",
          nameLocalizations: {
            ko: "블루",
          },
          descriptionLocalizations: {
            ko: "앞 텍스트",
          },
          maxLength: 25,
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "archive",
          description: "The following text",
          nameLocalizations: {
            ko: "아카이브",
          },
          descriptionLocalizations: {
            ko: "뒷 텍스트",
          },
          maxLength: 25,
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "subtitle",
          description: "The under text",
          nameLocalizations: {
            ko: "부제",
          },
          descriptionLocalizations: {
            ko: "아래 텍스트",
          },
          maxLength: 25,
          required: false,
        },
        // {
        //     type: ApplicationCommandOptionType.String,
        //     name: "background",
        //     description: "Set Background Style",
        //     nameLocalizations: {
        //         ko: "배경"
        //     },
        //     descriptionLocalizations: {
        //         ko: "배경 스타일 설정"
        //     },
        //     choices: [
        //         {
        //             name: "Transparent",
        //             nameLocalizations: {
        //                 ko: "투명"
        //             },
        //             value: "transparent"
        //         },
        //         {
        //             name: "White Background",
        //             nameLocalizations: {
        //                 ko: "하얀 배경"
        //             },
        //             value: "white"
        //         },
        //         {
        //             name: "White Outline",
        //             nameLocalizations: {
        //                 ko: "하얀 테두리"
        //             },
        //             value: "outline"
        //         }
        //     ],
        //     required: false
        // }
      ],
    }, {

    });

    const spriteDir = path.join(import.meta.dir, "../../../media/sprites/meme/bluearchive");
    fs.readdirSync(spriteDir).forEach((spr) => {
      sharp(`${spriteDir}/${spr}`).toBuffer().then((buf) => {
        this.sprites.set(spr.split(".")[0], buf);
      });
    });
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>(async (resolve, reject) => {
      const blue = interaction.options.getString("blue", true);
      const archive = interaction.options.getString("archive", true);
      const subtitle = interaction.options.getString("subtitle");

      try {
        const bluearchive = await sharp({
          text: {
            text: `<span foreground="#128AFA">${blue}</span><span foreground="#2B2B2B">${archive}</span>`,
            rgba: true,
            dpi: 1000,
            font: "BlueArchiveTitle",
            // fontfile: this.fontDir,
          },
        }).affine([1, -0.4, 0, 1], { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer({ resolveWithObject: true });

        const blueWidth = await sharp({
          text: {
            text: blue,
            rgba: true,
            dpi: 1000,
            font: "BlueArchiveTitle",
            // fontfile: this.fontDir,
          },
        }).toBuffer({ resolveWithObject: true }).then(({ info }) => info.width!);
        const archiveWidth = bluearchive.info.width! - blueWidth;
        const margin = Math.round((
          (blueWidth + 25 > 250 ? 25 : 250 - blueWidth)
          + (archiveWidth + 25 > 250 ? 25 : 250 - archiveWidth)
        ) / 2);
        const haloOffset = blueWidth + margin;
        const logoWidth = bluearchive.info.width! + 2 * margin;
        const haloLeft = logoWidth > 500 ? Math.max(0, haloOffset - 145) : 0;

        const logoMask = await sharp(
          await sharp(bluearchive.data).extractChannel("alpha").blur(2).negate().toBuffer(),
        ).blur(5).unflatten().png().toBuffer();

        const logoComposites: sharp.OverlayOptions[] = [
          {
            input: this.sprites.get("halo")!,
            top: 0,
            left: haloLeft,
          },
          {
            input: logoMask,
            left: margin,
            top: 350 - bluearchive.info.height!,
            blend: "dest-out",
          },
          {
            input: bluearchive.data,
            left: margin,
            top: 350 - bluearchive.info.height!,
          },
          {
            input: this.sprites.get("cross-mask")!,
            top: 0,
            left: haloLeft,
            blend: "dest-out",
          },
          {
            input: this.sprites.get("cross")!,
            top: 0,
            left: haloLeft,
          },
        ];

        if (subtitle) {
          const underText = sharp({
            text: {
              text: `<span foreground="#2B2B2B">${subtitle}</span>`,
              rgba: true,
              dpi: 450,
              font: "BlueArchiveTitle",
              fontfile: "/home/ubuntu/workspace/ZeroBotNext/src/media/fonts/BlueArchiveTitle-Bold.otf",
            },
          }).affine([1, -0.4, 0, 1], { background: { r: 0, g: 0, b: 0, alpha: 0 } });

          let underTextWidth = await underText.metadata().then((md) => md.width);

          const maxWidth = logoWidth > 500 ? logoWidth - haloOffset - 150 : archiveWidth;
          if (underTextWidth > maxWidth) {
            underText.resize(maxWidth);
            underTextWidth = maxWidth;
          }
          logoComposites.push({
            input: await underText.png().toBuffer(),
            top: 375,
            left: logoWidth > 500 ? haloOffset + 50 + (maxWidth - underTextWidth) : 160 + (maxWidth - underTextWidth),
          });
        }

        const logo = sharp({
          create: {
            width: logoWidth,
            height: 500,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          },
        }).composite(logoComposites);

        resolve({
          files: [
            {
              attachment: logo.png(),
              name: "logo.png",
            },
          ],
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
