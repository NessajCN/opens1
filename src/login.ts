// import * as vscode from "vscode";
// import { findCredentials,setPassword } from "keytar";
// import { Credential, S1URL } from "./forum";
// import { CookieJar } from 'tough-cookie';

// const jar = new CookieJar();
// const fetch = fetchCookie(nodeFetch, jar);
// // const fetch = fetchCookie(nodeFetch);


// const formHash = async (path: string) => {
//   const response: Response = await fetch(path);
//   const result = response.ok ? await response.text() : null;
//   const relogin: RegExp = /<div id="main_messaqge_(.+?)">/;
//   const reform: RegExp =
//     /<input type="hidden" name="formhash" value="(.+?)" \/>/;
//   const malogin =
//     path.includes("action=login") && result ? result.match(relogin) : null;
//   const maform = result ? result.match(reform) : null;
//   const loginhash = malogin ? malogin[1] : null;
//   const formhash = maform ? maform[1] : null;
//   return { loginhash, formhash };
// };

// export const checkAuth = async (cookiejar) => {
//   const cookie = await cookiejar.getCookies(S1URL.host);
//   // const cookie = cookiejar.globalState.get("cookie");
//   if (cookie && "B7Y9_2132_auth" in cookie) {
//     vscode.commands.executeCommand("setContext", "opens1.authenticated", true);
//     vscode.window.showInformationMessage(`Logged in as`);
//     return true;
//   } else {
//     vscode.commands.executeCommand("setContext", "opens1.authenticated", false);
//     return false;
//   }
// };

// export const login = async (credential: Credential) => {
//   const { loginhash, formhash } = await formHash(S1URL.loginPath);
//   const loginURL: string = `${S1URL.host}${S1URL.loginPath}&loginsubmit=yes&loginhash=${loginhash}&inajax=1`;
//   const formdata = {
//     formhash: formhash,
//     referer: S1URL.host,
//     loginfield: credential.username,
//     username: credential.username,
//     password: credential.password,
//     questionid: "0",
//     answer: "",
//     cookietime: 2592000,
//   };
//   const response: Response = await fetch(loginURL, {
//     method: "POST",
//     body: JSON.stringify(formdata),
//   });
//   if(response.ok) {
//     return true;
//   } else {
//     return false;
//   }

// };
