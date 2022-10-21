import {
  HoverProvider,
  Hover,
  Range,
  Position,
  ProviderResult,
  TextDocument,
  MarkdownString,
  Uri,
} from "vscode";

export class QuotedReplyProvider implements HoverProvider {
  constructor() {}
  provideHover(
    document: TextDocument,
    position: Position
  ): ProviderResult<Hover> {
    return this.quotedReplyHover(document, position);
  }

  private async quotedReplyHover(document: TextDocument, position: Position) {
    const pidPattern: RegExp = /fid(.+?)pid(.+?)e/;
    const hoverLineText: string = document.lineAt(position.line).text;

    const hoverRange: Range | undefined = document.getWordRangeAtPosition(
      position,
      pidPattern
    );
    const matchedArray: RegExpMatchArray | null =
      hoverLineText.match(pidPattern);
    const fid: string | null = matchedArray ? matchedArray[1] : null;
    const pid: string | null = matchedArray ? matchedArray[2] : null;

    const [tid, _page, _ext] = document.uri.path.split(/-|\./);

    const args = [{ tid, fid, pid }];
    const quotedReplyCmdUri = Uri.parse(
      `command:opens1.quotedreply?${encodeURIComponent(JSON.stringify(args))}`
    );

    if (!pid || !fid) {
      return undefined;
    } else {
      const qReplyMarkdownString = new MarkdownString(
        `[Quoted Reply](${quotedReplyCmdUri})`
      );
      qReplyMarkdownString.isTrusted = true;
      return hoverRange
        ? new Hover(qReplyMarkdownString, hoverRange)
        : undefined;
    }
  }
}
