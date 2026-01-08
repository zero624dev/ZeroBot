import type { MessageCreateOptions, MessagePayload, Client, GuildTextBasedChannel } from "discord.js";
import { LOGGING_CHANNEL_ID, SUPPORT_GUILD_ID } from "../config";

const pendingLogs = new Array<string | MessagePayload | MessageCreateOptions>();

function sendLog(client: Client, content: string | MessagePayload | MessageCreateOptions) {
    return new Promise((resolve) => {
        if (process.env.NODE_ENV == "development") {
            resolve(undefined);
            return;
        }

        if (!client.isReady()) {
            pendingLogs.push(content);
            resolve(undefined);
            return;
        }

        const local = client.channels.cache.get(LOGGING_CHANNEL_ID);
        if (local?.isSendable()) {
            resolve(local.send(content));
            return;
        }

        const shardUtil = client.shard;
        // If no shard manager or single shard, nothing to broadcast to
        if (!shardUtil || !(shardUtil.count ?? 0) || shardUtil.count <= 1) {
            resolve(undefined);
            return;
        }

        // compute target shard safely
        let targetShard = 0;
        try {
            const n = Number((BigInt(SUPPORT_GUILD_ID) >> 22n) % BigInt(shardUtil.count));
            if (Number.isFinite(n) && n >= 0 && n < shardUtil.count) targetShard = n;
        } catch (e) {
            targetShard = 0;
        }

        shardUtil.broadcastEval((c: Client, content: any) => {
            return (c.channels.cache.get((content as any)?._logChannelId) as GuildTextBasedChannel)?.send((content as any)?._payload).catch((e: any) => console.log(content, e));
        }, {
            shard: targetShard,
            context: { _payload: content, _logChannelId: LOGGING_CHANNEL_ID }
        }).then(resolve).catch(() => {
            pendingLogs.push(content);
            resolve(undefined);
        });
    });
}

function sendPendingLogs(client: Client) {
    if (client.shard)
        client.shard.broadcastEval(async () => {
            const mod = await import("../core/logger");
            const arr = mod.pendingLogs;
            const items = Array.isArray(arr) ? Array.from(arr) : [];
            arr.length = 0;
            return items;
        })
            .then(res => res.flatMap((r: any) => Array.isArray(r) ? r : []))
            .then(res => {
                res.forEach((content) => {
                    sendLog(client, content);
                });
            })
            .catch(() => { });
    else
        pendingLogs.forEach((content) => {
            sendLog(client, content);
        });
}

export { sendLog, sendPendingLogs, pendingLogs };