import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    ChatInputCommandInteraction,
    type InteractionReplyOptions,
    type Client
} from "discord.js";
import { Command } from "../core/types";
import util from "util";
import { StringUtils } from "../core/utils/utils";
import { SUPPORT_GUILD_ID, colors } from "../config";

export default class Eval extends Command {
    constructor(client: Client) {
        super(client, {
            type: ApplicationCommandType.ChatInput,
            name: "eval",
            description: "Evaluate the code(TS).",
            options: [
                {
                    name: "code",
                    description: "The code to evaluate.",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "silent",
                    description: "Whether to not send the output to the channel.",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                }
            ]
        }, {
            guilds: [SUPPORT_GUILD_ID],
            whitelist: ["532239959281893397", "656348235203477513"]
        });
    }

    async chatInput(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        if (interaction.options.getString("process")) {
            return { content: "Unsupported process option", flags: ["Ephemeral"] };
        }
        const code = interaction.options.getString("code", true);
        const silent: boolean = interaction.options.getBoolean("silent", false) ?? true;
        
        await interaction.deferReply({ flags: silent ? ["Ephemeral"] : [] });
        const startTime = performance.now();
        try {
            // Unsafe eval remains; consider sandboxing for production
            let evaled: unknown = await eval(code);
            evaled = typeof evaled === "string" ? `"${evaled}"` : util.inspect(evaled, { depth: 1 });
            return {
                embeds: [
                    {
                        title: "Eval",
                        fields: [
                            { name: "Input", value: `\`\`\`ts\n${StringUtils.ellipsis(code, 1000)}\`\`\``, inline: false },
                            { name: "Output", value: `\`\`\`js\n${StringUtils.ellipsis(String(evaled), 1000)}\`\`\``, inline: false }
                        ],
                        footer: { text: `${(performance.now() - startTime).toFixed(1)}ms` },
                        color: colors.accent
                    }
                ],
                flags: silent ? ["Ephemeral"] : []
            };
        } catch (err) {
            const errorStr = err instanceof Error ? (err.stack ?? err.message) : String(err);
            return {
                embeds: [
                    {
                        title: "Eval Error",
                        fields: [
                            { name: "Input", value: `\`\`\`ts\n${code}\`\`\``, inline: false },
                            { name: "Output", value: `\`\`\`js\n${errorStr.length > 1000 ? `${errorStr.slice(0, 1000)}\n\n...` : errorStr}\`\`\``, inline: false }
                        ],
                        footer: { text: `${(performance.now() - startTime).toFixed(1)}ms` },
                        color: colors.error
                    }
                ],
                flags: silent ? ["Ephemeral"] : []
            };
        }
    }
}