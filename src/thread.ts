import * as vscode from "vscode";
import * as cheerio from "cheerio";
import got from "got";
import { CookieJar, Cookie } from "tough-cookie";
import { ForumTitleProvider, ThreadTitle, S1URL, Credential } from "./forum";

export class ThreadProvider implements vscode.TextDocumentContentProvider {
  constructor(private cookieJar: CookieJar) {}

  onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
  onDidChange = this.onDidChangeEmitter.event;

  provideTextDocumentContent(uri: vscode.Uri): vscode.ProviderResult<string> {
    return this.threadContent(uri);
  }

  private async threadContent(uri: vscode.Uri) {
    const threadDoc = await got(
      // `${S1URL.host}/archiver/${uri.path}?${uri.query}`,
      `${S1URL.host}/archiver/tid-${uri.path.slice(0, -3)}.html?${uri.query}`,
      { cookieJar: this.cookieJar }
    ).text();
    const $: cheerio.CheerioAPI = cheerio.load(threadDoc);
    const content = $("#content").text().trim();
    return content;
  }
}
