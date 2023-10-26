// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext } from "vscode";
import { ForumTitleProvider } from "./threads/ForumTitle";
import { Credential, GUEST } from "./types/S1types";
import { CookieJar } from "tough-cookie";
import { checkCredential, login } from "./libs/auth";
import ThreadProvider from "./threads/ThreadProvider";
import registerForum from "./libs/registerForum";
import { socketIOInit } from "./libs/webrtc";
import { MemberInfoProvider } from "./member/Members";
import { QuotedReplyProvider } from "./threads/QuotedReply";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
  const credential: Credential = await checkCredential(context.secrets);
  const cookieJar: CookieJar = new CookieJar();
  const stage1stProvider = new ForumTitleProvider(cookieJar, credential);
  const onlineUsers: Map<string, string> = new Map();
  const socket = await socketIOInit(stage1stProvider, onlineUsers);

  credential !== GUEST &&
    (await login(context.secrets, credential, cookieJar, socket));

  const threadProvider = new ThreadProvider(cookieJar);
  const memberInfoProvider = new MemberInfoProvider(cookieJar);
  const quotedReplyProvider = new QuotedReplyProvider();
  registerForum(
    context.subscriptions,
    context.secrets,
    stage1stProvider,
    cookieJar,
    threadProvider,
    memberInfoProvider,
    quotedReplyProvider,
    socket
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
