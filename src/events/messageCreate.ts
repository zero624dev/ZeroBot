import {
  Client,
  Collection,
  type Message,
} from "discord.js";
import { ClientEvent } from "../core/types";
import { addUserWallet, existsUser } from "../addons/database/repository/GameRepo";
import { colors } from "../config";
import { mentionCommand } from "../core/utils/utils";

const commands_: [string, string[]][] = [
  ["eval", []],
  ["restart", ["재시작"]],
  ["test", ["테스트"]],
  ["valorantshop", ["valoshop"]],
  ["magicconch", ["magicconchshell", "mcs", "magicconch", "ホラガイ", "ホラ", "魔法のホラ", "마법의소라고둥", "소라고동", "소라고둥", "마법의소라고동"]],
  ["petthe", ["petthe", "なでる", "쓰다듬기"]],
  ["pirateroulette", ["PirateRoulette", "丸ごとおじさん", "海賊ルーレット", "통아저씨", "해적룰렛"]],
  ["ship", ["ship", "相性", "궁합"]],
  ["tictactoe", ["tictactoe", "ティックタクト", "틱택토"]],
  ["comp", ["comp", "ㅊㅊ", "출첵", "출석"]],
  ["gamble", ["gamble", "도박"]],
  ["rank", ["ranking", "rank", "랭킹", "랭크"]],
  ["wallet", ["wallet", "지갑"]],
  ["osu", ["osu", "ロース", "오스"]],
  ["avatar", ["avatar", "av", "avatar", "アバター", "トップ画", "아바타", "프사"]],
  ["banner", ["banner", "バナー", "배너"]],
  ["botinfo", ["bot", "info", "botinfo", "ボット", "情報", "ボット情報", "봇", "정보", "봇정보"]],
  ["config", ["setting", "config", "設定", "설정"]],
  ["help", ["help", "command", "help", "ヘルプ", "コマンド", "命令語", "도움", "도움말", "명령어"]],
  ["profile", ["whois", "profile", "プロフィール", "프로필"]],
  ["register", ["register", "加入", "가입"]],
  ["serverinfo", ["server", "serverinfo", "サーバ", "サーバ情報", "서버", "서버정보"]],
  ["snipe", ["snipe", "スナイプ", "スナイピング", "스나이프", "스나이핑"]],
  ["timeline", ["tl", "timeline", "プレイタム", "プレイタイム", "탐라", "타임라인"]],
  ["purge", ["purge", "消しゴ", "지우개"]],
  ["filter", ["filter", "フィルター", "필터"]],
  ["leave", ["disconnect", "dis", "queue", "途切れる", "出る", "끊기", "나가"]],
  ["nowplay", ["np", "nowplay", "再生中", "재생중"]],
  ["pause", ["pause", "일시정지"]],
  ["play", ["play", "リプレー", "再生", "재생"]],
  ["resume", ["resume", "재개", "다시재생"]],
  ["seek", ["seek", "移動", "이동"]],
  ["skip", ["skip", "스킵", "건너뛰기"]],
  ["volume", ["volume", "サウンド", "ボリューム", "음량", "볼륨"]],
  ["color", ["color", "色相", "色", "カラー", "색상", "색깔", "컬러", "색"]],
  ["d-day", ["dday", "d_day", "d-day", "ディーデー", "디데이"]],
  ["en2ko", ["e2k", "ko2en", "k2e", "en2ko", "英韓", "한영", "영한"]],
  ["google", ["search", "google", "グーグル", "검색", "구글"]],
  ["meal", ["meal", "給食", "급식"]],
  ["pick", ["pick", "選択", "選ぶ", "ピック", "선택"]],
  ["timetable", ["timetable", "時間割", "시간표"]],
  ["translate", ["tr", "translate", "翻訳", "번역"]],
];
const refCmd: Record<string, string[]> = {
  "magicconch": ["meme", "magic-conch"],
  "petthe": ["meme", "petpet"],
  "ship": ["meme", "ship"],
  "pirateroulette": ["minigame", "pirate-roulette"],
  "tictactoe": ["minigame", "tictactoe"],
  "rank": ["game", "rank"],
  "wallet": ["game", "wallet"],
  "comp": ["game", "comp"],
  "gamble": ["game", "gamble", "evenodd"],
  "meal": ["school", "meal"],
  "timetable": ["school", "timetable"],
  "translate": ["translate"],
  "google": ["search", "google"],
  "register": ["account", "create"],
  "config": ["account", "settings"],
  "color": ["color-picker", "color"],
  "snipe": ["snipe", "delete"],
  "play": ["music", "play"],
  "pause": ["music", "pause"],
  "resume": ["music", "resume"],
  "leave": ["music", "leave"],
  "seek": ["music", "seek"],
  "skip": ["music", "skip"],
  "volume": ["music", "volume"],
  "timeline": ["timeline"],
  "botinfo": ["botinfo"],
  "d-day": ["d-day", "list"],
};

export default class MessageCreate extends ClientEvent<"messageCreate"> {
  cooldowns = new Collection<string, number>();
  deprecated = new Collection<string, string>();
  webhookCache = new Map();

  minWage = 9860;
  constructor(client: Client) {
    super(client);

    commands_.forEach(([commandName, aliases]) => {
      this.deprecated.set(commandName, commandName);
      aliases.forEach((alias) => {
        this.deprecated.set(alias, commandName);
      });
    });
  }

  public run(message: Message) {
    return new Promise<void>((_, reject) => {
      switch (message.content) {
        case "🚪":
          message.react("🗝️");
          break;
        case "🪙":
          message.react("⚡");
          break;
      }

      if (/^!<a?:\w+:\d+>$/.test(message.content) && message.inGuild() && message.channel.isSendable()) {
        this.sendBigEmoji(message).catch(reject);
        // const emojiID = message.content.match(/\d+/g)!.pop();
        // message.delete();
        // message.channel.send({
        //     embeds: [
        //         {
        //             author: {
        //                 name: message.author.tag,
        //                 icon_url: message.author.displayAvatarURL()
        //             },
        //             image: {
        //                 url: `https://cdn.discordapp.com/emojis/${emojiID}.${message.content.startsWith("!<a") ? "gif" : "png"}?size=2048&quality=lossless`
        //             }
        //         }
        //     ],
        //     reply: {
        //         messageReference: message.reference?.messageId ?? ""
        //     },
        //     allowedMentions: {
        //         repliedUser: false
        //     }
        // })
      }

      existsUser(message?.author.id).then((exists) => {
        if (exists) {
          if (Date.now() - (this.cooldowns.get(message.author.id) ?? 0) >= 300000) {
            this.cooldowns.set(message.author.id, Date.now());
            const reward = Math.round(this.minWage / 12);
            addUserWallet(message.author.id, reward, true).catch(reject);
          }
        }
      }).catch(reject);

      if (message.content.startsWith("0")) {
        let commandName = this.deprecated.get(message.content.slice(1).trim().split(/ +/g)[0]);
        if (commandName) {
          if (refCmd[commandName]) {
            const inv = "https://discord.com/api/oauth2/authorize?client_id=606821254170804256&permissions=8&scope=applications.commands%20bot";
            if ("send" in message.channel && typeof message.channel.send === "function") {
              message.channel.send({
                embeds: [{
                  title: "해당 명령어는 슬래시커맨드로 이전됐어요.",
                  description: `${mentionCommand(this.client, ...(refCmd[commandName] as [string]))}를 사용해주세요.\n명령어를 사용할 수 없다면 [링크](${inv})를 클릭하여 봇을 다시 초대해주세요.`,
                  color: colors.error,
                }],
              });
            }
          } else {
            if ("send" in message.channel && typeof message.channel.send === "function") {
              message.channel.send({
                embeds: [{
                  title: "해당 명령어는 이제 사용할 수 없습니다.",
                  color: colors.error,
                }],
              });
            }
          }
        }
      }
    });
  }

  async sendBigEmoji(msg: Message<true>) {
    console.log(!msg.channel.isDMBased() && !msg.channel.isThread());
    const emojiId = msg.content.match(/\d+/g)!.pop();
    const isAnimated = msg.content.startsWith("!<a");
    const fileExt = isAnimated ? "gif" : "png";
    const emojiURL = `https://cdn.discordapp.com/emojis/${emojiId}.${fileExt}?size=512&quality=lossless`;

    try {
      let webhook = this.webhookCache.get(msg.channel.id);
      if (!webhook && !msg.channel.isDMBased() && !msg.channel.isThread()) {
        const hooks = await msg.channel.fetchWebhooks();
        webhook = hooks.find((h) => h.name === "forward bot");
        if (!webhook) {
          webhook = await msg.channel.createWebhook({
            name: "forward bot",
            avatar: this.client.user?.displayAvatarURL(),
          });
        }
        this.webhookCache.set(msg.channel.id, webhook);
      }

      const member = msg.member;
      const displayName
        = member?.nickname || member?.user.globalName || msg.author.username;
      const avatar = member?.avatar
        ? `https://cdn.discordapp.com/guilds/${msg.guild.id}/users/${msg.author.id}/avatars/${member.avatar}.png`
        : msg.author.displayAvatarURL();

      let replyText = "";
      if (msg.reference?.messageId) {
        try {
          const refMsg = await Promise.race([
            msg.channel.messages.fetch(msg.reference.messageId),
            new Promise((_, reject) =>
              setTimeout(() => reject("timeout"), 1000),
            ),
          ]) as Message;

          if (refMsg) {
            const refAuthor = refMsg.author;
            const refContent
              = refMsg.content.length > 60
                ? refMsg.content.slice(0, 57) + "..."
                : refMsg.content;

            const msgLink = `<https://discord.com/channels/${msg.guildId}/${msg.channelId}/${refMsg.id}>`;
            replyText = `-# **[${refAuthor.username
            }](${msgLink})** - ${refContent}  ${msg.mentions.repliedUser
              ? `||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​|| <@${refAuthor.id}>\n`
              : ""
            }`;
          }
        } catch (err) {
          if (err !== "timeout") console.warn("fucking fetch error", err);
        }
      }

      await webhook.send({
        username: displayName,
        avatarURL: avatar,
        content: `${replyText ? replyText + "\n" : ""}${emojiURL}`,
      });

      await msg.delete().catch(() => { });
    } catch (err) {
      console.error("fucking webhook error:", err);
    }
  }
}
