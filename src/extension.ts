// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ForumTitleProvider } from "./threads/ForumTitle";
import { Credential, GUEST } from "./types/S1types";
import { CookieJar } from "tough-cookie";
import { checkCredential, login } from "./libs/auth";
import ThreadProvider from "./threads/ThreadProvider";
import registerForum from "./libs/registerForum";
import { socketIOInit } from "./libs/webrtc";
import { Socket } from "socket.io-client";
import { MemberInfoProvider } from "./member/Members";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const credential: Credential = await checkCredential();
  const cookieJar: CookieJar = new CookieJar();
  const stage1stProvider = new ForumTitleProvider(cookieJar, credential);
  const socket: Socket = await socketIOInit(stage1stProvider);

  credential !== GUEST && (await login(credential, cookieJar, socket));

  const threadProvider = new ThreadProvider(cookieJar);
  const memberInfoProvider = new MemberInfoProvider(cookieJar);
  registerForum(
    context.subscriptions,
    stage1stProvider,
    cookieJar,
    threadProvider,
    memberInfoProvider,
    socket
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
