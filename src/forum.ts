import * as vscode from "vscode";
import * as path from "path";
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
  implements vscode.TreeDataProvider<ThreadlTitle | BoardTitle>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ThreadlTitle | BoardTitle | undefined | void
  > = new vscode.EventEmitter<ThreadlTitle | BoardTitle | undefined | void>();

  readonly onDidChangeTreeData: vscode.Event<
    ThreadlTitle | BoardTitle | undefined | void
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
    element: ThreadlTitle | BoardTitle
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(
    element?: ThreadlTitle | BoardTitle | undefined
  ): vscode.ProviderResult<(ThreadlTitle | BoardTitle)[]> {
    if (element && element instanceof BoardTitle) {
      return this.getForumEntries(`${S1URL.host}/archiver/${element.href}`);
    } else if (element && element instanceof ThreadlTitle) {
      return [];
    } else {
      return this.getForumEntries(`${S1URL.host}/archiver/`);
    }
  }

  private async getForumEntries(
    forumPath: string
  ): Promise<(ThreadlTitle | BoardTitle)[]> {
    if (!forumPath.startsWith(`${S1URL.host}/archiver`)) {
      console.log(`Invalid forum host: ${forumPath}`);
      return [];
    }
    // if(!await this.checkAuth(this.cookieJar)) {
    //   const auth = await this.login(this.credential);
    //   if(!auth) {
    //     vscode.window.showInformationMessage("Invalid authentication.");
    //     return [];
    //   }
    // }

    let forumDoc: string;
    try {
      forumDoc = await got(forumPath, { cookieJar: this.cookieJar }).text();
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

    const entries = $("#content li a")
      .map((i, el) => {
        const link: string = $(el).attr("href") || "#";
        const title: string = $(el).text();
        // console.log(link);
        if (link.includes("fid-")) {
          return new BoardTitle(
            title,
            link,
            vscode.TreeItemCollapsibleState.Collapsed
          );
        } else if (link.includes("tid-")) {
          return new ThreadlTitle(
            title,
            link,
            vscode.TreeItemCollapsibleState.None
          );
        }
      })
      .get();
    return entries;
  }
}

export class ThreadlTitle extends vscode.TreeItem {
  constructor(
    public readonly title: string,
    public readonly link: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(title, collapsibleState);
    this.tooltip = this.title;
    // this.description = this.link.slice(0,-5);
    this.description = "";
    this.contextValue = "thread";
    this.command = {
      title: "Show Thread",
      command: "opens1.showthread",
      arguments: [
        vscode.Uri.parse(`s1:${this.href}`),
      ],
    };
    // this.command = vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${S1URL.host}${this.href}`));
  }

  private page: number = 1;

  public href: string = `${this.link}?page=${this.page}`;

  nextPage() {
    if (this.page <= 10) {
      this.page += 1;
      this.href = `${this.link}?page=${this.page}`;
    }
  }

  lastPage() {
    if (this.page > 1) {
      this.page -= 1;
      this.href = `${this.link}?page=${this.page}`;
    }
  }
}

export class BoardTitle extends vscode.TreeItem {
  constructor(
    public readonly title: string,
    public readonly link: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(title, collapsibleState);
    this.tooltip = this.title;
    // this.description = this.link.slice(0,-5);
    this.description = "";
    this.contextValue = "board";
  }

  iconPath = {
    light: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "light",
      "comment-discussion.svg"
    ),
    dark: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "dark",
      "comment-discussion.svg"
    ),
  };

  private page: number = 1;

  public href: string = `${this.link}?page=${this.page}`;

  nextPage() {
    if (this.page <= 10) {
      this.page += 1;
      this.href = `${this.link}?page=${this.page}`;
    }
  }

  lastPage() {
    if (this.page > 1) {
      this.page -= 1;
      this.href = `${this.link}?page=${this.page}`;
    }
  }
}
