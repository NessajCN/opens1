import { S1URL } from "../types/S1types";

export interface PostResult {
  ok: boolean;
  message: string;
}

/**
 * Parse Discuz reply/newthread HTML or inajax XML response.
 * Silent referer/formhash failures often return the composer page (HTTP 200)
 * without posting — treat that as failure.
 */
export const parsePostResult = (response: string): PostResult => {
  if (!response) {
    return { ok: false, message: "Empty response from forum." };
  }

  if (/request_tainting|System Error/i.test(response)) {
    return {
      ok: false,
      message: "Forum rejected the request (illegal characters / system error).",
    };
  }

  const cdata = response.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  const body = cdata ? cdata[1] : response;

  if (
    /succeedhandle_/i.test(body) ||
    /alert_right/i.test(body) ||
    /非常感谢|回复发布成功|发帖成功|投稿成功/.test(body)
  ) {
    return { ok: true, message: "submitted" };
  }

  const messageText = body.match(
    /id="messagetext"[^>]*>\s*<p>([\s\S]*?)<\/p>/i
  );
  if (messageText) {
    const message = messageText[1].replace(/<[^>]+>/g, "").trim();
    const ok = /alert_right/i.test(body) || /成功/.test(message);
    return {
      ok,
      message: message || (ok ? "submitted" : "Forum rejected the post."),
    };
  }

  if (/errorhandle_/i.test(body)) {
    const err = body.match(/errorhandle_\w+\('([^']+)'/);
    return {
      ok: false,
      message: err?.[1] || "Forum rejected the post.",
    };
  }

  // Composer page returned again => submitcheck failed silently (e.g. missing Referer).
  if (
    /id="postform"/i.test(body) ||
    /id="fastpostform"/i.test(body) ||
    /name="replysubmit"/i.test(body)
  ) {
    return {
      ok: false,
      message:
        "Reply was not accepted (possible missing Referer/formhash). Please re-login and retry.",
    };
  }

  return {
    ok: false,
    message: "Could not confirm reply success from forum response.",
  };
};

export const forumRefererHeaders = (refererPath = "/forum.php") => {
  const path = refererPath.startsWith("/") ? refererPath : `/${refererPath}`;
  return {
    // HTTP header names are Pascal-Case by convention.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Referer: `${S1URL.host}${path}`,
  };
};
