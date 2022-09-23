// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
  ForumTitleProvider,
  ThreadTitle,
  S1URL,
  Credential,
  GUEST,
  BoardTitle,
} from "./forum";
import { CookieJar } from "tough-cookie";
import { checkCredential, loginPrompt } from "./lib";
import { ThreadProvider } from "./thread";
import { registerCommands } from "./registerCommands";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const credential: Credential = await checkCredential();
  const cookieJar: CookieJar = new CookieJar();

  const stage1stProvider = new ForumTitleProvider(credential, cookieJar);
  const threadProvider = new ThreadProvider(cookieJar);
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider("s1", threadProvider)
  );
  registerCommands(context, stage1stProvider);
}

// this method is called when your extension is deactivated
export function deactivate() {}
