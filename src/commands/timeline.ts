import {
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  User,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
  ApplicationCommandType,
  type InteractionReplyOptions,
  type InteractionUpdateOptions,
  type Locale,
  type Client,
} from "discord.js";
import { Command } from "../core/types";
import { getMenuOptionPage } from "../core/utils/utils";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import type { IPresence } from "../addons/database/models/Presence";
import { colors } from "../config";
import { getPresenceByDate, getPresenceLatestDate } from "../addons/database/repository/PresenceRepo";

export interface IScripts {
  user_timeline: (username: string) => string;
  online: string;
  idle: string;
  dnd: string;
  offline: string;
}

export default class Timeline extends Command {
  color = [
    { r: 95, g: 103, b: 113 }, // offline
    { r: 250, g: 166, b: 26 }, // idle
    { r: 67, g: 181, b: 129 }, // online
    { r: 240, g: 71, b: 71 }, // dnd
  ];

  coverImage: Buffer;
  maskImage: Buffer;

  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      user_timeline: (username: string) => `${username}님의 타임라인`,
      online: "온라인",
      idle: "자리비움",
      dnd: "방해금지",
      offline: "오프라인",
    },
    "en-US": {
      user_timeline: (username: string) => `${username}'s timeline`,
      online: "Online",
      idle: "Idle",
      dnd: "Do not disturb",
      offline: "Offline",
    },
  };

  constructor(client: Client) {
    super(client, {
      name: "timeline",
      description: "Shows your Discord timeline.",
      nameLocalizations: {
        ko: "타임라인",
      },
      descriptionLocalizations: {
        ko: "디스코드 타임라인을 보여줍니다.",
      },
      type: ApplicationCommandType.ChatInput,
    }, {
      cooldown: 1000 * 5,
      registrationRequired: true,
    });

    this.coverImage = fs.readFileSync(path.join(import.meta.dir, "../media/images/image.svg"));
    this.maskImage = Buffer.from("<svg><rect x=\"0\" y=\"0\" width=\"456\" height=\"25\" rx=\"5\" ry=\"5\"/></svg>");
  }

  chatInput(interaction: ChatInputCommandInteraction<"cached">) {
    return new Promise<InteractionReplyOptions>((resolve, reject) => {
      const startTime = this.getKSTMidnight();
      interaction.deferReply().then(() => {
        this.getTimlineMessage(interaction.locale, interaction.options.getUser("user") ?? interaction.user, startTime).then(resolve).catch(reject);
      });
    });
  }

  button(interaction: ButtonInteraction<"cached">, args: string[]) {
    return new Promise<InteractionUpdateOptions>((resolve, reject) => {
      interaction.deferUpdate().then(() => {
        if (args[0] == "date") {
          getPresenceLatestDate(interaction.user.id).then((from) => {
            const now = new Date(Date.now() + 32400000);
            const monthDiff = (now.getUTCFullYear() - from.getUTCFullYear()) * 12 + (now.getUTCMonth() - from.getUTCMonth());
            const cur = new Date(((interaction.message.components[0] as any).components[1] as any).label);
            const curMonthDiff = (cur.getUTCFullYear() - from.getUTCFullYear()) * 12 + (cur.getUTCMonth() - from.getUTCMonth());
            const curYear = cur.getFullYear();
            const curMonth = cur.getMonth() + 1;
            const curDate = cur.getDate();
            this.updateDateSelector({
              interaction, monthDiff, curMonthDiff, curDate, from, datePage: (curDate > 24 ? 2 : 1), startDate: 1,
              curYear, curMonth, maxDate: monthDiff - curMonthDiff > 0 ? new Date(curYear, curMonth, 0).getDate() : now.getDate(),
              monthPage: Math.ceil(Math.max((curMonthDiff - 24) / 23, 0)) + 1,
            });
          }).catch(reject);
        } else {
          let startTime: number, endTime: number;
          if (args[0] == "yday") {
            endTime = new Date(((interaction.message.components[0] as any).components[1] as any).label).getTime() - 32400000;
            startTime = endTime - 8.64e+7;
          } else {
            startTime = new Date(((interaction.message.components[0] as any).components[1] as any).label).getTime() - 32400000 + 8.64e+7;
            endTime = startTime + 8.64e+7;
          }
          this.getTimlineMessage(interaction.locale, interaction.user, new Date(startTime), new Date(Math.min(Date.now(), endTime))).then(resolve).catch(reject);
        }
      });
    });
  }

  stringSelect(interaction: StringSelectMenuInteraction<"cached">, args: string[]) {
    return new Promise<InteractionUpdateOptions>((resolve, reject) => {
      interaction.deferUpdate().then(() => {
        const now = new Date(Date.now() + 32400000);
        if (args[0] == "selectMonth") {
          const value = (interaction as any).values[0];
          getPresenceLatestDate(interaction.user.id).then((from) => {
            const monthDiff = (now.getUTCFullYear() - from.getUTCFullYear()) * 12 + (now.getUTCMonth() - from.getUTCMonth());
            if (value.endsWith("p")) {
              resolve({
                components: [
                  {
                    type: ComponentType.ActionRow,
                    components: [
                      {
                        type: ComponentType.StringSelect,
                        customId: `${interaction.user.id}|${this.data.name}|selectMonth`,
                        options: getMenuOptionPage(
                          {
                            data: new Array(monthDiff + 1).fill(0).map((_, i) => i),
                            format: (index: number) => {
                              let y = from.getUTCFullYear(), m = from.getUTCMonth() + 1 + index;
                              if (m > 12) {
                                y += Math.floor(m / 12);
                                m %= 12;
                              }
                              return {
                                label: new Date(y, m - 1).toLocaleDateString(interaction.locale, { month: "long", year: "numeric" }),
                                value: `${y}|${m}`,
                              };
                            }, page: Number(value.slice(0, -1)),
                          },
                        ),
                      },
                    ],
                  },
                  {
                    type: ComponentType.ActionRow,
                    components: [
                      {
                        type: ComponentType.StringSelect,
                        customId: "disabled",
                        options: [
                          {
                            label: "dummy",
                            value: "dummy",
                          },
                        ],
                        disabled: true,
                      },
                    ],
                  },
                ],
              });
            } else {
              const [curYear, curMonth] = value.split("|");
              const dayOfWeek = new Date(curYear, Number(curMonth) - 1, 1);
              const curMonthDiff = (dayOfWeek.getUTCFullYear() - from.getUTCFullYear()) * 12 + (dayOfWeek.getUTCMonth() - from.getUTCMonth());
              this.updateDateSelector({
                interaction, monthDiff, curMonthDiff, curDate: 0, from, datePage: 1, startDate: curMonthDiff < 1 ? new Date(from.getTime() + 32400000).getDate() : 1,
                curYear, curMonth, maxDate: monthDiff - curMonthDiff > 0 ? new Date(curYear, curMonth, 0).getDate() : now.getDate(),
                monthPage: Math.ceil(Math.max((curMonthDiff - 24) / 23, 0)) + 1,
              });
            }
          }).catch(reject);
        } else if (args[0] == "selectDate") {
          getPresenceLatestDate(interaction.user.id).then((from) => {
            const tarYear = Number(args[1]);
            const tarMonth = Number(args[2]);
            const value = (interaction as any).values[0];
            const fromMonthDiff = (tarYear - from.getUTCFullYear()) * 12 + (tarMonth - 1 - from.getUTCMonth());
            const startDate = fromMonthDiff < 1 ? new Date(from.getTime() + 32400000).getDate() : 1;
            if (value.endsWith("p")) {
              const nowMonthDiff = (now.getUTCFullYear() - tarYear) * 12 + (now.getUTCMonth() - tarMonth + 1);
              resolve({
                components: [
                  interaction.message.components[0],
                  {
                    type: ComponentType.ActionRow,
                    components: [
                      {
                        type: ComponentType.StringSelect,
                        customId: `${interaction.user.id}|${this.data.name}|selectDate|${tarYear}|${tarMonth}`,
                        options: getMenuOptionPage(
                          {
                            data: new Array((nowMonthDiff > 0 ? new Date(tarYear, tarMonth, 0).getDate() : now.getDate()) - startDate + 1).fill(0).map((_, i) => i + startDate),
                            format: (date: number) => {
                              return {
                                label: new Date(tarYear, tarMonth - 1, date).toLocaleDateString(interaction.locale, { weekday: "short", day: "2-digit" }),
                                value: `${date}`,
                              };
                            }, page: Number(value.slice(0, -1)),
                          },
                        ),
                      },
                    ],
                  },
                ],
              });
            } else {
              const startTime = new Date(new Date(tarYear, tarMonth - 1, value).getTime() - 32400000);
              this.getTimlineMessage(interaction.locale, interaction.user, startTime, new Date(Math.min(Date.now(), startTime.getTime() + 8.64e+7))).then(resolve).catch(reject);
            }
          }).catch(reject);
        }
      });
    });
  }

  updateDateSelector({ interaction, monthDiff, curMonthDiff, startDate, maxDate, curDate, from, datePage, monthPage, curYear, curMonth }: any) {
    interaction.editReply({
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.StringSelect,
              customId: `${interaction.user.id}|${this.data.name}|selectMonth`,
              options: getMenuOptionPage(
                {
                  data: new Array(monthDiff + 1).fill(0).map((_, i) => i),
                  format: (index: number) => {
                    let y = from.getUTCFullYear(), m = from.getUTCMonth() + 1 + index;
                    if (m > 12) {
                      y += Math.floor(m / 12);
                      m %= 12;
                    }
                    return {
                      label: new Date(y, m - 1).toLocaleDateString(interaction.locale, { month: "long", year: "numeric" }),
                      value: `${y}|${m}`,
                      default: curMonthDiff == index,
                    };
                  }, page: monthPage,
                },
              ),
            },
          ],
        },
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.StringSelect,
              customId: `${interaction.user.id}|${this.data.name}|selectDate|${curYear}|${curMonth}`,
              options: getMenuOptionPage(
                {
                  data: new Array(maxDate - startDate + 1).fill(0).map((_, i) => i + startDate),
                  format: (date: number) => {
                    return {
                      label: new Date(curYear, curMonth - 1, date).toLocaleDateString(interaction.locale, { weekday: "short", day: "2-digit" }),
                      value: `${date}`,
                      default: date == curDate,
                    };
                  }, page: datePage,
                },
              ),
            },
          ],
        },
      ],
    });
  }

  getTimlineMessage(locale: Locale, user: User, startTime: Date, endTime = (new Date())) {
    return new Promise<InteractionReplyOptions & InteractionUpdateOptions>(async (resolve, reject) => {
      const scripts = this.scripts[locale] ?? this.scripts["en-US"]!;

      let existPrev = false;
      getPresenceByDate(user.id, startTime, endTime).then((result) => {
        result.items = (result.items as any[]).filter((value, index, array) => {
          return index === 0
            || Math.max(
              value.status & 0b11,
              (value.status >> 2) & 0b11,
              (value.status >> 4) & 0b11,
            ) !== Math.max(
              array[index - 1].status & 0b11,
              (array[index - 1].status >> 2) & 0b11,
              (array[index - 1].status >> 4) & 0b11,
            );
        });
        if (!result.items.length && result.lastItem.length) {
          result.items.push({ ...result.lastItem[0], timestamp: startTime } as IPresence);
        }
        if (result.firstItem.length) {
          existPrev = true;
          result.items.unshift({ ...result.firstItem[0], timestamp: startTime } as IPresence);
        }
        this.getTimelineImage(result.items, startTime, endTime).then(({ attachment, totalHours }) => {
          resolve({
            embeds: [
              {
                author: {
                  name: user.tag,
                  icon_url: user.displayAvatarURL({ size: 2048 }),
                },
                fields: [
                  {
                    name: `<:online:1219186855690375241> ${scripts.online}`,
                    value: this.formatDuration(totalHours[2] / 1000, locale),
                    inline: false,
                  },
                  {
                    name: `<:idle:1219183950115639316> ${scripts.idle}`,
                    value: this.formatDuration(totalHours[1] / 1000, locale),
                    inline: false,
                  },
                  {
                    name: `<:dnd:1219187323481100389> ${scripts.dnd}`,
                    value: this.formatDuration(totalHours[3] / 1000, locale),
                    inline: false,
                  },
                  {
                    name: `<:offline:1219187156321308692> ${scripts.offline}`,
                    value: this.formatDuration(totalHours[0] / 1000, locale),
                    inline: false,
                  },
                ].filter(({ value }) => value),
                image: { url: "attachment://timeline.png" },
                color: colors.accent,
              },
            ],
            components: [
              {
                type: ComponentType.ActionRow,
                components: [
                  {
                    type: ComponentType.Button,
                    emoji: "⬅️",
                    style: ButtonStyle.Primary,
                    customId: `${user.id}|${this.data.name}|yday`,
                    disabled: !existPrev,
                  },
                  {
                    type: ComponentType.Button,
                    label: new Date(startTime).toLocaleDateString(locale, {
                      timeZone: "Asia/Seoul",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }),
                    style: ButtonStyle.Secondary,
                    customId: `${user.id}|${this.data.name}|date`,
                  },
                  {
                    type: ComponentType.Button,
                    emoji: "➡️",
                    style: ButtonStyle.Primary,
                    customId: `${user.id}|${this.data.name}|tmr`,
                    disabled: startTime.getTime() == this.getKSTMidnight().getTime(),
                  },
                ],
              },
            ],
            files: [
              {
                attachment, name: "timeline.png",
              },
            ],
          });
        }).catch(reject);
      }).catch(reject);
    });
  }

  getTimelineImage(timeline: IPresence[], startTime: Date, endTime = (new Date())) {
    return new Promise<{
      attachment: Buffer;
      totalHours: number[];
    }>((resolve, reject) => {
      try {
        const totalHours = [0, 0, 0, 0];
        const previewComposite: sharp.OverlayOptions[] = [];
        const composite: sharp.OverlayOptions[] = [];

        for (let i = 0; i < timeline.length; i++) {
          const time = (timeline[i + 1]?.timestamp ?? endTime).getTime() - timeline[i].timestamp.getTime();
          const status = Math.max(
            timeline[i].status & 0b11,
            (timeline[i].status >> 2) & 0b11,
            (timeline[i].status >> 4) & 0b11,
          );
          totalHours[status] += time;

          const color = this.color[status];

          previewComposite.push({
            input: {
              create: {
                width: Math.max(Math.ceil(456 / 86400000 * time), 1),
                height: 25,
                channels: 3,
                background: color,
              },
            },
            left: Math.round(456 / 86400000 * (timeline[i].timestamp.getTime() - startTime.getTime())),
            top: 0,
          });

          const h1 = Math.floor((timeline[i].timestamp.getTime() - startTime.getTime()) / 3600000),
            h2 = Math.floor(((timeline[i + 1]?.timestamp ?? endTime).getTime() - startTime.getTime()) / 3600000);

          const start = Math.round(0.0001 * ((timeline[i].timestamp.getTime() - startTime.getTime()) % 3600000));
          if (h1 == h2) {
            const size = Math.ceil(0.0001 * (((timeline[i + 1]?.timestamp ?? endTime).getTime() - startTime.getTime()) % 3600000) - start);
            composite.push({
              input: {
                create: {
                  width: 18,
                  height: Math.max(size, 1),
                  channels: 3,
                  background: color,
                },
              },
              left: 30 + 18 * h1,
              top: 443 - size - start,
            });
          } else {
            composite.push({
              input: {
                create: {
                  width: 18,
                  height: Math.max(360 - start, 1),
                  channels: 3,
                  background: color,
                },
              },
              left: 30 + 18 * h1,
              top: 83,
            });
            for (let j = 1; j < h2 - h1; j++) {
              composite.push({
                input: {
                  create: {
                    width: 18,
                    height: 360,
                    channels: 3,
                    background: color,
                  },
                },
                left: 30 + 18 * (h1 + j),
                top: 83,
              });
            }
            const size = Math.ceil(0.0001 * (((timeline[i + 1]?.timestamp ?? endTime).getTime() - startTime.getTime()) % 3600000));
            if (size > 0)
              composite.push({
                input: {
                  create: {
                    width: 18,
                    height: size,
                    channels: 3,
                    background: color,
                  },
                },
                left: 30 + 18 * h2,
                top: 443 - size,
              });
          }
        }

        sharp({
          create: {
            width: 456,
            height: 25,
            channels: 3,
            background: { r: 51, g: 51, b: 51 },
          },
        }).composite([...previewComposite, {
          input: this.maskImage,
          blend: "dest-in",
        }]).png().toBuffer().then((preview) => {
          sharp({
            create: {
              width: 480,
              height: 480,
              channels: 3,
              background: { r: 24, g: 24, b: 24 },
            },
          }).composite([
            ...composite,
            {
              input: preview,
              left: 11,
              top: 23,
            },
            {
              input: this.coverImage,
            },
          ]).png().toBuffer().then((res) => {
            resolve({ attachment: res, totalHours: totalHours });
          }).catch(reject);
        }).catch(reject);
      } catch (e) {
        reject(e);
      }
    });
  }

  private formatDuration(sec: number, locale: Locale) {
    return new (Intl as any).DurationFormat(locale, { style: "long" }).format({
      hours: Math.floor((sec % 86400) / 3600),
      minutes: Math.floor((sec % 3600) / 60),
      seconds: Math.floor(sec % 60),
    });
  }

  private getKSTMidnight() {
    const KST_OFFSET = 32400000; // 9시간
    const now = new Date();
    const utcMidnight = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0,
    );
    return new Date(utcMidnight - KST_OFFSET);
  }
}
