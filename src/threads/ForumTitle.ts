import {
  TreeDataProvider,
  Event,
  EventEmitter,
  TreeItem,
  ProviderResult,
  TreeItemCollapsibleState,
  ThemeIcon,
  Uri,
  workspace,
} from "vscode";
import { Credential, S1URL } from "../types/S1types";
import * as cheerio from "cheerio";
import got from "got";
import { CookieJar } from "tough-cookie";
import { checkAuth } from "../libs/auth";

export class ForumTitleProvider
  implements
    TreeDataProvider<ThreadTitle | BoardTitle | AccountTitle | OnlineUser>
{
  private _onDidChangeTreeData: EventEmitter<
    ThreadTitle | BoardTitle | AccountTitle | OnlineUser | undefined | void
  > = new EventEmitter<
    ThreadTitle | BoardTitle | AccountTitle | OnlineUser | undefined | void
  >();

  readonly onDidChangeTreeData: Event<
    ThreadTitle | BoardTitle | AccountTitle | OnlineUser | undefined | void
  > = this._onDidChangeTreeData.event;

  public accounts: AccountTitle | undefined;
  public favorites: BoardTitle | undefined;

  constructor(private cookieJar: CookieJar, public credential: Credential) {}

  public opens1Users: Set<string> = new Set();

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  updateView(
    element: BoardTitle | ThreadTitle | AccountTitle | OnlineUser
  ): void {
    this._onDidChangeTreeData.fire(element);
  }

  getTreeItem(
    element: ThreadTitle | BoardTitle | AccountTitle | OnlineUser
  ): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(
    element?: ThreadTitle | BoardTitle | AccountTitle | OnlineUser | undefined
  ): ProviderResult<(ThreadTitle | BoardTitle | AccountTitle | OnlineUser)[]> {
    if (element && element instanceof BoardTitle) {
      return this.getForumEntries(element);
    } else if (
      element &&
      (element instanceof ThreadTitle || element instanceof OnlineUser)
    ) {
      // ThreadTitle or OnlineUser won't call getChildren as it's collapseState is set to None.
      // This condition block can be ignored.
      return [];
    } else if (element && element instanceof AccountTitle) {
      return Array.from(this.opens1Users.keys()).map(
        (user) =>
          new OnlineUser(
            user,
            user === this.credential.username
            // TreeItemCollapsibleState.None
          )
      );
    } else {
      return checkAuth(this.cookieJar).then((auth) => {
        return auth
          ? this.getForumEntries().then((boardTitles) => {
              this.favorites = new FavoritesTitle(
                "Favorites",
                "home.php?mod=space&do=favorite&type=thread"
                // TreeItemCollapsibleState.Collapsed
              );
              this.accounts = new AccountTitle(
                "OpenS1用户"
                // TreeItemCollapsibleState.Collapsed
              );
              const titles = [this.favorites, ...boardTitles, this.accounts];
              return titles;
            })
          : this.getForumEntries();
      });
    }
  }

  private async getForumEntries(
    element?: ThreadTitle | BoardTitle | undefined
  ): Promise<(ThreadTitle | BoardTitle)[]> {
    const fetchURL: string = !element
      ? `${S1URL.host}/archiver/`
      : element.title === "Favorites"
      ? `${S1URL.host}/${element.path}`
      : `${S1URL.host}/archiver/${element.path}?page=${element.page}`;

    const forumDoc = await got(fetchURL, { cookieJar: this.cookieJar }).text();

    const $: cheerio.CheerioAPI = cheerio.load(forumDoc);

    const conf =
      workspace.getConfiguration("opens1").get<string[]>("hiddenBoards") || [];

    const entries =
      element?.title === "Favorites"
        ? await Promise.all(
            $("#favorite_ul li")
              .map(async (i, el) => {
                const favid: number = Number($(el).attr("id")?.slice(4));
                $(el).children(`#a_delete_${favid}`).remove();
                const href: string = $(el).children("a").attr("href") || "#";
                const title: string = $(el).children("a").text().trim();
                const tid: number =
                  href.split("-").length > 1 ? Number(href.split("-")[1]) : 0;
                const path: string = `tid-${tid}.html`;
                const lastpost = await this.getFidAndReplies(tid);

                return new FavoriteThreadTitle(
                  title,
                  path,
                  lastpost.fid,
                  lastpost.replies,
                  favid
                );
              })
              .get()
          )
        : $("#content li")
            .map((i, el) => {
              const path: string = $(el).children("a").attr("href") || "#";
              const title: string = $(el).text().trim();
              if (path.includes("fid-") && !conf.includes(title)) {
                return new BoardTitle(
                  title,
                  path
                  // TreeItemCollapsibleState.Collapsed
                );
              } else if (path.includes("tid-")) {
                $(el).children("a").remove();
                const replies: number = Number(
                  $(el).text().trim().slice(1, -4)
                );
                const fid: number = Number(
                  element ? element.path.slice(4, -5) : 0
                );
                return new ThreadTitle(
                  title,
                  path,
                  fid,
                  replies
                  // TreeItemCollapsibleState.None
                );
              }
            })
            .get();
    return entries;
  }

  private async getFidAndReplies(tid: number) {
    const doc = await got(
      `${S1URL.host}/forum.php?mod=redirect&tid=${tid}&goto=lastpost`,
      {
        cookieJar: this.cookieJar,
      }
    ).text();
    const $ = cheerio.load(doc);
    const post = { fid: 0, replies: 0 };
    $("#postlist")
      .children("div")
      .each((i, el) => {
        if ($(el).attr("id")?.startsWith("post_")) {
          const pid = $(el).attr("id")?.slice(5);
          pid &&
            (post.replies = Number(
              $(`#postnum${pid}`).text().trim().replace("#", "")
            ));
        }
      });
    const fidArray = $("#post_reply")
      .attr("onclick")
      ?.match(/&fid=(.+?)&/);
    post.fid = fidArray ? Number(fidArray[1]) : 0;
    return post;
  }

  turnBoardPage(element: BoardTitle, page: number) {
    if (page >= 1 && page <= 10) {
      element.page = page;
      element.description = ` Page ${page}`;
      element.tooltip = `${element.title} page ${page}`;
      element.contextValue = `boardp${page}`;
      this.updateView(element);
    }
  }

  turnThreadPage(element: ThreadTitle, page: number) {
    if (page >= 1 && page <= element.pagination) {
      element.page = page;
      element.description = ` Page ${page}/${element.pagination}`;
      element.tooltip = `${element.title} page ${page}/${element.pagination}`;
      // element.contextValue = `threadp${page}`;
      if (element instanceof FavoriteThreadTitle) {
        element.contextValue =
          element.pagination === 1
            ? `favoriteonepage`
            : element.page >= element.pagination
            ? `favoriteend`
            : element.page === 1
            ? `favoritefirstpage`
            : `favoritepage`;
      } else {
        element.contextValue =
          element.pagination === 1
            ? `threadonepage`
            : element.page >= element.pagination
            ? `threadend`
            : element.page === 1
            ? `threadfirstpage`
            : `threadpage`;
      }
      element.threadUri = Uri.parse(
        `s1:${element.path.slice(4, -5)}-${page}.${element.ext}`
      );
      this.updateView(element);
    }
  }
}

export class ThreadTitle extends TreeItem {
  constructor(
    public readonly title: string,
    public readonly path: string,
    public readonly fid: number,
    public readonly replies: number // public readonly collapsibleState: TreeItemCollapsibleState
  ) {
    super(title, TreeItemCollapsibleState.None);
    this.tooltip = this.title;
    // this.description = this.link.slice(0,-5);
    // this.description = `Page ${this.page}/${this.pagination}`;
    this.contextValue =
      this.pagination === 1
        ? `threadonepage`
        : this.page >= this.pagination
        ? `threadend`
        : this.page === 1
        ? `threadfirstpage`
        : `threadpage`;
    this.command = {
      title: "Show Thread",
      command: "opens1.showthread",
      arguments: [this],
      // arguments: [Uri.parse(`s1:${this.path}?page=${this.page}`)]
    };
  }

  public page: number = 1;
  public pagination: number =
    this.replies === 0 ? 1 : Math.ceil(this.replies / 30);

  private displayStyle = workspace
    .getConfiguration("opens1")
    .get<string>("threadDisplayStyle");

  public ext: string =
    this.displayStyle === "markdown"
      ? "md"
      : this.displayStyle === "typescript"
      ? "ts"
      : this.displayStyle === "python"
      ? "py"
      : this.displayStyle === "cpp"
      ? "cc"
      : "md";

  public threadUri: Uri = Uri.parse(
    `s1:${this.path.slice(4, -5)}-${this.page}.${this.ext}`
  );

  public readonly tid: number = Number(this.path.slice(4, -5));
}

export class BoardTitle extends TreeItem {
  constructor(
    public readonly title: string,
    public readonly path: string // public readonly collapsibleState: TreeItemCollapsibleState
  ) {
    super(title, TreeItemCollapsibleState.Collapsed);
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

  iconPath = new ThemeIcon("comment-discussion");

  public page: number = 1;
  public readonly fid: number = this.path.includes("fid-")
    ? Number(this.path.slice(4, -5))
    : 0;
}

export class AccountTitle extends TreeItem {
  constructor(
    public readonly title: string // public readonly collapsibleState: TreeItemCollapsibleState
  ) {
    super(title, TreeItemCollapsibleState.Collapsed);
    this.contextValue = `accounts`;
  }

  iconPath = new ThemeIcon("account");
}

export class OnlineUser extends TreeItem {
  constructor(
    public readonly username: string,
    public readonly isMe: boolean // public readonly collapsibleState: TreeItemCollapsibleState
  ) {
    super(isMe ? `${username}(Me)` : username, TreeItemCollapsibleState.None);
    this.contextValue = `onlineuser`;
  }

  iconPath = new ThemeIcon("account");
}

export class FavoritesTitle extends BoardTitle {
  constructor(public readonly title: string, public readonly path: string) {
    super(title, path);
    this.iconPath = new ThemeIcon("star-full");
    this.contextValue = "board";
  }
}

export class FavoriteThreadTitle extends ThreadTitle {
  constructor(
    public readonly title: string,
    public readonly path: string,
    public readonly fid: number,
    public readonly replies: number,
    public readonly favid: number
  ) {
    super(`${title}(${replies}篇回复)`, path, fid, replies);
    this.contextValue =
      this.pagination === 1
        ? `favoriteonepage`
        : this.page >= this.pagination
        ? `favoriteend`
        : this.page === 1
        ? `favoritefirstpage`
        : `favoritepage`;
  }

  iconPath = new ThemeIcon("star-empty");
}
