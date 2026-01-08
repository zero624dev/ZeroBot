import {
    Collection,
    type SelectMenuComponentOptionData,
    Client
} from "discord.js";
import { decodeUnicodeToDecimalButString, encodeDecimalToUnicode } from "./number";
import { commands } from "../cache";
import { Command, SubCommand } from "../types";

interface MessageSelectMenuPageOptions<T> {
    language?: string;
    contentSize?: number;
    page?: number;
    data: T[] | Collection<string, T>;
    format(value: T, index: number, array: T[]): SelectMenuComponentOptionData;
}

export function getMenuOptionPage<T>({ format, data, page = 1, contentSize = 25 }: MessageSelectMenuPageOptions<T>) {
    if (data instanceof Collection) {
        data = Array.from(data.values());
    }

    const max = Math.ceil(Math.max((data.length - contentSize) / (contentSize - 2), 0)) + 1, options: SelectMenuComponentOptionData[] = [];
    if (max == 1) {
        options.push(
            ...data.map(format)
        );
    } else if (max == page) {
        options.push({
            label: `${page - 1}p`,
            value: `${page - 1}p`,
            emoji: "⬅️"
        });
        options.push(
            ...data.slice(1 - contentSize - data.length + contentSize + (contentSize - 2) * (max - 1)).map(format)
        );
    } else {
        if (page != 1) {
            options.push({
                label: `${page - 1}p`,
                value: `${page - 1}p`,
                emoji: "⬅️"
            });
        }
        options.push(
            ...data.slice(contentSize - (page == 1 ? 2 : 1) + (contentSize - 2) * (page - 2), contentSize - 1 + (contentSize - 2) * (page - 1)).map(format)
        );
        options.push({
            label: `${page + 1}p`,
            value: `${page + 1}p`,
            emoji: "➡️"
        });
    }
    return options;
}

export function getArgsFromCustomId(customId: string): (number | string)[] {
    return customId.split("|").map(arg => {
        if (/[\u2710-\uC34F]/.test(arg)) { // 유니코드 10000에서 49999 사이의 문자들은 숫자로 변환
            return Number(decodeUnicodeToDecimalButString(arg));
        }
        if (/^\d+$/.test(arg)) {
            return Number(arg);
        }
        return arg;
    });
}

type CreateCustomIdOptions = {
    args: (number | string)[];
    userId?: string;
    command: Command | SubCommand;
};

export function createCustomId({ args, userId, command }: CreateCustomIdOptions): string {
    if (command instanceof SubCommand) {
        if (command.subcommandGroup)
            args.unshift(`${command.subcommandGroup} ${command.parent.data.name}`);
        else
            args.unshift(command.parent.data.name);
    }
    args.unshift(command.data.name);
    args.unshift(userId ?? '');
    return args.map(arg => {
        if (typeof arg === "number") {
            return encodeDecimalToUnicode(arg);
        }
        if (/^\d+$/.test(arg)) {
            return encodeDecimalToUnicode(Number(arg));
        }
        return arg;
    }).join("|");
}


export function mentionCommand(client: Client, cmd: string, subcmdgroup?: string, subcmd?: string) {
    const command = commands.get(cmd);
    const id = client.application?.commands.cache.find(c => c.name == command?.data.name)?.id;
    if (!id) return `\`/${[cmd, subcmdgroup, subcmd].filter(f => f).join(" ")}\``;
    return `</${[cmd, subcmdgroup, subcmd].filter(f => f).join(" ")}:${id}>`;
}

export * as StringUtils from "./string";
export * as MathUtils from "./math";
export * as NumberUtils from "./number";
export * as default from "./utils";
