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

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const credential: Credential = await checkCredential();
  const cookieJar: CookieJar = new CookieJar();
  const onlineUsers = new Map();
  const socket = await socketIOInit(
    credential === GUEST ? null : credential.username,
    onlineUsers
  );

  credential !== GUEST && (await login(credential, cookieJar));

  const stage1stProvider = new ForumTitleProvider(cookieJar);
  const threadProvider = new ThreadProvider(cookieJar);
  registerForum(
    context.subscriptions,
    stage1stProvider,
    cookieJar,
    threadProvider
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
