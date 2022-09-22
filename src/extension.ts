// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
  ForumTitleProvider,
  ThreadlTitle,
  S1URL,
  Credential,
  GUEST,
} from "./forum";
import { CookieJar } from "tough-cookie";
import { checkCredential, loginPrompt } from "./lib";
import { ThreadProvider } from "./thread";

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
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("stage1st", stage1stProvider)
  );
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log('Congratulations, your extension "opens1" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand("opens1.refresh", () => {
      // The code you place here will be executed every time your command is executed
      // vscode.window.showInformationMessage("refreshed!");
      stage1stProvider.refresh();
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("opens1.signin", async () => {
      // The code you place here will be executed every time your command is executed
      const logininfo = await loginPrompt();
      const authenticated = await stage1stProvider.login(logininfo);
      authenticated
        ? vscode.window.showInformationMessage(
            `Successfully signed in as ${logininfo.username}!`
          )
        : vscode.window.showInformationMessage("Authentication failed.");
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("opens1.signout", async () => {
      // The code you place here will be executed every time your command is executed
      await stage1stProvider.logout();
      vscode.window.showInformationMessage("You have logged out.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "opens1.showthread",
      async (uri: vscode.Uri) => {
        // The code you place here will be executed every time your command is executed
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preview: true });
      }
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
