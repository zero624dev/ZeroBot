import {
  ComponentType,
  ButtonStyle,
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
  type Locale,
  type StringSelectMenuInteraction,
  type InteractionUpdateOptions,
  type User,
  type ButtonInteraction,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";
import { getUser } from "../../../../addons/database/repository/UserRepo";
import { getMenuOptionPage, mentionCommand } from "../../../../core/utils/utils";
import { colors, NEIS_TOKEN } from "../../../../config";

export interface IScripts {
}

export default class extends SubCommand {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
    },
    "en-US": {
    },
  };

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "meal",
      description: "Shows meal information.",
      nameLocalizations: {
        ko: "급식",
      },
      descriptionLocalizations: {
        ko: "급식 정보를 보여줘요.",
      },
      options: [{
        type: ApplicationCommandOptionType.String,
        name: "school",
        description: "School name to check meal.",
        nameLocalizations: {
          ko: "학교",
        },
        descriptionLocalizations: {
          ko: "급식을 확인할 학교 이름.",
        },
        required: false,
        autocomplete: true,
      }],
    });
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>((resolve, reject) => {
      interaction.deferReply().then(() => {
        const school = interaction.options.getString("school");

        if (school) {
          if (/^.{1,}\|.{1,}$/.test(school)) {
            this.getMealInfo(interaction.user, new Date(Date.now() + 32400000), school.split("|"), true).then(resolve).catch(reject);
          } else {
            fetch(
              `https://open.neis.go.kr/hub/schoolInfo?KEY=${NEIS_TOKEN}&Type=json&SCHUL_NM=${encodeURI(school)}`,
            ).then((res) => res.json()).then((data: any) => {
              const target = data.schoolInfo?.[1]?.row?.[0];
              if (!target) {
                return resolve({
                  embeds: [{
                    title: "학교를 찾을 수 없어요.",
                    description: "다른 이름으로 다시 시도해보세요.",
                    color: colors.error,
                  }],
                });
              }
              this.getMealInfo(interaction.user, new Date(Date.now() + 32400000), [target.ATPT_OFCDC_SC_CODE, target.SD_SCHUL_CODE], true).then(resolve).catch(reject);
            }).catch(reject);
          }
        } else {
          getUser(interaction.user.id, "school").then((sch) => sch?.code).then((code) => {
            if (!code) {
              return resolve({
                embeds: [
                  {
                    title: "설정된 학교 정보가 없습니다.",
                    description: `아래 명령어로 학교를 설정해주세요.\n${mentionCommand(this.client, "account", "settings")}`,
                    color: colors.error,
                  },
                ],
              });
            }
            this.getMealInfo(interaction.user, new Date(Date.now() + 32400000), code).then(resolve).catch(reject);
          });
        }
      });
    });
  }

  button(interaction: ButtonInteraction, args: string[]) {
    return new Promise<InteractionUpdateOptions>(async (resolve, reject) => {
      await interaction.deferUpdate().catch(reject);
      if (args[0] == "D") {
        const cur = new Date(Number(args[1]));
        const curMonth = cur.getMonth() + 1;
        const curDate = cur.getDate();
        const maxDate = new Date(new Date().getFullYear(), curMonth, 0).getDate();
        const dayOfWeek = new Date(new Date().getFullYear(), curMonth - 1, 1);
        resolve({
          components: [
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.StringSelect,
                  customId: `${interaction.user.id}|utility|school meal|selMon${args.length > 3 ? `|${args.slice(3).join("|")}` : ""}`,
                  placeholder: "월을 선택해주세요.",
                  options: new Array(12).fill(0).map((_, i) => ({
                    label: `${i + 1}월`,
                    value: `${i + 1}`,
                    default: i + 1 == curMonth,
                  })),
                },
              ],
            },
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.StringSelect,
                  customId: `${interaction.user.id}|utility|school meal|selDat|${curMonth}${args.length > 3 ? `|${args.slice(3).join("|")}` : ""}`,
                  placeholder: "일을 선택해주세요.",
                  options: getMenuOptionPage(
                    {
                      data: new Array(maxDate).fill(0).map((_, i) => i + 1),
                      format: (date: number) => {
                        dayOfWeek.setDate(date);
                        return {
                          label: dayOfWeek.toLocaleDateString("ko-KR", { day: "numeric", weekday: "short" }),
                          value: `${date}`,
                          default: date == curDate,
                        };
                      }, page: (curDate > 24 ? 2 : 1),
                    },
                  ),
                },
              ],
            },
          ],
        });
      } else {
        const timebyms = Number(args[1]) + (args[0] == "+" ? 86400000 : -86400000), KST = new Date(timebyms),
          schCode = args.length > 2 ? args.slice(2) : await getUser(interaction.user.id, "school").then((sch) => sch?.code);
        this.getMealInfo(interaction.user, KST, schCode!, args.length > 2).then(resolve).catch(reject);
      }
    });
  }

  stringSelect(interaction: StringSelectMenuInteraction<"cached">, args: string[]) {
    return new Promise<InteractionUpdateOptions>(async (resolve, reject) => {
      await interaction.deferUpdate().catch(reject);
      if (args[0] == "selMon") {
        const select = Number(interaction.values[0]);
        const maxDate = new Date(new Date().getFullYear(), select, 0).getDate();
        const dayOfWeek = new Date(new Date().getFullYear(), select - 1, 1);
        resolve({
          components: [
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.StringSelect,
                  customId: `${interaction.user.id}|utility|school meal|selMon${args.length > 1 ? `|${args.slice(1).join("|")}` : ""}`,
                  placeholder: "월을 선택해주세요.",
                  options: new Array(12).fill(0).map((_, i) => ({
                    label: `${i + 1}월`,
                    value: `${i + 1}`,
                    default: i + 1 == select,
                  })),
                },
              ],
            },
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.StringSelect,
                  customId: `${interaction.user.id}|utility|school meal|selDat|${select}${args.length > 1 ? `|${args.slice(1).join("|")}` : ""}`,
                  placeholder: "일을 선택해주세요.",
                  options: getMenuOptionPage(
                    {
                      data: new Array(maxDate).fill(0).map((_, i) => i + 1),
                      format: (date: number) => {
                        dayOfWeek.setDate(date);
                        return {
                          label: dayOfWeek.toLocaleDateString("ko-KR", { day: "numeric", weekday: "short" }),
                          value: `${date}`,
                        };
                      },
                    },
                  ),
                },
              ],
            },
          ],
        });
      } else if (args[0] == "selDat") {
        const tarMonth = Number(args[1]);
        const maxDate = new Date(new Date().getFullYear(), tarMonth, 0).getDate();
        const value = interaction.values[0];
        const dayOfWeek = new Date(new Date().getFullYear(), tarMonth - 1, 1);
        if (value.endsWith("p")) {
          resolve({
            components: [
              {
                type: ComponentType.ActionRow,
                components: [
                  {
                    type: ComponentType.StringSelect,
                    customId: `${interaction.user.id}|utility|school meal|selMon${args.length > 2 ? `|${args.slice(2).join("|")}` : ""}`,
                    placeholder: "월을 선택해주세요.",
                    options: new Array(12).fill(0).map((_, i) => ({
                      label: `${i + 1}월`,
                      value: `${i + 1}`,
                      default: i + 1 == tarMonth,
                    })),
                  },
                ],
              },
              {
                type: ComponentType.ActionRow,
                components: [
                  {
                    type: ComponentType.StringSelect,
                    customId: `${interaction.user.id}|utility|school meal|selDat|${tarMonth}${args.length > 2 ? `|${args.slice(2).join("|")}` : ""}`,
                    placeholder: "일을 선택해주세요.",
                    options: getMenuOptionPage(
                      {
                        data: new Array(maxDate).fill(0).map((_, i) => i + 1),
                        format: (date: number) => {
                          dayOfWeek.setDate(date);
                          return {
                            label: dayOfWeek.toLocaleDateString("ko-KR", { day: "numeric", weekday: "short" }),
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
          const tarDate = Number(value),
            schCode = args.length > 2 ? args.slice(2) : await getUser(interaction.user.id, "school").then((sch) => sch?.code);
          this.getMealInfo(interaction.user, new Date(new Date().getFullYear(), tarMonth - 1, tarDate), schCode!, args.length > 2).then(resolve).catch(reject);
        }
      }
    });
  }

  private getSchoolName(schCode: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      fetch(`https://open.neis.go.kr/hub/schoolInfo?KEY=${NEIS_TOKEN}&Type=json&ATPT_OFCDC_SC_CODE=${schCode[0]}&SD_SCHUL_CODE=${schCode[1]}`)
        .then((res) => res.json()).then((data: any) => {
          data = data.schoolInfo?.[1]?.row?.[0]?.SCHUL_NM;
          resolve(data);
        }).catch(reject);
    });
  }

  private getMealInfo(user: User, date: Date, schCode: string[], showName?: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${NEIS_TOKEN}&Type=json&ATPT_OFCDC_SC_CODE=${schCode[0]}&SD_SCHUL_CODE=${schCode[1]}&MLSV_YMD=${this.dateformat(date.getFullYear(), date.getMonth() + 1, date.getDate())}`)
        .then((res) => res.json()).then((mealJSON: any) => {
          const row = mealJSON.mealServiceDietInfo?.[1]?.row ?? [],
            lunch = row.find((r: any) => r.MMEAL_SC_CODE == 2) ?? (!row.length ? {} : row.length < 3 ? row[0] : row[1]),
            suffix = `${date.getTime()}${showName ? `|${schCode.join("|")}` : ""}`;
          (showName ? lunch.SCHUL_NM ? Promise.resolve(lunch.SCHUL_NM) : this.getSchoolName(schCode) : Promise.resolve(`${user.tag}님의 학교`)).then((schoolName: string) => {
            if (!schoolName) {
              return resolve({
                embeds: [{
                  title: "학교를 찾을 수 없어요.",
                  description: "다른 이름으로 다시 시도해보세요.",
                  color: colors.error,
                }],
              });
            }
            resolve({
              embeds: [
                {
                  title: `${date.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })} ${schoolName} 급식`,
                  description: `\`\`\`${(lunch.DDISH_NM ?? "급식 정보를 가져오지 못했어요.").replaceAll("<br/>", "\n").replaceAll(/\(\d+(\.\d+)*\.?\)/g, "")}\`\`\``,
                  footer: { text: `Provided by open.neis.go.kr • ${lunch ? `${lunch.CAL_INFO} • ` : ""}${this.client.user?.username}` },
                  color: colors.accent,
                },
              ], components: [
                {
                  type: ComponentType.ActionRow,
                  components: [
                    {
                      type: ComponentType.Button,
                      label: "전날",
                      style: ButtonStyle.Primary,
                      customId: `${user.id}|utility|school meal|-|${suffix}`,
                    },
                    {
                      type: ComponentType.Button,
                      label: "날짜 선택",
                      style: ButtonStyle.Secondary,
                      customId: `${user.id}|utility|school meal|D|${suffix}`,
                    },
                    {
                      type: ComponentType.Button,
                      label: "다음날",
                      style: ButtonStyle.Primary,
                      customId: `${user.id}|utility|school meal|+|${suffix}`,
                    },
                  ],
                },
              ],
            });
          }).catch(reject);
        }).catch(reject);
    });
  }

  private dateformat(Y: number, M: number, D: number) {
    return `${new Array(4 - Y.toString().length).fill("0").join("")}${Y}${M < 10 ? "0" : ""}${M}${D < 10 ? "0" : ""}${D}`;
  }
}
