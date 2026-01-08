import { Shard, ShardingManager } from "discord.js";
import { DISCORD_TOKEN } from "./config";
import fs from "fs";

if (process.env["pm_out_log_path"]) {
  fs.writeFileSync(process.env["pm_out_log_path"], "");
}

const manager = new ShardingManager(`${import.meta.dir}/bot.ts`, {
  totalShards: "auto",
  token: DISCORD_TOKEN,
  mode: "process",
});

manager.on("shardCreate", (shard: Shard) => {
  console.log(`Shard ${shard.id} launched`);
});

manager.spawn();
