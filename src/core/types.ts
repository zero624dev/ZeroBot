import type {
    User,
    ButtonInteraction,
    ModalSubmitInteraction,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    StringSelectMenuInteraction,
    UserContextMenuCommandInteraction,
    ApplicationCommandData,
    InteractionReplyOptions,
    InteractionUpdateOptions,
    ApplicationCommandOptionChoiceData,
    ApplicationCommandOptionData,
    ClientEvents,
    MessageContextMenuCommandInteraction,
    InteractionEditReplyOptions,
    PermissionResolvable,
    Client
} from "discord.js";
import {
    Collection
} from "discord.js";

export type CommandOptions = {
    guilds?: string[];
    whitelist?: string[];
    permissions?: PermissionResolvable[];
    cooldown?: number;
    registrationRequired?: boolean;
    subcommandRequired?: boolean;
}

export type SubCommandOptions = Omit<CommandOptions, "subcommandRequired">;

class Base {
    client: Client;
    cooldowns?: Collection<string, number>;
    constructor(client: Client) {
        this.client = client;
    }
    public messageContextMenu?(interaction: MessageContextMenuCommandInteraction): Promise<InteractionReplyOptions | InteractionEditReplyOptions>;
    public userContextMenu?(interaction: UserContextMenuCommandInteraction): Promise<InteractionReplyOptions | InteractionEditReplyOptions>;
    public chatInput?(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | InteractionEditReplyOptions>;
    public button?(interaction: ButtonInteraction, args: string[]): Promise<InteractionUpdateOptions>;
    public modalSubmit?(interaction: ModalSubmitInteraction, args: string[]): Promise<InteractionReplyOptions | InteractionEditReplyOptions>;
    public stringSelect?(interaction: StringSelectMenuInteraction, args: string[]): Promise<InteractionUpdateOptions>;
    public autocomplete?(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[]>;
}

export abstract class Command extends Base {
    data: ApplicationCommandData;
    options: CommandOptions;
    subcommands?: Collection<string, SubCommand>;
    constructor(client: Client, data: ApplicationCommandData, options?: CommandOptions) {
        super(client);
        this.data = data;
        this.options = options ?? {};
        if (options?.cooldown) {
            this.cooldowns = new Collection<string, number>();
        }
        if (options?.subcommandRequired) {
            this.subcommands = new Collection<string, SubCommand>();
        }
    }
}

export abstract class SubCommand extends Base {
    data: ApplicationCommandOptionData;
    options?: CommandOptions;
    parent: Command;
    subcommandGroup?: string;
    constructor(parent: Command, data: ApplicationCommandOptionData, options?: SubCommandOptions) {
        super(parent.client);
        this.parent = parent;
        this.data = data;
        this.options = options;
        if (options?.cooldown) {
            this.cooldowns = new Collection<string, number>();
        }
    }
}

export abstract class ClientEvent<T extends keyof ClientEvents> {
    client: Client;
    func: "on" | "once";
    constructor(client: Client, func: "on" | "once" = "on") {
        this.client = client;
        this.func = func;
    }
    public abstract run(...args: ClientEvents[T]): Promise<void>;
}

export interface ISnipeMessage {
    author: User;
    channelId: string
    content: string
    createdAt: Date
    editedAt?: Date;
    reference?: string;
}