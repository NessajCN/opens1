import { CookieJar } from "tough-cookie";
import * as cheerio from "cheerio";
import got from "got";
import { S1URL, NewPostForm, ReplyForm, Newpost } from "../types/S1types";
import { getFormHash } from "./auth";
import { Socket } from "socket.io-client";
import { workspace } from "vscode";

const charFix = (text: string) => {
  const charList =
    workspace.getConfiguration("opens1").get<string[]>("chars2bFixed") || [];

  charList.forEach((chars) => {
    if (text.includes(chars)) {
      const re = new RegExp(chars,"g");
      text = text.replace(re, (word) =>
        word
          .split("")
          .map((char) => `&#${char.charCodeAt(0)};`)
          .join("")
      );
    }
  });
  return text;
};

export const submitNewPost = async (
  fid: number,
  newpost: Newpost,
  cookieJar: CookieJar
) => {
  const { loginhash: _, formhash } = await getFormHash(
    S1URL.newPostPath,
    cookieJar
  );
  const newPostForm: NewPostForm = {
    formhash: formhash || "",
    posttime: Math.floor(Date.now() / 1000),
    wysiwyg: "1",
    typeid: 151,
    subject: charFix(newpost.subject),
    message: charFix(newpost.message),
    readperm: 0,
    allownoticeauthor: "1",
    usesig: "1",
    save: "",
    cookietime: 2592000,
  };
  const newPostURL = `${S1URL.host}/forum.php?mod=post&action=newthread&fid=${fid}&extra=&topicsubmit=yes`;
  const response = await got(newPostURL, {
    cookieJar: cookieJar,
    method: "POST",
    form: newPostForm,
  }).text();
  return response;
};

export const submitQuotedReply = async (
  tid: string,
  fid: string,
  pid: string,
  replytext: string,
  cookieJar: CookieJar,
  socket: Socket,
  onlineUsers: Map<string, string>
) => {
  const doc = await got(
    `${S1URL.host}${S1URL.replyPath}&fid=${fid}&extra=&tid=${tid}&repquote=${pid}`,
    { cookieJar }
  ).text();
  const $ = cheerio.load(doc);
  const replyForm: ReplyForm = {
    formhash: "",
    posttime: Math.floor(Date.now() / 1000),
    wysiwyg: "1",
    noticeauthor: "",
    noticetrimstr: "",
    noticeauthormsg: "",
    reppid: pid,
    reppost: pid,
    subject: "",
    message: charFix(replytext),
    usesig: "1",
    save: "",
    cookietime: 2592000,
  };

  $("#ct")
    .children()
    .each((i, el) => {
      switch ($(el).attr("name")) {
        case "formhash": {
          replyForm.formhash = $(el).attr("value") || "";
          break;
        }
        case "noticeauthor": {
          replyForm.noticeauthor = $(el).attr("value") || "";
          break;
        }
        case "noticetrimstr": {
          replyForm.noticetrimstr = $(el).attr("value") || "";
          break;
        }
        case "noticeauthormsg": {
          replyForm.noticeauthormsg = $(el).attr("value") || "";
          break;
        }
        default: {
          break;
        }
      }
    });

  // Find quoted author name and see if it's an online user of opens1.
  const quotedAuthorArray = replyForm.noticetrimstr?.match(
    /\[color=#999999\](.+?)发表于/
  );
  const quotedAuthor =
    quotedAuthorArray && quotedAuthorArray[1]
      ? quotedAuthorArray[1].trim()
      : null;

  const replyURL = `${S1URL.host}/forum.php?mod=post&action=reply&fid=${fid}&tid=${tid}&extra=&replysubmit=yes`;
  const response = await got(replyURL, {
    cookieJar: cookieJar,
    method: "POST",
    form: replyForm,
  }).text();
  return quotedAuthor;
};

export const submitReply = async (
  tid: number,
  fid: number,
  replytext: string,
  cookieJar: CookieJar
) => {
  const { loginhash: _, formhash } = await getFormHash(
    S1URL.replyPath,
    cookieJar
  );
  const replyForm: ReplyForm = {
    formhash: formhash || "",
    posttime: Math.floor(Date.now() / 1000),
    wysiwyg: "1",
    noticeauthor: "",
    noticetrimstr: "",
    noticeauthormsg: "",
    subject: "",
    message: charFix(replytext),
    usesig: "1",
    save: "",
    cookietime: 2592000,
  };
  const replyURL = `${S1URL.host}/forum.php?mod=post&action=reply&fid=${fid}&tid=${tid}&extra=&replysubmit=yes`;
  const response = await got(replyURL, {
    cookieJar: cookieJar,
    method: "POST",
    form: replyForm,
  }).text();
  return response;
};
