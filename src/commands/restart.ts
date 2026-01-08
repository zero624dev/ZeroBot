import {
    ActivityType,
    ApplicationCommandOptionType,
    ApplicationCommandType,
    type ChatInputCommandInteraction,
    type InteractionReplyOptions,
    type Client

} from "discord.js";
import { Command } from "../core/types";
import fs from "fs";
import path from "path";
import { colors, SUPPORT_GUILD_ID } from "../config";

export default class Restart extends Command {
    constructor(client: Client) {
        super(client, {
            type: ApplicationCommandType.ChatInput,
            name: "restart",
            description: "Restart the bot.",
            options: [
                {
                    name: "all",
                    description: "Restart all shards.",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                }
            ]
        }, {
            guilds: [SUPPORT_GUILD_ID],
            whitelist: ["532239959281893397", "285229678443102218"]
        });
    }

    chatInput(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((_resolve, _reject) => {
            interaction.deferReply({ ephemeral: true }).then(() => {
                const configPath = path.join(import.meta.dir, "../config.json");
                const restartAll = interaction.options.getBoolean("all");

                fs.writeFileSync(configPath, JSON.stringify({
                    type: restartAll ? "all" : "single",
                    timestamp: Date.now()
                }, null, 2));

                if (this.client.shard && this.client.shard.count > 1 && restartAll) {
                    this.client.shard.broadcastEval((client, activityType) => {
                        client.user?.setPresence({
                            status: "idle",
                            activities: [
                                {
                                    name: "Restarting...",
                                    type: activityType
                                }
                            ]
                        });
                    }, { context: ActivityType.Playing });

                    interaction.editReply({
                        embeds: [{
                            title: "Restarting All Shards...",
                            color: colors.warn
                        }]
                    }).then(() => {
                        this.client.shard!.respawnAll();
                    });
                } else {
                    this.client.user?.setPresence({
                        status: "idle",
                        activities: [
                            {
                                name: "Restarting...",
                                type: ActivityType.Playing
                            }
                        ]
                    });

                    interaction.editReply({
                        embeds: [{
                            title: "Restarting...",
                            color: colors.warn
                        }]
                    }).then(() => {
                        process.exit(1);
                    });
                }
            });
        });
    }
}
