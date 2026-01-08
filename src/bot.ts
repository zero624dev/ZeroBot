import { ActivityType, Client, Options } from "discord.js";
import { loadEvents } from "./core/loader";
import "./addons/database";

import { DISCORD_TOKEN } from "./config";

const client = new Client({
  intents: [
    "Guilds", "GuildMessages", "MessageContent"
  ],
  presence: {
    afk: true,
    status: "idle",
    activities: [
      {
        name: "Loading...",
        type: ActivityType.Playing,
        url: "https://discord.gg/3w4aKhpUVy"
      }
    ]
  },
  sweepers: {
    ...Options.DefaultSweeperSettings,
    messages: {
      interval: 3_600, // Sweep messages every hour
      lifetime: 1_800, // Remove messages older than 30 minutes
    },
  },
});

loadEvents(client);

client.login(DISCORD_TOKEN);

process.on("uncaughtException", (err) => {
  console.error(`${new Date().toUTCString()} uncaughtException:`, err.message);
  console.error(err.stack);
});

export { client }
