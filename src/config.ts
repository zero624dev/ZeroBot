const MONGO_USER = encodeURIComponent(process.env["MONGO_USER"] || "");
const MONGO_PASS = encodeURIComponent(process.env["MONGO_PASS"] || "");
export const MONGODB_URI = (MONGO_USER && MONGO_PASS)
  ? `mongodb://${MONGO_USER}:${MONGO_PASS}@${process.env["MONGO_HOST"]}:${
    process.env["MONGO_PORT"]}/${process.env["MONGO_NAME"]}?${process.env["MONGO_OPTIONS"] || ""}`
  : `mongodb://${process.env["MONGO_HOST"]}:${
    process.env["MONGO_PORT"]}/${process.env["MONGO_NAME"]}?${process.env["MONGO_OPTIONS"] || ""}`;

export const PREFIX = process.env["PREFIX"] || "0";
export const LOGGING_CHANNEL_ID = process.env["LOGGING_CHANNEL_ID"] || "1146865229955874967";
export const SUPPORT_GUILD_ID = process.env["SUPPORT_GUILD_ID"] || "678566031874064394";

export const DISCORD_TOKEN = process.env["DISCORD_TOKEN"];
export const OSU_TOKEN = process.env["OSU_TOKEN"];
export const NEIS_TOKEN = process.env["NEIS_TOKEN"];
export const GOOGLEAPIS_TOKEN = process.env["GOOGLEAPIS_TOKEN"];
export const DEEPL_TOKEN = process.env["DEEPL_TOKEN"];
export const KOREANBOTS_TOKEN = process.env["KOREANBOTS_TOKEN"];

export const colors = Object.freeze({
  accent: 0x00007FFF,
  error: 0xEE2C2C,
  warn: 0xFFCC00,
});
