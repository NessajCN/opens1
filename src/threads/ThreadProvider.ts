import {
  Uri,
  EventEmitter,
  TextDocumentContentProvider,
  ProviderResult,
} from "vscode";
import * as cheerio from "cheerio";
import got from "got";
import { CookieJar } from "tough-cookie";
import { Author, S1URL, ThreadContent } from "../types/S1types";

export default class ThreadProvider implements TextDocumentContentProvider {
  constructor(private cookieJar: CookieJar) {}

  onDidChangeEmitter = new EventEmitter<Uri>();
  onDidChange = this.onDidChangeEmitter.event;

  provideTextDocumentContent(uri: Uri): ProviderResult<string> {
    return this.threadContent(uri);
  }

  refresh(uri: Uri) {
    this.onDidChangeEmitter.fire(uri);
  }

  private toMarkdown(threadContents: ThreadContent[], subject: string): string {
    let md: string;
    md = `# ${subject}\n`;
    for (const content of threadContents) {
      md += `> **${content.author}** 发表于 ${content.posttime}\n\n`;
      md += `${content.content}\n\n`;
      md += `----\n\n`;
    }
    return md;
  }

  // private fixUnicodeHexToDec(unicodeHex: string): string {
  //   const hexRegex: RegExp = /&#x(.+?);/;
  //   const matchArray = unicodeHex.match(hexRegex);
  //   if (!matchArray) {
  //     console.log(unicodeHex);
  //     return unicodeHex;
  //   } else {
  //     const dec = Number(`0x${matchArray[1]}`);
  //     console.log(dec);
  //     return `&#${dec}`;
  //   }
  // }

  private getAuthors(doc: string) {
    const $: cheerio.CheerioAPI = cheerio.load(doc);
    const authors = $("#content p.author")
      .map((i, el) => {
        const author = $(el).children("strong").text().trim();

        $(el).children("strong").remove();
        const posttime = $(el).text().trim().slice(4);
        return { fl: i, author, posttime };
      })
      .toArray();
    return authors;
  }

  private getSubject(doc: string) {
    const $: cheerio.CheerioAPI = cheerio.load(doc);
    return $("#content h3").first().text().trim();
  }

  private getPostTexts(doc: string) {
    const $: cheerio.CheerioAPI = cheerio.load(doc);
    $("#content .page").remove();
    const posts = $("#content")
      .html()
      ?.split(/<p.+?<\/p>/s)
      .map((post) =>
        post
          .trim()
          .replace(/<h3>.+?<\/h3>/g, "")
          .trim()
          .replace(/<br>/g, "\n")
          // .replace(/&#x.+?;/g, (hex)=> `&#${Number(`0x${hex.match(/&#x(.+?);/)[1]}`)};`)
          .replace(/&amp;#/g, "&#")
      );
    // $("#content p.author").remove();
    // const posts = $("#content").map((i,el)=>$(el).text().trim()).toArray();
    posts?.shift();
    return posts;
  }

  private async threadContent(uri: Uri) {
    const [tid, page] = uri.path.slice(0, -3).split("-");
    const threadDoc: string = await got(
      `${S1URL.host}/archiver/tid-${tid}.html?page=${page}`,
      { cookieJar: this.cookieJar }
    ).text();
    // const $: cheerio.CheerioAPI = cheerio.load(threadDoc);
    // const content = $("#content").text().trim();

    const authors: Author[] = this.getAuthors(threadDoc);
    const posts: string[] | undefined = this.getPostTexts(threadDoc);
    const subject: string = this.getSubject(threadDoc);
    const threadContents: ThreadContent[] = authors.map((author) => {
      return {
        author: author.author,
        posttime: author.posttime,
        content: posts ? posts[author.fl] : "",
      };
    });
    // console.log($("#content").html());
    // console.log(posts);
    const markdownContent: string = this.toMarkdown(threadContents, subject);
    return markdownContent;
  }
}
