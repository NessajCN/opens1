import * as vscode from "vscode";
import {
  ForumTitleProvider,
  BoardTitle,
  ThreadTitle,
} from "./forum";
import { loginPrompt } from "./lib";

export const registerCommands = (
    context: vscode.ExtensionContext,
    forumProvider: ForumTitleProvider
  ) => {
    context.subscriptions.push(
      vscode.window.registerTreeDataProvider("stage1st", forumProvider)
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
        forumProvider.refresh();
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "opens1.updateview",
        (board: BoardTitle) => {
          forumProvider.turnBoardPage(board, 1);
        }
      )
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "opens1.nextboardpage",
        (board: BoardTitle) => {
          forumProvider.turnBoardPage(board, board.page + 1);
        }
      )
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "opens1.lastboardpage",
        (board: BoardTitle) => {
          forumProvider.turnBoardPage(board, board.page - 1);
        }
      )
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("opens1.signin", async () => {
        const logininfo = await loginPrompt();
        const authenticated = await forumProvider.login(logininfo);
        authenticated
          ? vscode.window.showInformationMessage(
              `Successfully signed in as ${logininfo.username}!`
            )
          : vscode.window.showInformationMessage("Authentication failed.");
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("opens1.signout", async () => {
        await forumProvider.logout();
        vscode.window.showInformationMessage("You have logged out.");
      })
    );
  
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "opens1.showthread",
        // async (uri: vscode.Uri) => {
        //   const doc = await vscode.workspace.openTextDocument(uri);
        //   await vscode.window.showTextDocument(doc, { preview: true });
        // }
        async (thread: ThreadTitle) => {
          // const uri: vscode.Uri = vscode.Uri.parse(`s1:${thread.path}?page=${thread.page}`);
          const uri: vscode.Uri = vscode.Uri.parse(`s1:${thread.path.slice(4,-5)}.md?page=${thread.page}`);
          const doc = await vscode.workspace.openTextDocument(uri);
          await vscode.window.showTextDocument(doc, { preview: true });
        }
      )
    );
  };
  