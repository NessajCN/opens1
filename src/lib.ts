import * as vscode from "vscode";
import { findCredentials } from "keytar";
import { S1URL, Credential, GUEST } from "./forum";

export const checkCredential = async () => {
  const storedCredentials = await findCredentials(S1URL.title);
  if (storedCredentials.length) {
    const credential: Credential = {
      username: storedCredentials[0].account,
      password: storedCredentials[0].password,
    };
    // vscode.commands.executeCommand(
    //     "setContext",
    //     "opens1.authenticated",
    //     false
    //   );
    return credential;
  } else {
    // vscode.commands.executeCommand(
    //     "setContext",
    //     "opens1.authenticated",
    //     false
    //   );
    return GUEST;
  }
};

export const loginPrompt = async () => {
  const userOption: vscode.InputBoxOptions = {
    title: "Account login",
    prompt: "Your account:",
  };
  const passOption: vscode.InputBoxOptions = {
    title: "Account login",
    prompt: "Your password:",
    password: true,
  };
  const inputUser: string | undefined = await vscode.window.showInputBox(
    userOption
  );
  if (!inputUser) {
    return GUEST;
  }
  const inputPass: string | undefined = await vscode.window.showInputBox(
    passOption
  );
  if (!inputPass) {
    return GUEST;
  }
  const credential: Credential = {
    username: inputUser,
    password: inputPass,
  };
  return credential;
};
