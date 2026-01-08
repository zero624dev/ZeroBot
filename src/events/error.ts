import {
    type Client
} from "discord.js";
import { ClientEvent } from "../core/types";
import { sendLog } from "../core/logger";
import { StringUtils } from "../core/utils/utils"
import { colors } from "../config";

export default class Error extends ClientEvent<"error"> {
    constructor(client: Client) {
        super(client);
    }

    public run(err: any) {
        return new Promise<void>(() => {
            console.error(`${new Date().toUTCString()} Client Error:`, err.message);
            console.error(err.stack);

            sendLog(this.client, {
                embeds: [{
                    title: "Client Error",
                    description: `\`\`\`\n${StringUtils.ellipsis(`${err.message}\n${err.stack}`, 4000)}\n\`\`\``,
                    color: colors.error
                }]
            });
        });
    }
}