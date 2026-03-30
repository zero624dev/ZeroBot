import {
  ButtonStyle,
  ComponentType,
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
  type Locale,
} from "discord.js";
import { SubCommand, type Command } from "../../../core/types";
import { MathUtils } from "../../../core/utils/utils";
import { getUser, setUser } from "../../../addons/database/repository/GameRepo";
import { KOREANBOTS_TOKEN, colors } from "../../../config";

export interface IScripts {
  please_vote: string;
  vote_and_retry: string;
  user_comp_reward: (username: string) => string;
  one_per_12h: string;
  balance: string;
}

export default class Comp extends SubCommand {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      please_vote: "하트를 눌러주세요",
      vote_and_retry: "하트를 누른 후 다시 명령어를 실행해주세요.",
      user_comp_reward: (username) => `${username}님의 출석 보상`,
      one_per_12h: "12시간마다 한 번씩 받을 수 있습니다.",
      balance: "잔고",
    },
    "en-US": {
      please_vote: "Please Press the Heart",
      vote_and_retry: "Please vote and try again.",
      user_comp_reward: (username) => `${username}'s Comp Reward`,
      one_per_12h: "You can receive it once every 12 hours.",
      balance: "Balance",
    },
  };

  rewardRange: [number, number] = [50_000, 100_000];
  headers: any;

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "comp",
      description: "Takes the reward for comp.",
      nameLocalizations: {
        ko: "출석",
      },
      descriptionLocalizations: {
        ko: "출석 보상을 받아요.",
      },
    }, {
      cooldown: 1000 * 5,
    });
    this.headers = {
      "Authorization": KOREANBOTS_TOKEN,
      "Content-Type": "application/json",
    };
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>((resolve, reject) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

      interaction.deferReply().then(() => {
        fetch(`https://koreanbots.dev/api/v2/bots/${this.client.user!.id}/vote?userID=${interaction.user.id}`, {
          headers: this.headers,
        }).then((res) => {
          return res.json();
        }).then(({ data }: any) => {
          if (!data.lastVote) {
            return resolve({
              embeds: [
                {
                  title: scripts.please_vote,
                  description: scripts.vote_and_retry,
                  url: `https://koreanbots.dev/bots/${this.client.user!.id}/vote`,
                  image: {
                    url: "https://cdn.discordapp.com/attachments/843156045865418752/848215715239690290/comp.gif",
                  },
                  color: colors.error,
                },
              ],
              components: [
                {
                  type: ComponentType.ActionRow,
                  components: [
                    {
                      type: ComponentType.Button,
                      style: ButtonStyle.Link,
                      emoji: "💖",
                      url: `https://koreanbots.dev/bots/${this.client.user!.id}/vote`,
                    },
                  ],
                },
              ], flags: ["Ephemeral"],
            });
          }

          getUser(interaction.user.id, ["lastVote", "wallet"]).then((res) => {
            return { lastVote: 0, wallet: 0, ...(res ?? {}) };
          }).then((userData) => {
            if (data.voted) {
              if (data.lastVote != userData.lastVote) {
                const reward = MathUtils.randomRange(...this.rewardRange);
                setUser(interaction.user.id, {
                  lastVote: data.lastVote,
                  $inc: { wallet: reward },
                }, true).then(() => {
                  resolve({
                    embeds: [
                      {
                        title: scripts.user_comp_reward(interaction.user.tag),
                        fields: [
                          {
                            name: scripts.balance,
                            value: `${(userData.wallet + reward).toLocaleString(interaction.locale)} (+${reward.toLocaleString(interaction.locale)})`,
                            inline: true,
                          },
                        ],
                        color: colors.accent,
                      },
                    ],
                  });
                }).catch(reject);
              } else {
                resolve({
                  embeds: [
                    {
                      title: scripts.one_per_12h,
                      description: `<t:${Math.round((43200000 + userData.lastVote) / 1000)}:R>`,
                      color: colors.error,
                    },
                  ], flags: ["Ephemeral"],
                });
              }
            } else {
              resolve({
                embeds: [
                  {
                    title: scripts.please_vote,
                    description: scripts.vote_and_retry,
                    url: `https://koreanbots.dev/bots/${this.client.user!.id}/vote`,
                    image: {
                      url: "https://cdn.discordapp.com/attachments/843156045865418752/848215715239690290/comp.gif",
                    },
                    color: colors.error,
                  },
                ],
                components: [
                  {
                    type: ComponentType.ActionRow,
                    components: [
                      {
                        type: ComponentType.Button,
                        style: ButtonStyle.Link,
                        emoji: "💖",
                        url: `https://koreanbots.dev/bots/${this.client.user!.id}/vote`,
                      },
                    ],
                  },
                ], flags: ["Ephemeral"],
              });
            }
          }).catch(reject);
        }).catch(reject);
      }).catch(reject);
    });
  }
}
