import {
  type Client,
  ActivityType,
} from "discord.js";
import { ClientEvent } from "../core/types";
import { sendLog, sendPendingLogs } from "../core/logger";
import { loadCommands, loadItems } from "../core/loader";
import { SUPPORT_GUILD_ID, colors } from "../config";
import fs from "fs";
import path from "path";

export default class ClientReady extends ClientEvent<"clientReady"> {
  constructor(client: Client) {
    super(client, "once");
  }

  public run() {
    return new Promise<void>(() => {
      const tmpPath = path.join(import.meta.dir, "../tmp.json");
      console.log(`Bot started on ${process.pid}`);

      if (fs.existsSync(tmpPath)) {
        const tmp = JSON.parse(fs.readFileSync(path.join(import.meta.dir, "../config.json"), "utf8"));
        this.client.user?.setPresence({
          status: "online",
          activities: [
            {
              name: `Restarted! (${((Date.now() - tmp.timestamp) / 1000).toFixed(1)}s)`,
              type: ActivityType.Playing,
            },
          ],
        });
        if (
          (this.client.shard && this.client.shard.ids.includes(this.client.shard.count - 1))
          || (tmp.type == "single" && (this.client.shard ? this.client.shard.ids.includes(Number(BigInt(SUPPORT_GUILD_ID) >> 22n) % this.client.shard.count) : true))
        ) {
          fs.rmSync(tmpPath);
        }
      } else {
        let startedByWatchtower = false;

        if (fs.existsSync("BUILD_ID")) {
          startedByWatchtower = true;
          if (this.client.shard?.ids.includes(this.client.shard.count - 1)) {
            fs.unlinkSync("BUILD_ID");
          }
        }

        const baseTitle = startedByWatchtower ? "Updated" : "Online after Crash";
        const baseColor = startedByWatchtower ? colors.accent : colors.error;

        if (this.client.shard?.count ?? 0 > 1) {
          sendLog(this.client, {
            embeds: [{
              title: `Shard ${this.client.shard?.ids.join(", ")} ${baseTitle}`,
              description: `<t:${Math.floor(Date.now() / 1000)}:R>`,
              color: baseColor,
            }],
          });
        } else {
          sendLog(this.client, {
            embeds: [{
              title: `Bot ${baseTitle}`,
              description: `<t:${Math.floor(Date.now() / 1000)}:R>`,
              color: baseColor,
            }],
          });
        }
        this.client.user?.setPresence({
          status: "online",
          activities: [
            {
              name: "Restarted!",
              type: ActivityType.Playing,
            },
          ],
        });
      }

      setInterval(async () => {
        const guilds = (this.client.shard?.count ?? 0) > 1
          ? await this.client.shard!.fetchClientValues("guilds.cache.size")
            .then((results) => (results as number[]).reduce((a, c) => a + c, 0))
          : this.client.guilds.cache.size;
        this.client.user?.setPresence({
          afk: false,
          status: "online",
          activities: [
            {
              name: `${guilds.toLocaleString()} Servers`,
              type: ActivityType.Watching,
            },
          ],
        });
      }, 60000);

      loadItems(this.client);
      loadCommands(this.client);
      sendPendingLogs(this.client);
    });
  }
}
