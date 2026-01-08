import {
    ApplicationCommandType,
    type InteractionReplyOptions,
    version,
    ChatInputCommandInteraction,
    Guild,
    type Client
} from "discord.js";
import { Command } from "../core/types";
import mongoose from "mongoose";
import Bun from "bun";
import os from "os";
import { colors } from "../config";

export default class BotInfo extends Command {
    // Maintain version without relying on JSON import (tsconfig lacks resolveJsonModule)
    private readonly version = "3.0.3"; // sync with package.json

    constructor(client: Client) {
        super(client, {
            type: ApplicationCommandType.ChatInput,
            name: "botinfo",
            description: "Shows information about the bot.",
            nameLocalizations: { ko: "봇정보" },
            descriptionLocalizations: { ko: "봇에 대한 정보를 보여줘요." }
        }, { cooldown: 1000 * 60 * 5 });
    }

    async chatInput(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const developer = await this.client.users.fetch("532239959281893397").catch(() => null);
        const guilds = (this.client.shard?.count ?? 0) > 1
            ? await this.client.shard!.fetchClientValues("guilds.cache.size").then(results => (results as number[]).reduce((a, c) => a + c, 0))
            : this.client.guilds.cache.size;
        const users = (this.client.shard?.count ?? 0) > 1
            ? await this.client.shard!.fetchClientValues("guilds.cache").then(results => (results as Map<string, Guild>[]).reduce((a, c) => a + Array.from(c.values()).reduce((x, g) => x + (g.memberCount ?? 0), 0), 0))
            : this.client.guilds.cache.reduce((a, b) => a + b.memberCount, 0);
        const totalMem = os.totalmem();
        const usedMem = totalMem - os.freemem();

        return {
            embeds: [
                {
                    title: `ZeroBot ${this.version}`,
                    url: `https://discord.com/oauth2/authorize?client_id=${this.client.user?.id}&scope=bot%20applications.commands`,
                    thumbnail: { url: this.client.user?.displayAvatarURL() ?? "" },
                    fields: [
                        { name: "Ping", value: `> \`${this.client.ws.ping < 0 ? Date.now() - interaction.createdTimestamp : this.client.ws.ping}ms\``, inline: true },
                        { name: "Uptime", value: `> <t:${Math.round((Date.now() - (this.client.uptime ?? 0)) / 1000)}:R>`, inline: true },
                        { name: "Since", value: `> <t:1564747861:D>`, inline: true },
                        { name: "Servers", value: `> \`${guilds.toLocaleString()}\``, inline: true },
                        { name: "Users (Registered / All)", value: `> \`${await mongoose.model("User").countDocuments({}).then(c => c.toLocaleString())}\` / \`${users.toLocaleString()}\``, inline: true },
                        { name: "Using", value: `>>> **bun.sh** \`v${Bun.version}\`\n **discord.js** \`v${version}\`\n`, inline: false },
                        { name: "Memory", value: `>>> **System** \`${this.sizeNotate(usedMem, 1)}\` / \`${this.sizeNotate(totalMem, 1)}\` \`(${(usedMem / totalMem * 100).toFixed(1)}%)\``, inline: true }
                    ],
                    footer: developer ? { text: `Dev by ${developer.tag} • Working on ${process.platform}`, icon_url: developer.displayAvatarURL() } : undefined,
                    color: colors.accent,
                    timestamp: new Date().toISOString()
                }
            ]
        };
    }

    sizeNotate(byte: number, fixed: number): string {
        if (byte >= 1024 ** 3) return `${(byte / 1024 / 1024 / 1024).toFixed(fixed)} GB`;
        if (byte >= 1024 ** 2) return `${(byte / 1024 / 1024).toFixed(fixed)} MB`;
        return `${(byte / 1024).toFixed(fixed)} KB`;
    }
}
