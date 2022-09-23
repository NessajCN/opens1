import * as vscode from "vscode";
// import * as filepath from "path";
import * as cheerio from "cheerio";
import got from "got";
import { CookieJar, Cookie } from "tough-cookie";
import { setPassword, deletePassword, findCredentials } from "keytar";

export const S1URL = {
  host: "https://bbs.saraba1st.com/2b",
  loginPath: "/member.php?mod=logging&action=login",
  logoutPath: "/member.php?mod=logging&action=logout",
  newPostPath: "/forum.php?mod=post&action=newthread",
  replyPath: "/forum.php?mod=post&action=reply",
  title: "stage1st",
} as const;

export const GUEST: Credential = {
  username: "",
  password: "",
} as const;

export interface Credential {
  username: string;
  password: string;
}

export interface LoginForm {
  loginhash: string | null;
  formhash: string | null;
}

export class ForumTitleProvider
  implements vscode.TreeDataProvider<ThreadTitle | BoardTitle>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ThreadTitle | BoardTitle | undefined | void
  > = new vscode.EventEmitter<ThreadTitle | BoardTitle | undefined | void>();

  readonly onDidChangeTreeData: vscode.Event<
    ThreadTitle | BoardTitle | undefined | void
  > = this._onDidChangeTreeData.event;

  constructor(private credential: Credential, private cookieJar: CookieJar) {
    this.login(this.credential).then((auth: boolean) => {
      vscode.commands.executeCommand(
        "setContext",
        "opens1.authenticated",
        auth
      );
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  updateView(element: ThreadTitle | BoardTitle): void {
    this._onDidChangeTreeData.fire(element);
  }

  private async formHash(path: string): Promise<LoginForm> {
    const result = await got(path, { cookieJar: this.cookieJar }).text();
    const relogin: RegExp = /<div id="main_messaqge_(.+?)">/;
    const reform: RegExp =
      /<input type="hidden" name="formhash" value="(.+?)" \/>/;
    const malogin =
      path.includes("action=login") && result ? result.match(relogin) : null;
    const maform = result ? result.match(reform) : null;
    const loginform: LoginForm = {
      loginhash: malogin ? malogin[1] : null,
      formhash: maform ? maform[1] : null,
    };
    return loginform;
  }

  private async checkAuth(cookieJar: CookieJar) {
    const cookies: Cookie[] = await cookieJar.getCookies(S1URL.host);
    const check: boolean = cookies
      .map((cookie: Cookie) => cookie.key)
      .includes("B7Y9_2132_auth");
    vscode.commands.executeCommand("setContext", "opens1.authenticated", check);
    return check;
  }

  private async clearStoredCredentials() {
    const storedCredentials = await findCredentials(S1URL.title);
    storedCredentials.forEach(async (credential, index) => {
      await deletePassword(S1URL.title, credential.account);
    });
    vscode.commands.executeCommand("setContext", "opens1.authenticated", false);
  }

  public async logout() {
    const { loginhash: _, formhash } = await this.formHash(
      `${S1URL.host}${S1URL.logoutPath}`
    );
    const logoutURL: string = `${S1URL.host}${S1URL.logoutPath}&formhash=${formhash}`;
    await got(logoutURL, { cookieJar: this.cookieJar }).text();
    await this.clearStoredCredentials();
    this.refresh();
  }

  public async login(credential: Credential) {
    if (credential === GUEST) {
      await this.clearStoredCredentials();
      return false;
    }
    const { loginhash, formhash } = await this.formHash(
      `${S1URL.host}${S1URL.loginPath}`
    );
    const loginURL: string = `${S1URL.host}${S1URL.loginPath}&loginsubmit=yes&loginhash=${loginhash}&inajax=1`;
    const formdata = {
      formhash: formhash,
      referer: S1URL.host,
      loginfield: credential.username,
      username: credential.username,
      password: credential.password,
      questionid: "0",
      answer: "",
      cookietime: 2592000,
    };
    const response = await got(loginURL, {
      cookieJar: this.cookieJar,
      method: "POST",
      form: formdata,
    }).text();
    if (await this.checkAuth(this.cookieJar)) {
      this.credential = credential;
      await setPassword(
        S1URL.title,
        this.credential.username,
        this.credential.password
      );
      this.refresh();
      return true;
    } else {
      this.credential = GUEST;
      await this.clearStoredCredentials();
      this.refresh();
      return false;
    }
  }

  getTreeItem(
    element: ThreadTitle | BoardTitle
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(
    element?: ThreadTitle | BoardTitle | undefined
  ): vscode.ProviderResult<(ThreadTitle | BoardTitle)[]> {
    if (element && element instanceof BoardTitle) {
      return this.getForumEntries(element);
    } else if (element && element instanceof ThreadTitle) {
      // ThreadTitle won't call getChildren as it's collapseState is set to None.
      // This condition block can be ignored.
      return [];
    } else {
      return this.getForumEntries();
    }
  }

  private async getForumEntries(
    element?: ThreadTitle | BoardTitle | undefined
  ): Promise<(ThreadTitle | BoardTitle)[]> {
    const fetchURL: string = element
      ? `${S1URL.host}/archiver/${element.path}?page=${element.page}`
      : `${S1URL.host}/archiver/`;
    let forumDoc: string;
    try {
      forumDoc = await got(fetchURL, { cookieJar: this.cookieJar }).text();
    } catch (error) {
      console.error(error);
      return [];
    }

    const $: cheerio.CheerioAPI = cheerio.load(forumDoc);
    // const content = $('#content li a').map((i, el) => {
    //   const title = $(el).text();
    //   return title;
    // }).get();
    // console.log(content);

    const entries = $("#content li")
      .map((i, el) => {
        const path: string = $(el).children("a").attr("href") || "#";
        const title: string = $(el).text().trim();
        if (path.includes("fid-")) {
          return new BoardTitle(
            title,
            path,
            vscode.TreeItemCollapsibleState.Collapsed
          );
        } else if (path.includes("tid-")) {
          $(el).children("a").remove();
          const replies: number = Number($(el).text().trim().slice(1, -4));
          const fid: number = Number(element ? element.path.slice(4, -5) : 0);
          return new ThreadTitle(
            title,
            path,
            fid,
            replies,
            vscode.TreeItemCollapsibleState.None
          );
        }
      })
      .get();
    return entries;
  }

  turnBoardPage(element: BoardTitle, page: number) {
    if (page >= 1 && page <= 10) {
      element.page = page;
      element.description = ` Page ${page}`;
      element.tooltip += ` Page ${page}`;
      element.contextValue = `boardp${page}`;
      this.updateView(element);
    }
  }

  turnThreadPage(element: ThreadTitle, page: number) {
    if (page >= 1 && page <= element.pagination) {
      element.page = page;
      element.description = ` Page ${page}/${element.pagination}`;
      element.tooltip += ` Page ${page}/${element.pagination}`;
      element.contextValue = `threadp${page}`;
      this.updateView(element);
    }
  }

}

export class ThreadTitle extends vscode.TreeItem {
  constructor(
    public readonly title: string,
    public readonly path: string,
    public readonly fid: number,
    public readonly replies: number,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(title, collapsibleState);
    this.tooltip = this.title;
    // this.description = this.link.slice(0,-5);
    // this.description = `Page ${this.page}/${this.pagination}`;
    this.contextValue = `thread`;
    this.command = {
      title: "Show Thread",
      command: "opens1.showthread",
      arguments: [this]
      // arguments: [vscode.Uri.parse(`s1:${this.path}?page=${this.page}`)]
    };
    // this.command = vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${S1URL.host}${this.href}`));
  }

  public page: number = 1;
  public pagination: number = Math.ceil(this.replies / 30);

  private tid: number = Number(this.path.slice(4, -5));
}

export class BoardTitle extends vscode.TreeItem {

  constructor(
    public readonly title: string,
    public readonly path: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(title, collapsibleState);
    this.tooltip = this.title;
    // this.description = this.link.slice(0,-5);
    // this.description = "";
    this.contextValue = `boardp${this.page}`;
    // this.command = {
    //   title: "Update view",
    //   command: "opens1.updateview",
    //   arguments: [this],
    // };
  }

  // iconPath = {
  //   light: filepath.join(
  //     __filename,
  //     "..",
  //     "..",
  //     "resources",
  //     "light",
  //     "comment-discussion.svg"
  //   ),
  //   dark: filepath.join(
  //     __filename,
  //     "..",
  //     "..",
  //     "resources",
  //     "dark",
  //     "comment-discussion.svg"
  //   ),
  // };
  iconPath = new vscode.ThemeIcon("comment-discussion");


  public page: number = 1;
  private tid: number = Number(this.path.slice(4, -5));

}
