import {
  Uri,
  EventEmitter,
  TextDocumentContentProvider,
  ProviderResult,
} from "vscode";
import * as cheerio from "cheerio";
import got from "got";
import { CookieJar } from "tough-cookie";
import {
  Post,
  PostContent,
  S1URL,
} from "../types/S1types";

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

  private toMarkdown(post: Post): string {
    let md: string = `# ${post.subject}\n`;
    for (const content of post.contents) {
      // const args = [{ tid: post.tid, fid:post.fid, pid: content.pid }];
      // const quotedReplyCmdUri = Uri.parse(
      //   `command:opens1.quotedreply?${encodeURIComponent(JSON.stringify(args))}`
      // );
      md += `> **<@${content.author}>** 发表于 ${content.posttime}\n\n`;
      md += `${content.message}\n\n`;
      // md += `[Quote Reply](${quotedReplyCmdUri})\n\n`;
      md += `----\n\n`;
    }
    return md;
  }

  private toTypescript(post: Post): string {
    let ts: string = `interface Thread {\n  /**\n   * ${post.subject}\n   */\n  subject: string,`;
    for (const content of post.contents) {
      ts += `\n\n  /**\n   * <@${content.author}>\n   * 发表于 ${content.posttime}\n   */\n  `;
      ts += `post${content.num}: string,\n  /**\n   `;
      ts += `* ${content.message.replace(/(\n)+/g, "\n   * ")}\n   */\n  `;
      ts += `fid${post.fid}pid${content.pid}e: number,`;
    }
    ts += `\n}`;
    return ts;
  }

  private toPython(post: Post): string {
    let py: string = `class Thread:\n  def subject():\n    # ${post.subject}\n    return`;
    for (const content of post.contents) {
      py += `\n\n  def post${content.num}():\n    # <@${
        content.author
      }>\n    # 发表于 ${content.posttime}\n    return`;
      py += `\n  def fid${post.fid}pid${content.pid}e():\n`;
      py += `    """${content.message.replace(
        /(\n)+/g,
        "\n    "
      )}\n    """\n    return`;
    }
    return py;
  }

  private toCpp(post: Post): string {
    let cc: string = `namespace Thread {\n  /**\n   * ${post.subject}\n   */\n  `;
    cc += `std::string subject;`;
    for (const content of post.contents) {
      cc += `\n\n  /**\n   * <@${content.author}>\n   * 发表于 ${content.posttime}\n   */\n  `;
      cc += `std::string post${content.num};\n  /**\n   `;
      cc += `* ${content.message.replace(/(\n)+/g, "\n   * ")}\n   */\n  `;
      cc += `int fid${post.fid}pid${content.pid}e;`;
    }
    cc += `\n}`;
    return cc;
  }


  private async getPosts(tid: string, page: string): Promise<Post> {
    const doc = await got(`${S1URL.host}/thread-${tid}-${page}-1.html`, {
      cookieJar: this.cookieJar,
    }).text();
    const $ = cheerio.load(doc);
    const contents: PostContent[] = $("#postlist")
      .children("div")
      .map((i, el) => {
        if ($(el).attr("id")?.startsWith("post_")) {
          const pid = $(el).attr("id")?.slice(5);
          if (!pid) {
            return undefined;
          }
          const author = $(`#favatar${pid} .xw1`).text().trim();
          const posttime = $(`#authorposton${pid}`).text().trim().slice(4);
          const message = $(`#postmessage_${pid}`)
            .text()
            .trim()
            .replace(/<br>/g, "\n")
            .replace(/(\n)+/g, "\n\n");
          const num = $(`#postnum${pid}`).text().trim().replace("#","F");
          return { pid, author, posttime, message, num };
        }
      })
      .toArray();
    const subject = $("#thread_subject").text();
    const fidArray = $("#post_reply").attr("onclick")?.match(/&fid=(.+?)&/);
    const fid = fidArray? Number(fidArray[1]): 0;
    return { subject, tid, page, fid, contents };
  }

  // private getAuthors(doc: string) {
  //   const $: cheerio.CheerioAPI = cheerio.load(doc);
  //   const authors = $("#content p.author")
  //     .map((i, el) => {
  //       const author = $(el).children("strong").text().trim();

  //       $(el).children("strong").remove();
  //       const posttime: string = $(el).text().trim().slice(4);
  //       return { fl: i, author, posttime };
  //     })
  //     .toArray();
  //   return authors;
  // }

  // private getSubject(doc: string) {
  //   const $: cheerio.CheerioAPI = cheerio.load(doc);
  //   return $("#content h3").first().text().trim();
  // }

  // private getPostTexts(doc: string) {
  //   const $: cheerio.CheerioAPI = cheerio.load(doc);
  //   $("#content .page").remove();
  //   const posts = $("#content")
  //     .html()
  //     ?.split(/<p.+?<\/p>/s)
  //     .map((post) =>
  //       post
  //         .trim()
  //         .replace(/<h3>?.+?<\/h3>/g, "")
  //         .trim()
  //         .replace(/<br>/g, "\n")
  //         // .replace(/&#x.+?;/g, (hex)=> `&#${Number(`0x${hex.match(/&#x(.+?);/)[1]}`)};`)
  //         .replace(/&amp;#/g, "&#")
  //         .replace(/&#x([0-9A-F]{1,4});/g, (_, unicode) =>
  //           String.fromCharCode(Number(`0x${unicode}`))
  //         )
  //     );
  //   // $("#content p.author").remove();
  //   // const posts = $("#content").map((i,el)=>$(el).text().trim()).toArray();
  //   posts?.shift();
  //   return posts;
  // }

  private async threadContent(uri: Uri) {
    // const [tid, page] = uri.path.slice(0, -3).split("-");
    const [tid, page, ext] = uri.path.split(/-|\./);
    // const threadDoc: string = await got(
    //   `${S1URL.host}/archiver/tid-${tid}.html?page=${page}`,
    //   { cookieJar: this.cookieJar }
    // ).text();

    // const authors: Author[] = this.getAuthors(threadDoc);
    // const posts: string[] | undefined = this.getPostTexts(threadDoc);
    // const subject: string = this.getSubject(threadDoc);
    // const threadContents: ThreadContent[] = authors.map((author) => {
    //   return {
    //     author: author.author,
    //     posttime: author.posttime,
    //     content: posts ? posts[author.fl] : "",
    //     fl: author.fl,
    //   };
    // });

    const post: Post = await this.getPosts(tid, page);

    const renderedContent: string =
      ext === "md"
        ? this.toMarkdown(post)
        : ext === "ts"
        ? this.toTypescript(post)
        : ext === "py"
        ? this.toPython(post)
        : ext === "cc"
        ? this.toCpp(post)
        : this.toMarkdown(post);
    return renderedContent;
  }
}
