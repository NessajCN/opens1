import { ExtensionContext, InputBoxOptions, SecretStorage, commands, window } from "vscode";
import {
  S1URL,
  Credential,
  GUEST,
  FormHash,
  LoginForm,
} from "../types/S1types";
import got from "got";
import { CookieJar, Cookie } from "tough-cookie";
import { Socket } from "socket.io-client";

let secretStorage: SecretStorage;

export const initAuthHelper = (context: ExtensionContext) => {
  secretStorage = context.secrets;
};

export const checkCredential = async () => {
  const username = await secretStorage.get("username");
  const password = await secretStorage.get("password");
  if (username !== undefined && password !== undefined) {
    return {
      username,
      password
    };
  } else {
    return GUEST;
  }
};

export const loginPrompt = async () => {
  const userOption: InputBoxOptions = {
    title: "登录",
    prompt: "论坛账号:",
  };
  const passOption: InputBoxOptions = {
    title: "登录",
    prompt: "密码:",
    password: true,
  };
  const inputUser: string | undefined = await window.showInputBox(userOption);
  if (!inputUser) {
    return GUEST;
  }
  const inputPass: string | undefined = await window.showInputBox(passOption);
  if (!inputPass) {
    return GUEST;
  }
  const credential: Credential = {
    username: inputUser,
    password: inputPass,
  };
  return credential;
};

export const checkAuth = async (cookieJar: CookieJar) => {
  const cookies: Cookie[] = await cookieJar.getCookies(S1URL.host);
  const check: boolean = cookies
    .map((cookie: Cookie) => cookie.key)
    .includes("B7Y9_2132_auth");
  commands.executeCommand("setContext", "opens1.authenticated", check);
  return check;
};

export const getFormHash = async (
  path: string,
  cookieJar: CookieJar
): Promise<FormHash> => {
  const result = await got(`${S1URL.host}${path}`, { cookieJar }).text();
  const relogin: RegExp = /<div id="main_messaqge_(.+?)">/;
  const reform: RegExp =
    /<input type="hidden" name="formhash" value="(.+?)" \/>/;
  const malogin =
    path.includes("action=login") && result ? result.match(relogin) : null;
  const maform = result ? result.match(reform) : null;
  const formHash: FormHash = {
    loginhash: malogin ? malogin[1] : null,
    formhash: maform ? maform[1] : null,
  };
  return formHash;
};

export const clearStoredCredentials = async () => {
  await secretStorage.delete("username");
  await secretStorage.delete("password");
  commands.executeCommand("setContext", "opens1.authenticated", false);
};

export const logout = async (cookieJar: CookieJar, socket: Socket) => {
  const { loginhash: _, formhash } = await getFormHash(
    `${S1URL.logoutPath}`,
    cookieJar
  );
  const logoutURL: string = `${S1URL.host}${S1URL.logoutPath}&formhash=${formhash}`;
  await got(logoutURL, { cookieJar }).text();
  await clearStoredCredentials();
  socket.emit("signout");
};

export const login = async (
  credential: Credential,
  cookieJar: CookieJar,
  socket: Socket
) => {
  if (credential === GUEST) {
    await clearStoredCredentials();
    return false;
  }
  const { loginhash, formhash } = await getFormHash(
    `${S1URL.loginPath}`,
    cookieJar
  );
  const loginURL: string = `${S1URL.host}${S1URL.loginPath}&loginsubmit=yes&loginhash=${loginhash}&inajax=1`;
  const loginform: LoginForm = {
    formhash: formhash || "",
    referer: S1URL.host,
    loginfield: credential.username,
    username: credential.username,
    password: credential.password,
    questionid: "0",
    answer: "",
    cookietime: 2592000,
  };
  await got(loginURL, {
    cookieJar: cookieJar,
    method: "POST",
    form: loginform,
  });
  const auth = await checkAuth(cookieJar);
  if (auth) {
    await secretStorage.store("username", credential.username);
    await secretStorage.store("password", credential.password);
    socket.emit("identify", credential.username);
  } else {
    await clearStoredCredentials();
  }
  commands.executeCommand("setContext", "opens1.authenticated", auth);
  return auth;
};
