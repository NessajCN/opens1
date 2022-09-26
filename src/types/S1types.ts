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
  content: string
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
     */
     noticeauthor?: string,
     noticetrimstr?: string,
     noticeauthormsg?: string,
    /**
     * Subject of the reply.
     */
    subject?: string,
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