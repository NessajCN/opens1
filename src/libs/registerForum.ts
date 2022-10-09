import {
  window,
  commands,
  ExtensionContext,
  workspace,
  languages,
} from "vscode";
import {
  ForumTitleProvider,
  BoardTitle,
  ThreadTitle,
  AccountTitle,
} from "../threads/ForumTitle";
import { loginPrompt, logout, login } from "./auth";
import { CookieJar } from "tough-cookie";
import { submitReply, submitNewPost, submitQuotedReply } from "./submit";
import { replyPrompt, newpostPrompt } from "./prompt";

import ThreadProvider from "../threads/ThreadProvider";
import { Socket } from "socket.io-client";
import { GUEST } from "../types/S1types";
import { MemberInfoProvider } from "../member/Members";
import { QuotedReplyProvider } from "../threads/QuotedReply";

const showThread = async (thread: ThreadTitle) => {
  const displayStyle = workspace
    .getConfiguration("opens1")
    .get<string>("threadDisplayStyle");
  if (displayStyle === "markdown") {
    await commands.executeCommand("markdown.showPreview", thread.threadUri);
  } else {
    await window.showTextDocument(thread.threadUri, { preview: true });
  }
};

const registerForum = (
  subscriptions: ExtensionContext["subscriptions"],
  forumProvider: ForumTitleProvider,
  cookieJar: CookieJar,
  threadProvider: ThreadProvider,
  memberInfoProvider: MemberInfoProvider,
  quotedReplyProvider: QuotedReplyProvider,
  socket: Socket,
  onlineUsers: Map<string, string>
) => {
  let currentThread: ThreadTitle | undefined;

  // const displayStyle = workspace
  //   .getConfiguration("opens1")
  //   .get<string>("threadDisplayStyle");

  const getThread = (thread?: ThreadTitle | undefined) => {
    if (!thread && currentThread) {
      if (
        !window.tabGroups.activeTabGroup.activeTab ||
        (window.activeTextEditor &&
          currentThread?.threadUri.toString() !==
            window.activeTextEditor.document.uri.toString())
      ) {
        return undefined;
      }
      return currentThread;
    } else {
      return thread;
    }
  };

  subscriptions.push(
    languages.registerHoverProvider({ scheme: "s1" }, memberInfoProvider)
  );
  subscriptions.push(
    languages.registerHoverProvider({ scheme: "s1" }, quotedReplyProvider)
  );

  subscriptions.push(
    workspace.registerTextDocumentContentProvider("s1", threadProvider)
  );

  subscriptions.push(
    window.registerTreeDataProvider("stage1st", forumProvider)
  );
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log('Congratulations, your extension "opens1" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  subscriptions.push(
    commands.registerCommand("opens1.configure", () => {
      commands.executeCommand("workbench.action.openSettings", `OpenS1`);
    })
  );

  subscriptions.push(
    commands.registerCommand("opens1.refresh", () => {
      // The code you place here will be executed every time your command is executed
      // window.showInformationMessage("refreshed!");
      forumProvider.refresh();
    })
  );

  subscriptions.push(
    commands.registerCommand("opens1.fetchallusers", () => {
      socket.emit("fetchAllUsers");
    })
  );

  subscriptions.push(
    commands.registerCommand(
      "opens1.updateview",
      (board: BoardTitle | AccountTitle) => {
        if (board instanceof BoardTitle) {
          forumProvider.turnBoardPage(board, 1);
        } else if (board instanceof AccountTitle) {
          forumProvider.updateView(board);
        }
      }
    )
  );

  subscriptions.push(
    commands.registerCommand("opens1.hideboard", async (board: BoardTitle) => {
      const conf = workspace.getConfiguration("opens1");
      const hiddenBoards = conf.get<string[]>("hiddenBoards");
      if (!hiddenBoards) {
        await conf.update("hiddenBoards", [board.title]);
      } else {
        hiddenBoards.push(board.title);
        await conf.update("hiddenBoards", hiddenBoards);
      }
      forumProvider.refresh();
      window.showInformationMessage(
        `${board.title} has been hidden. Go to extension setting page to unhide them if you wish.`
      );
    })
  );
  subscriptions.push(
    commands.registerCommand("opens1.nextboardpage", (board: BoardTitle) => {
      forumProvider.turnBoardPage(board, board.page + 1);
    })
  );
  subscriptions.push(
    commands.registerCommand("opens1.lastboardpage", (board: BoardTitle) => {
      forumProvider.turnBoardPage(board, board.page - 1);
    })
  );

  subscriptions.push(
    commands.registerCommand(
      "opens1.nextthreadpage",
      async (thread?: ThreadTitle | undefined) => {
        thread = getThread(thread);
        if (thread) {
          forumProvider.turnThreadPage(thread, thread.page + 1);
          threadProvider.refresh(thread.threadUri);
          currentThread = thread;
          await showThread(thread);
        }
      }
    )
  );
  subscriptions.push(
    commands.registerCommand(
      "opens1.lastthreadpage",
      async (thread?: ThreadTitle | undefined) => {
        thread = getThread(thread);
        if (thread) {
          forumProvider.turnThreadPage(thread, thread.page - 1);
          currentThread = thread;
          await showThread(thread);
        }
      }
    )
  );
  subscriptions.push(
    commands.registerCommand(
      "opens1.latestthreadpage",
      async (thread?: ThreadTitle | undefined) => {
        thread = getThread(thread);
        if (thread) {
          forumProvider.turnThreadPage(thread, thread.pagination);
          currentThread = thread;
          await showThread(thread);
        }
      }
    )
  );
  subscriptions.push(
    commands.registerCommand(
      "opens1.turntopage",
      async (thread?: ThreadTitle | undefined) => {
        thread = getThread(thread);
        if (thread) {
          const page = await window.showInputBox({
            title: "跳转页码",
            prompt: `共${thread.pagination}页, 当前第${thread.page}页`,
          });
          if (!page || Number.isNaN(Number(page))) {
            window.showWarningMessage(
              "Invalid input. Please enter the number of page."
            );
            return;
          } else if (Number(page) < 1 || Number(page) > thread.pagination) {
            window.showWarningMessage("Invalid page number.");
            return;
          }
          forumProvider.turnThreadPage(thread, Number(page));
          currentThread = thread;
          await showThread(thread);
        }
      }
    )
  );
  subscriptions.push(
    commands.registerCommand("opens1.signin", async () => {
      const logininfo = await loginPrompt();
      const authenticated = await login(logininfo, cookieJar, socket);
      if (authenticated) {
        forumProvider.credential = logininfo;
        window.showInformationMessage(
          `Successfully signed in as ${logininfo.username}!`
        );
      } else {
        forumProvider.credential = GUEST;
        window.showErrorMessage("Authentication failed.");
      }
      forumProvider.refresh();
    })
  );
  subscriptions.push(
    commands.registerCommand("opens1.signout", async () => {
      await logout(cookieJar, socket);
      forumProvider.credential = GUEST;
      forumProvider.refresh();
      window.showInformationMessage("You have logged out.");
    })
  );

  subscriptions.push(
    commands.registerCommand(
      "opens1.quotedreply",
      async ({ tid, fid, pid }) => {
        const replytext = await replyPrompt();
        if (!replytext) {
          return;
        } else {
          const quotedAuthor = await submitQuotedReply(
            tid,
            fid,
            pid,
            replytext,
            cookieJar,
            socket,
            onlineUsers
          );
          const thread = getThread();
          if (thread) {
            forumProvider.turnThreadPage(thread, thread.pagination);
            currentThread = thread;
            threadProvider.refresh(thread.threadUri);
            if (
              quotedAuthor &&
              new Set([...onlineUsers.values()]).has(quotedAuthor)
            ) {
              socket.emit("notify", { quotedAuthor, thread });
            }
          }
          window.showInformationMessage("Quoted Reply submitted.");
        }
      }
    )
  );

  subscriptions.push(
    commands.registerCommand(
      "opens1.reply",
      async (thread?: ThreadTitle | undefined) => {
        const replytext = await replyPrompt();
        if (!replytext) {
          return;
        } else {
          thread = getThread(thread);
          if (thread) {
            const response = await submitReply(
              thread.tid,
              thread.fid,
              replytext,
              cookieJar
            );
            forumProvider.turnThreadPage(thread, thread.pagination);
            threadProvider.refresh(thread.threadUri);
            window.showInformationMessage("Reply submitted.");
          }
        }
      }
    )
  );

  subscriptions.push(
    commands.registerCommand("opens1.newpost", async (board: BoardTitle) => {
      const newpost = await newpostPrompt();
      if (!newpost) {
        return;
      } else {
        const response = await submitNewPost(board.fid, newpost, cookieJar);
        forumProvider.updateView(board);
        window.showInformationMessage("New post submitted.");
      }
    })
  );

  subscriptions.push(
    commands.registerCommand(
      "opens1.showthread",
      async (thread: ThreadTitle) => {
        threadProvider.refresh(thread.threadUri);
        currentThread = thread;
        await showThread(thread);
      }
    )
  );
};

export default registerForum;
