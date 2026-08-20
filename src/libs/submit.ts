import { CookieJar } from "tough-cookie";
import * as cheerio from "cheerio";
import got from "got";
import { S1URL, NewPostForm, ReplyForm, Newpost } from "../types/S1types";
import { getFormHash } from "./auth";
import { workspace } from "vscode";
import { FavoriteThreadTitle, ThreadTitle } from "../threads/ForumTitle";
import {
  PostResult,
  forumRefererHeaders,
  parsePostResult,
} from "./postResult";

const charFix = (text: string) => {
  const charList =
    workspace.getConfiguration("opens1").get<string[]>("chars2bFixed") || [];

  charList.forEach((chars) => {
    if (text.includes(chars)) {
      const re = new RegExp(chars, "g");
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

const postHeaders = (tid?: number | string, fid?: number | string) => {
  if (tid !== undefined && fid !== undefined) {
    return forumRefererHeaders(`/forum.php?mod=viewthread&tid=${tid}`);
  }
  return forumRefererHeaders("/forum.php");
};

export const submitNewPost = async (
  fid: number,
  newpost: Newpost,
  cookieJar: CookieJar
): Promise<PostResult> => {
  const { loginhash: _, formhash } = await getFormHash(
    `${S1URL.newPostPath}&fid=${fid}`,
    cookieJar
  );
  if (!formhash) {
    return { ok: false, message: "Failed to get formhash. Please re-login." };
  }
  const newPostForm: NewPostForm = {
    formhash,
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
    headers: postHeaders(undefined, fid),
  }).text();
  return parsePostResult(response);
};

export const submitQuotedReply = async (
  tid: string,
  fid: string,
  pid: string,
  replytext: string,
  cookieJar: CookieJar
): Promise<{ author: string | null; result: PostResult }> => {
  const doc = await got(
    `${S1URL.host}${S1URL.replyPath}&fid=${fid}&extra=&tid=${tid}&repquote=${pid}`,
    { cookieJar, headers: postHeaders(tid, fid) }
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

  $("input[type='hidden']").each((_, el) => {
    const name = $(el).attr("name");
    const value = $(el).attr("value") || "";
    switch (name) {
      case "formhash":
        replyForm.formhash = value;
        break;
      case "noticeauthor":
        replyForm.noticeauthor = value;
        break;
      case "noticetrimstr":
        replyForm.noticetrimstr = value;
        break;
      case "noticeauthormsg":
        replyForm.noticeauthormsg = value;
        break;
      default:
        break;
    }
  });

  if (!replyForm.formhash) {
    return {
      author: null,
      result: {
        ok: false,
        message: "Failed to get formhash for quoted reply. Please re-login.",
      },
    };
  }

  // Find quoted author name and see if it's an online user of opens1.
  const quotedAuthorArray = replyForm.noticetrimstr?.match(
    /\[color=#999999\](.+?)发表于/
  );
  const quotedAuthor =
    quotedAuthorArray && quotedAuthorArray[1]
      ? quotedAuthorArray[1].trim()
      : null;

  const replyURL = `${S1URL.host}/forum.php?mod=post&action=reply&fid=${fid}&tid=${tid}&extra=&replysubmit=yes&infloat=yes&handlekey=fastpost&inajax=1`;
  const response = await got(replyURL, {
    cookieJar: cookieJar,
    method: "POST",
    form: replyForm,
    headers: postHeaders(tid, fid),
  }).text();
  return { author: quotedAuthor, result: parsePostResult(response) };
};

export const submitReply = async (
  tid: number,
  fid: number,
  replytext: string,
  cookieJar: CookieJar
): Promise<PostResult> => {
  const { loginhash: _, formhash } = await getFormHash(
    `${S1URL.replyPath}&fid=${fid}&tid=${tid}`,
    cookieJar
  );
  if (!formhash) {
    return { ok: false, message: "Failed to get formhash. Please re-login." };
  }
  const replyForm: ReplyForm = {
    formhash,
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
  // Match forum fastpost endpoint; Referer is required by Discuz submitcheck.
  const replyURL = `${S1URL.host}/forum.php?mod=post&action=reply&fid=${fid}&tid=${tid}&extra=&replysubmit=yes&infloat=yes&handlekey=fastpost&inajax=1`;
  const response = await got(replyURL, {
    cookieJar: cookieJar,
    method: "POST",
    form: replyForm,
    headers: postHeaders(tid, fid),
  }).text();
  return parsePostResult(response);
};

export const favorite = async (thread: ThreadTitle, cookieJar: CookieJar) => {
  const { loginhash: _, formhash } = await getFormHash(
    `/thread-${thread.tid}-1-1.html`,
    cookieJar
  );
  await got(
    `${S1URL.host}${S1URL.favoritePath}&id=${thread.tid}&formhash=${formhash}`,
    {
      cookieJar,
      headers: postHeaders(thread.tid, thread.fid),
    }
  );
};

export const unfavorite = async (
  thread: FavoriteThreadTitle,
  cookieJar: CookieJar
) => {
  const { loginhash: _, formhash } = await getFormHash(
    S1URL.favReferer,
    cookieJar
  );
  await got(
    `${S1URL.host}${S1URL.favoritePath}&op=delete&favid=${thread.favid}`,
    {
      method: "POST",
      form: {
        referer: `${S1URL.host}${S1URL.favReferer}`,
        deletesubmit: "true",
        formhash,
        handlekey: `a_delete_${thread.favid}`,
      },
      cookieJar,
      headers: forumRefererHeaders(S1URL.favReferer),
    }
  );
};
