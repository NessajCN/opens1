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
import { Member } from "../types/S1types";

export class MemberInfoProvider implements HoverProvider {
  constructor(private cookieJar: CookieJar) {}
  provideHover(
    document: TextDocument,
    position: Position
  ): ProviderResult<Hover> {
    return this.memberHover(document, position);
  }

  public memberInfo = new MarkdownString();

  private async memberHover(document: TextDocument, position: Position) {
    // const hoverLineText = document.lineAt(position.line).text;
    const memberPattern: RegExp = /<@.+?>\n/;

    const hoverRange = document.getWordRangeAtPosition(position, memberPattern);

    return hoverRange ? new Hover(this.memberInfo): undefined;
    // if (memberPattern.test(hoverLineText)) {
    //   const hoverRange = document.getWordRangeAtPosition(
    //     position,
    //     memberPattern
    //   );
    //   if (hoverRange) {
    //     return new Hover(
    //       this.memberInfo
    //       //   new Range(position, position)
    //     );
    //   } else {
    //     return null;
    //   }
    // } else {
    //   return null;
    // }
  }
}

export class MemberInfo implements Member {
    constructor(public username: string, private cookieJar: CookieJar){}

    private getMemberInfo(cookieJar: CookieJar, username: string) {}

    public readonly uid: number | undefined;

}

// let disposable3 = languages.registerHoverProvider("plaintext", {
//   provideHover(document, position) {
//   },
// });
