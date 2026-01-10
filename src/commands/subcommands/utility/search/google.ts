import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ComponentType,
  ApplicationCommandOptionType,
  LimitedCollection,
  type ApplicationCommandOptionChoiceData,
  type InteractionReplyOptions,
  type Locale,
  type StringSelectMenuInteraction,
  type InteractionUpdateOptions,
} from "discord.js";
import { SubCommand, type Command } from "../../../../core/types";
import { StringUtils } from "../../../../core/utils/utils";
import { searchWithPages } from "google-sr";
import { colors } from "../../../../config";

export interface IScripts {
  google_search_for_query: (query: string) => string;
  no_result: string;
}

export default class extends SubCommand {
  scripts: Partial<Record<Locale, IScripts>> = {
    "ko": {
      google_search_for_query: (query: string) => `구글 "${query}" 검색 결과`,
      no_result: "결과가 없습니다",
    },
    "en-US": {
      google_search_for_query: (query: string) => `Google Search for "${query}"`,
      no_result: "There's no result",
    },
  };

  history = new LimitedCollection<string, any>({ maxSize: 100 });

  constructor(parent: Command) {
    super(parent, {
      type: ApplicationCommandOptionType.Subcommand,
      name: "google",
      description: "Google something.",
      nameLocalizations: {
        ko: "구글",
      },
      descriptionLocalizations: {
        ko: "검색어를 구글에 검색해요.",
      },
      options: [{
        type: ApplicationCommandOptionType.String,
        name: "query",
        description: "Search query.",
        nameLocalizations: {
          ko: "검색어",
        },
        descriptionLocalizations: {
          ko: "검색할 내용.",
        },
        maxLength: 98,
        required: true,
        autocomplete: true,
      }],
    });
  }

  chatInput(interaction: ChatInputCommandInteraction) {
    return new Promise<InteractionReplyOptions>((resolve, reject) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

      const splits = interaction.options.getString("query", true).split("|");
      const last = splits.pop() ?? "";
      let index = 0;
      if (/^\d$/.test(last)) {
        index = parseInt(last);
      } else {
        splits.push(last);
      }
      const query = splits.join("|");

      this.googleSearch(query).then((results) => {
        if (!results.length) {
          return resolve({
            embeds: [
              {
                author: { name: scripts.google_search_for_query(query), icon_url: "https://www.stickpng.com/assets/images/5a951939c4ffc33e8c148af2.png" },
                description: scripts.no_result,
                footer: { text: `Provided by Google APIs • ${this.client.user?.username}` },
                color: colors.accent,
              },
            ],
          });
        }
        const select = results[index];
        resolve({
          embeds: [
            {
              author: { name: scripts.google_search_for_query(query), icon_url: "https://www.stickpng.com/assets/images/5a951939c4ffc33e8c148af2.png" },
              title: StringUtils.ellipsis(select.title, 250),
              url: select.link,
              description: StringUtils.ellipsis(select.description, 4000),
              footer: { text: `Provided by Google APIs • ${this.client.user?.username}` },
              color: colors.accent,
            },
          ],
          // components: [
          //     {
          //         type: ComponentType.ActionRow,
          //         components: [
          //             {
          //                 type: ComponentType.StringSelect,
          //                 customId: `${interaction.user.id}|${interaction.commandName}|${interaction.options.getSubcommandGroup()} ${interaction.options.getSubcommand()}`,
          //                 options: results.slice(0, 25).map((item: any, i: number) => ({
          //                     label: item.title,
          //                     value: `${query}${i.toString().padStart(2, '0')}`,
          //                     default: i == index
          //                 }))
          //             }
          //         ]
          //     }
          // ]
        });
      }).catch(reject);
    });
  }

  stringSelect(interaction: StringSelectMenuInteraction<"cached">) {
    return new Promise<InteractionUpdateOptions>((resolve, reject) => {
      const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

      const query = interaction.values[0].slice(0, -2);
      const index = parseInt(interaction.values[0].slice(-2)) || 0;

      this.googleSearch(query).then((results) => {
        if (!results.length) {
          return resolve({
            embeds: [
              {
                author: { name: scripts.google_search_for_query(query), icon_url: "https://www.stickpng.com/assets/images/5a951939c4ffc33e8c148af2.png" },
                description: scripts.no_result,
                footer: { text: `Provided by Google APIs • ${this.client.user?.username}` },
                color: colors.accent,
              },
            ],
          });
        }
        const select = results[index];
        resolve({
          embeds: [
            {
              author: { name: scripts.google_search_for_query(query), icon_url: "https://www.stickpng.com/assets/images/5a951939c4ffc33e8c148af2.png" },
              title: select.title,
              url: select.link,
              description: select.description,
              footer: { text: `Provided by Google APIs • ${this.client.user?.username}` },
              color: colors.accent,
            },
          ],
          components: [
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.StringSelect,
                  customId: interaction.customId,
                  options: results.slice(0, 25).map((item: any, i: number) => ({
                    label: item.title,
                    value: `${query}${i.toString().padStart(2, "0")}`,
                    default: i == index,
                  })),
                },
              ],
            },
          ],
        });
      }).catch(reject);
    });
  }

  autocomplete(interaction: AutocompleteInteraction<"cached">) {
    return new Promise<ApplicationCommandOptionChoiceData[]>((resolve, reject) => {
      const query = interaction.options.getString("query", true).slice(0, 96);
      if (!query) return resolve([]);
      this.googleSearch(query).then((results) => {
        resolve(
          results.slice(0, 10).filter((i) => i.title).map((item: any, index: number) => {
            return {
              name: StringUtils.ellipsis(item.title, 100),
              value: `${query}|${index}`,
            };
          }),
        );
      }).catch(reject);
    });
  }

  googleSearch(query: string) {
    return new Promise<any[]>((resolve, reject) => {
      const cached = this.history.get(query);
      if (cached) return resolve(cached);

      searchWithPages({ query, pages: 3 }).then((res) => {
        return res.reduce((acc, cur) => acc.concat(cur));
      }).then((results) => {
        this.history.set(query, results);
        resolve(results);
      }).catch(reject);
    });
  }
}

// export default class extends SubCommand {
//     scripts: { [key in LocaleString]?: IScripts } = {
//         "ko": {
//         },
//         "en-US": {
//         }
//     };

//     constructor(client: Command) {
//         super(client);
//     }

//     chatInput(interaction: ChatInputCommandInteraction) {
//         return new Promise<InteractionReplyOptions>((resolve, reject) => {
//             const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

//             const splits = interaction.options.getString("query", true).split("|");
//             const last = splits.pop() ?? "";
//             let index = 0;

//             if (/^\d$/.test(last)) {
//                 index = parseInt(last);
//             } else {
//                 splits.push(last);
//             }

//             const query = splits.join("|");
//             const searchterms = encodeURIComponent(query);
//             fetch(`https://www.googleapis.com/customsearch/v1?q=${searchterms}&cx=004623199553222801142%3Amklnd78nh5i&num=10&start=1&key=${tokens.googleapis}`)
//                 .then(res => res.json()).then((searchJSON: any) => {
//                     if (searchJSON.error) {
//                         resolve({
//                             embeds: [{
//                                 author: { name: `Error! Daily search limit(100) has been exceeded.` },
//                                 title: `Google Search for ${query}`,
//                                 url: `http://www.google.com/search?q=${searchterms}`,
//                                 description: "The link above leads directly to the google search results page.",
//                                 footer: { text: `Provided by Google APIs  |  ${this.client.user?.username}` },
//                                 color: colors.error
//                             }], flags: ["Ephemeral"]
//                         });
//                     } else {
//                         const searchTermJSON = searchJSON.queries.request[0].searchTerms;
//                         const searchInfoTime = searchJSON.searchInformation.formattedSearchTime;
//                         const searchInfoTotalResults = searchJSON.searchInformation.formattedTotalResults;
//                         try {
//                             if (searchInfoTotalResults == 0) {
//                                 resolve({
//                                     embeds: [
//                                         {
//                                             author: { name: `Google Search for "${searchTermJSON}"`, icon_url: "https://www.stickpng.com/assets/images/5a951939c4ffc33e8c148af2.png" },
//                                             description: "There's no result",
//                                             footer: { text: `Provided by Google APIs  |  ${searchInfoTime} seconds  |  ${searchInfoTotalResults} results` },
//                                             color: colors.accent
//                                         }
//                                     ]
//                                 });
//                             } else {
//                                 const firstItem = searchJSON.items[index];
//                                 resolve({
//                                     embeds: [
//                                         {
//                                             author: { name: `Google Search for "${searchTermJSON}"`, icon_url: "https://www.stickpng.com/assets/images/5a951939c4ffc33e8c148af2.png" },
//                                             title: firstItem.title,
//                                             url: firstItem.link,
//                                             description: firstItem.snippet?.replace("\n", " "),
//                                             image: firstItem.pagemap?.cse_image?.[0].src.startsWith("http") ? { url: firstItem.pagemap.cse_image[0].src } : undefined,
//                                             footer: { text: `Provided by Google APIs  |  ${searchInfoTime} seconds  |  ${searchInfoTotalResults} results${firstItem.cacheId ? `  |  ${firstItem.cacheId}` : ""}` },
//                                             color: colors.accent
//                                         }
//                                     ],
//                                     components: [
//                                         {
//                                             type: ComponentType.ActionRow,
//                                             components: [
//                                                 {
//                                                     type: ComponentType.StringSelect,
//                                                     customId: `${interaction.user.id}|${interaction.commandName}|${interaction.options.getSubcommand()}|selectResult`,
//                                                     options: searchJSON.items.slice(0, 10).map((item: any, i: number) => ({
//                                                         label: item.title,
//                                                         value: `${query}|${i}`,
//                                                         default: i == index
//                                                     }))
//                                                 }
//                                             ]
//                                         }
//                                     ]
//                                 });
//                             }
//                         } catch (error) {
//                             reject(error);
//                         }
//                     }
//                 });
//         });
//     }

//     stringSelect(interaction: StringSelectMenuInteraction<"cached">, args: string[]) {
//         return new Promise<InteractionUpdateOptions>((resolve, reject) => {
//             const scripts = this.scripts[interaction.locale] ?? this.scripts["en-US"]!;

//             const splits = interaction.values[0].split("|");
//             const index = parseInt(splits.pop() ?? "") || 0;
//             const query = splits.join("|");
//             const searchterms = encodeURIComponent(query);
//             fetch(`https://www.googleapis.com/customsearch/v1?q=${searchterms}&cx=004623199553222801142%3Amklnd78nh5i&num=10&start=1&key=${tokens.googleapis}`)
//                 .then(res => res.json()).then((searchJSON: any) => {
//                     if (searchJSON.error) {
//                         interaction.reply({
//                             embeds: [{
//                                 author: { name: `Error! Daily search limit(100) has been exceeded.` },
//                                 title: `Google Search for ${query}`,
//                                 url: `http://www.google.com/search?q=${searchterms}`,
//                                 description: "The link above leads directly to the google search results page.",
//                                 footer: { text: `Provided by Google APIs  |  ${this.client.user?.username}` },
//                                 color: colors.error
//                             }], flags: ["Ephemeral"]
//                         });
//                     } else {
//                         const searchTermJSON = searchJSON.queries.request[0].searchTerms;
//                         const searchInfoTime = searchJSON.searchInformation.formattedSearchTime;
//                         const searchInfoTotalResults = searchJSON.searchInformation.formattedTotalResults;
//                         try {
//                             if (searchInfoTotalResults == 0) {
//                                 resolve({
//                                     embeds: [
//                                         {
//                                             author: { name: `Google Search for "${searchTermJSON}"`, icon_url: "https://www.stickpng.com/assets/images/5a951939c4ffc33e8c148af2.png" },
//                                             description: "There's no result",
//                                             footer: { text: `Provided by Google APIs  |  ${searchInfoTime} seconds  |  ${searchInfoTotalResults} results` },
//                                             color: colors.accent
//                                         }
//                                     ]
//                                 });
//                             } else {
//                                 const firstItem = searchJSON.items[index];
//                                 resolve({
//                                     embeds: [
//                                         {
//                                             author: { name: `Google Search for "${searchTermJSON}"`, icon_url: "https://www.stickpng.com/assets/images/5a951939c4ffc33e8c148af2.png" },
//                                             title: firstItem.title,
//                                             url: firstItem.link,
//                                             description: firstItem.snippet?.replace("\n", " "),
//                                             image: firstItem.pagemap?.cse_image?.[0].src.startsWith("http") ? { url: firstItem.pagemap.cse_image[0].src } : undefined,
//                                             footer: { text: `Provided by Google APIs  |  ${searchInfoTime} seconds  |  ${searchInfoTotalResults} results${firstItem.cacheId ? `  |  ${firstItem.cacheId}` : ""}` },
//                                             color: colors.accent
//                                         }
//                                     ],
//                                     components: [
//                                         {
//                                             type: ComponentType.ActionRow,
//                                             components: [
//                                                 {
//                                                     type: ComponentType.StringSelect,
//                                                     customId: `${interaction.user.id}|${interaction.customId.split("|").slice(1, 3).join("|")}|selectResult`,
//                                                     options: searchJSON.items.slice(0, 10).map((item: any, i: number) => ({
//                                                         label: item.title,
//                                                         value: `${query}|${i}`,
//                                                         default: i == index
//                                                     }))
//                                                 }
//                                             ]
//                                         }
//                                     ]
//                                 });
//                             }
//                         } catch (error) {
//                             reject(error);
//                         }
//                     }
//                 });
//         });
//     }

//     autocomplete(interaction: AutocompleteInteraction<"cached">) {
//         return new Promise<ApplicationCommandOptionChoiceData[]>((resolve) => {
//             const query = interaction.options.getString("query", true).slice(0, 96);
//             const searchterms = encodeURIComponent(query);
//             fetch(`https://www.googleapis.com/customsearch/v1?q=${searchterms}&cx=004623199553222801142%3Amklnd78nh5i&num=10&start=1&key=${tokens.googleapis}`)
//                 .then(res => res.json()).then((searchJSON: any) => {
//                     if (searchJSON?.items?.length)
//                         resolve(
//                             searchJSON.items.map((item: any, index: number) => {
//                                 return {
//                                     name: StringUtils.ellipsis(item.title, 100),
//                                     value: `${query}|${index}`
//                                 };
//                             })
//                         )
//                 });
//         });
//     }
// }
