export const S1URL = {
  host: "https://bbs.saraba1st.com/2b",
  loginPath: "/member.php?mod=logging&action=login",
  logoutPath: "/member.php?mod=logging&action=logout",
  newPostPath: "/forum.php?mod=post&action=newthread",
  replyPath: "/forum.php?mod=post&action=reply",
  title: "stage1st",
} as const;

export const GUEST: Credential = {
  username: "",
  password: "",
} as const;

export interface Credential {
  username: string,
  password: string
}

export interface Newpost {
  subject: string,
  message: string
}

export interface FormHash {
  loginhash: string | null,
  formhash: string | null
}

export interface ThreadContent {
  author: string,
  posttime: string,
  content: string,
  fl: number
}

export interface Author {
  fl: number,
  author: string,
  posttime: string
}
/**
 * form body of POST request to {@linkcode S1URL.loginPath} for signin.
 */
export interface LoginForm {
  /**
   *formhash is a random string generated when requesting {@linkcode S1URL.loginPath|
   */
  formhash: string;
  referer: string;
  loginfield: string;
  username: string;
  password: string;
  /**
   * Default '0'
   */
  questionid: string;
  answer?: string | null;
  /**
   * Default 2592000
   */
  cookietime: number;
}

export interface Member {
  username: string,
  uid? : number,
  readperm? : number,
  currency? : number,
  geese? : number
}

/**
 * New thread form body of POST request to {@linkcode S1URL.newPostPath}
 */
export interface NewPostForm {
    /**
     * Random string generated when GET requesting {@linkcode S1URL.newPostPath}.
     */
    formhash: string,
    /**
     * Seconds since epoch time.
     */
    posttime: number,
    /**
     * WYSIWYG (what you see is what you get) editor enabling. Default '1'
     */
    wysiwyg: string,
    /**
     * Number of category name bracketed before thread subject. Set by forum owner.
     */
    typeid?: number,
    /**
     * Subject of the new thread.
     */
    subject: string,
    /**
     * Content body of the new thread.
     */
    message: string,
    /**
     * Reading permission of the thread. Default 0. 
     */
    readperm: number,
    /**
     * Allow forum to push notification to author. Default '1'
     */
    allownoticeauthor: string,
    /**
     * Allow display of the custom user signature text. Default '1'.
     */
    usesig: string,
    /**
     * Default ''
     */
    save: string,
    /**
     * Default 2592000
     */
    cookietime: number
}

/**
 * Reply form body of POST request to {@linkcode S1URL.replyPath}
 */
 export interface ReplyForm {
    /**
     * Random string generated when GET requesting {@linkcode S1URL.replyPath}.
     */
    formhash: string,
    /**
     * Seconds since epoch time.
     */
    posttime: number,
    /**
     * WYSIWYG (what you see is what you get) editor enabling. Default '1'
     */
    wysiwyg: string,
    /**
     * Opionals to determine whether notifying the author.
     * Noticeauthor is an encoded string to noticed replier
     * who received a notification on main forum menu.
     */
     noticeauthor?: string,
     /**
      * Trimmed quoted reply content like:
      * "[quote][size=2][url=forum.php?mod=redirect&goto=findpost&pid=57656505&ptid=2096733]
      * [color=#999999]nessaj+发表于+2022-9-26+14:30[/color][/url][/size]\r\nReplyContent[/quote]"
      * 
      * pid is the same as reppid standing for the number of the reply content.
      * ptid is the thread tid of the main thread.
      */
     noticetrimstr?: string,
     /**
      * Message to noticed author. usually the quoted reply text like "ReplyContent" above.
      */
     noticeauthormsg?: string,
    /**
     * Subject of the reply.
     */
    subject?: string,
    /**
     * Reply pid same as pid above. 
     */
    reppid?: string,
    /**
     * Reply pid same as pid above. 
     */
     reppost?: string,
    /**
     * Content body of the reply.
     */
    message: string,
    /**
     * Allow display of the custom user signature text. Default '1'.
     */
    usesig: string,
    /**
     * Default ''
     */
    save: string,
    /**
     * Default 2592000
     */
    cookietime: number
}