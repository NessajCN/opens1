import got from "got";
import * as cheerio from "cheerio";

import { CookieJar } from "tough-cookie";
import {
  HoverProvider,
  Hover,
  languages,
  Range,
  Position,
  ProviderResult,
  TextDocument,
  MarkdownString,
} from "vscode";
import { Member, S1URL } from "../types/S1types";

export class MemberInfoProvider implements HoverProvider {
  constructor(private cookieJar: CookieJar) {}
  provideHover(
    document: TextDocument,
    position: Position
  ): ProviderResult<Hover> {
    return this.memberHover(document, position);
  }

  private readonly memberPattern: RegExp = /<@(.+?)>/;

  private async memberHover(document: TextDocument, position: Position) {
    const hoverLineText: string = document.lineAt(position.line).text;

    const hoverRange: Range | undefined = document.getWordRangeAtPosition(
      position,
      this.memberPattern
    );
    const matchedArray: RegExpMatchArray | null = hoverLineText.match(
      this.memberPattern
    );
    const username: string | null = matchedArray ? matchedArray[1] : null;

    const memberInfo = username
      ? new MemberInfo(username, this.cookieJar)
      : undefined;

    if (!username || !memberInfo) {
      return undefined;
    } else {
      await memberInfo.getMemberInfo();
      const memberMarkdownString = new MarkdownString(
        `**${memberInfo.username}** ( UID: ${memberInfo.uid} )\n\n----\n\n主题数: ${memberInfo.posts} ； 回帖数: ${memberInfo.replies} \n\n鹅: ${memberInfo.geese} ； 死鱼: ${memberInfo.currency} ； 用户组: ${memberInfo.level}
        \n在线时长: ${memberInfo.totalonline} ； 注册日期: ${memberInfo.registeredAt}`
      );
      return hoverRange
        ? new Hover(memberMarkdownString, hoverRange)
        : undefined;
    }
  }
}

export class MemberInfo implements Member {
  constructor(public username: string, private cookieJar: CookieJar) {}

  public async getMemberInfo() {
    const doc: string = await got(
      `${S1URL.host}/space-username-${this.username}.html`,
      {
        cookieJar: this.cookieJar,
        headers: {
          Referer: `${S1URL.host}/forum.php`,
        },
      }
    ).text();
    const $ = cheerio.load(doc);
    const uidnumber = Number($("#uhd .xg1").text().split("?")[1]);
    if (!uidnumber || Number.isNaN(uidnumber)) {
      return;
    }
    this.uid = uidnumber;
    this.level = $("#ct .u_profile ul li .xi2 a").text().trim();
    $("#psts .pf_l li").each((i, el) => {
      $(el).children("em").remove();
      switch (i) {
        case 1: {
          this.score = Number($(el).text().trim());
          break;
        }
        case 2: {
          this.geese = Number($(el).text().trim().split(" ")[0]);
          break;
        }
        case 4: {
          this.currency = Number($(el).text().trim().split(" ")[0]);
          break;
        }
        default: {
          break;
        }
      }
    });
    $("#ct .u_profile .bbda :not(#pbbs) li").each((i, el) => {
      if (i === 3) {
        $(el).children().each((j,ele)=>{
          console.log(j);
          console.log($(ele).html());
          switch(j) {
            case 1: {
              this.friends = Number($(ele).text().trim().split(" ")[1]);
              break;
            }
            case 3: {
              this.replies = Number($(ele).text().trim().split(" ")[1]);
              break;
            }
            case 5: {
              this.posts = Number($(ele).text().trim().split(" ")[1]);
              break;
            }
            default: {
              break;
            }
          }
        });
      }
    });
    $("#ct .u_profile .bbda #pbbs li").each((i, el) => {
      $(el).children("em").remove();
      switch (i) {
        case 0: {
          this.totalonline = Number($(el).text().trim().split(" ")[0]);
          break;
        }
        case 1: {
          this.registeredAt = $(el).text().trim();
          break;
        }
        case 2: {
          this.lastvisited = $(el).text().trim();
          break;
        }
        default: {
          break;
        }
      }
    });
    // console.log(`Geese: ${this.geese}, Currency: ${this.currency}`);
  }

  public uid: number | undefined;
  public readperm: number | undefined;
  public geese: number | undefined;
  currency: number | undefined;
  friends: number | undefined;
  posts: number | undefined;
  replies: number | undefined;
  totalonline: number | undefined;
  lastvisited: string | undefined;
  registeredAt: string | undefined;
  score: number | undefined;
  level: string | undefined;
}

// let disposable3 = languages.registerHoverProvider("plaintext", {
//   provideHover(document, position) {
//   },
// });
