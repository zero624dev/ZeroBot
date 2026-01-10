import {
  ChatInputCommandInteraction,
  Collection,
  ApplicationCommandOptionType,
  type InteractionReplyOptions,
  type User,
} from "discord.js";
import { SubCommand, type Command } from "../../../core/types";
import GIF from "sharp-gif";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { colors } from "../../../config";

export default class PetPet extends SubCommand {
  sprites = new Collection<string, Buffer>();

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "petpet",
      description: "Generates Pet The User gif.",
      nameLocalizations: {
        ko: "쓰다듬기",
      },
      descriptionLocalizations: {
        ko: "유저를 쓰다듬는 움짤을 생성해요.",
      },
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: "user",
          description: "The user to pet.",
          nameLocalizations: {
            ko: "유저",
          },
          descriptionLocalizations: {
            ko: "쓰다듬을 유저.",
          },
          required: false,
        },
      ],
    }, {
      cooldown: 1000 * 5,
    });

    const spriteDir = path.join(import.meta.dir, "../../../media/sprites/meme/hand");
    fs.readdirSync(spriteDir).forEach((spr) => {
      sharp(`${spriteDir}/${spr}`).toBuffer().then((buf) => {
        this.sprites.set(`hand${spr.split(".")[0]}`, buf);
      });
    });
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>((resolve, reject) => {
      const user = interaction.options.getUser("user") ?? interaction.user;
      this.getPetPet(user).then((stream) => {
        resolve({
          embeds: [
            {
              title: `Pet The ${user.username}`,
              image: { url: "attachment://Pet_The.gif" },
              color: colors.accent,
            },
          ],
          files: [
            {
              attachment: stream, name: "Pet_The.gif",
            },
          ],
        });
      }).catch(reject);
    });
  }

  getPetPet(user: User): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      fetch(user.displayAvatarURL({ extension: "png", size: 128 })).then((r) => r.arrayBuffer()).then((r) => Buffer.from(r)).then(async (av) => {
        const gif = GIF.createGif({
          width: 128,
          height: 128,
          delay: 30,
          repeat: Infinity,
          transparent: "#000000",
        });
        for (let i = 0; i < 9; i++) {
          const hand = this.sprites.get(`hand${i}`);
          if (!hand) return reject(`Hand[${i}] sprite not found.`);
          gif.addFrame(
            sharp({
              create: {
                width: 128,
                height: 128,
                channels: 3,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
              },
            }).composite([
              {
                input: await sharp(av).resize({
                  width: 80 + [0, 4, 10, 14, 16, 14, 10, 4, 0][i],
                  height: 80 - [0, 15, 20, 23, 25, 23, 20, 15, 0][i],
                  fit: "fill",
                }).toBuffer(),
                left: 20 - [0, 2, 5, 7, 8, 7, 5, 2, 0][i],
                top: 30 + [0, 15, 20, 23, 25, 23, 20, 15, 0][i],
              },
              {
                input: hand,
                left: 0,
                top: 0,
              },
            ]),
          );
        }
        resolve(gif.toBuffer());
      });
    });
  }
}
