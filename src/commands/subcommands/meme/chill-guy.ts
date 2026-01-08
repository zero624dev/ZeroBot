import {
    ApplicationCommandType,
    ChatInputCommandInteraction,
    type InteractionReplyOptions,
    ApplicationCommandOptionType
} from "discord.js";
import { Command } from "../../../core/types";
import path from "path";
import sharp from "sharp"

export default class Eval extends Command {
    chillBody!: Buffer;
    chillFace!: Buffer;


    constructor(client: any) {
        super(client, {
            name: "chill-guy",
            description: "Makes the user CHILL.",
            nameLocalizations: {
                ko: "칠가이"
            },
            descriptionLocalizations: {
                ko: "유저를 chill하게 만들어줘요."
            },
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "The user to chill",
                    nameLocalizations: {
                        ko: "유저"
                    },
                    descriptionLocalizations: {
                        ko: "chill하게 할 유저"
                    },
                    required: false,
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: "face",
                    description: "Whether to add facial expressions or not.",
                    nameLocalizations: {
                        ko: "표정"
                    },
                    descriptionLocalizations: {
                        ko: "표정을 추가할지 여부"
                    },
                    required: false
                }
            ]
        });

        const spriteDir = path.join(import.meta.dir, "../../../media/sprites/meme");
        sharp(spriteDir + "/chill_body.png").toBuffer().then(buff => {
            this.chillBody = buff;
        })
        sharp(spriteDir + "/chill_eyes.png").resize(200).toBuffer().then(buff => {
            this.chillFace = buff;
        })
    }

    chatInput(interaction: ChatInputCommandInteraction<"cached">) {
        return new Promise<InteractionReplyOptions>((resolve) => {
            const target = interaction.options.getUser("user") ?? interaction.member;
            const addFace = interaction.options.getBoolean("face");
            const roundedCorners = Buffer.from(
                '<svg><rect x="0" y="0" width="512" height="512" rx="512" ry="512"/></svg>'
            );

            fetch(target.displayAvatarURL({
                extension: "png", size: 512
            })).then(r => r.arrayBuffer()).then(r => Buffer.from(r)).then(async (av) => {
                const chillHead = await sharp(av)
                    .resize(512, 512)
                    .composite([{
                        input: roundedCorners,
                        blend: 'dest-in'
                    }]).toBuffer();
                const chillUser = await sharp({
                    create: {
                        height: 1287,
                        width: 650,
                        channels: 3,
                        background: { r: 122, g: 136, b: 119 }
                    }
                });

                if (addFace) {
                    chillUser.composite([
                        {
                            input: chillHead, left: 49, top: 25
                        },
                        {
                            input: this.chillFace,
                            left: 200, top: 100
                        },
                        {
                            input: this.chillBody,
                            left: 48, top: 412
                        }
                    ])
                } else {
                    chillUser.composite([
                        {
                            input: chillHead,
                            left: 49, top: 25
                        },
                        {
                            input: this.chillBody,
                            left: 48, top: 412
                        }
                    ]);
                }

                resolve({
                    files: [
                        {
                            attachment: chillUser.png(),
                            name: "test.png"
                        }
                    ]
                })
            });
            // const test = interaction.options.getString("test") ?? "";

            // if (parseInt(test)) {
            //     resolve({
            //         content: test.match(/.{1,4}/g)!.map(x => {
            //             if (x.length == 4)
            //                 return String.fromCharCode(Number(x));
            //             else
            //                 return String.fromCharCode(44032 + Number(x));
            //         }).join("")
            //     });
            // } else {
            //     resolve({
            //         content: test.split("").map(x => {
            //             const charCode = x.charCodeAt(0);
            //             if (charCode < 44032)
            //                 return charCode.toString();
            //             else
            //                 return (charCode - 44032).toString();
            //         }).join("")
            //     });
            // }
        });
    }
}