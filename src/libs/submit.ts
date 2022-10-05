import { CookieJar } from "tough-cookie";
import * as cheerio from "cheerio";
import got from "got";
import {
  S1URL,
  NewPostForm,
  ReplyForm,
  Newpost,
} from "../types/S1types";
import { getFormHash } from "./auth";

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
    subject: newpost.subject,
    message: newpost.message,
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
  cookieJar: CookieJar
) => {
  const doc = await got(
    `${S1URL.host}${S1URL.replyPath}&fid=${fid}&extra=&tid=${tid}&repquote=${pid}`,
    {cookieJar}
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
    message: replytext,
    usesig: "1",
    save: "",
    cookietime: 2592000,
  };

  $("#ct").children().each((i,el)=>{
    switch($(el).attr("name")) {
      case "formhash": {
        replyForm.formhash = $(el).attr("value") || "";
        break;
      }
      case "noticeauthor": {
        replyForm.noticeauthor =  $(el).attr("value") || "";
        break;
      }
      case "noticetrimstr": {
        replyForm.noticetrimstr =  $(el).attr("value") || "";
        break;
      }
      case "noticeauthormsg": {
        replyForm.noticeauthormsg =  $(el).attr("value") || "";
        break;
      }
      default: {
        break;
      }
  }
  });
  
  const replyURL = `${S1URL.host}/forum.php?mod=post&action=reply&fid=${fid}&tid=${tid}&extra=&replysubmit=yes`;
  const response = await got(replyURL, {
    cookieJar: cookieJar,
    method: "POST",
    form: replyForm,
  }).text();
  return response;
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
    message: replytext,
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
