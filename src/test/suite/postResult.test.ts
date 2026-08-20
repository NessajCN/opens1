import * as assert from "assert";
import {
  parsePostResult,
  forumRefererHeaders,
} from "../../libs/postResult";

suite("parsePostResult", () => {
  test("detects silent failure when composer page is returned", () => {
    const html = `
      <form id="postform" method="post">
        <input type="hidden" name="formhash" value="abc" />
        <button name="replysubmit" value="replysubmit">Reply</button>
      </form>
    `;
    const result = parsePostResult(html);
    assert.strictEqual(result.ok, false);
    assert.ok(result.message.includes("Referer") || result.message.includes("not accepted"));
  });

  test("detects discuz success message page", () => {
    const html = `
      <div id="messagetext" class="alert_right">
        <p>非常感谢，回复发布成功，现在将转入主题页……</p>
      </div>
    `;
    const result = parsePostResult(html);
    assert.strictEqual(result.ok, true);
  });

  test("detects discuz error message page", () => {
    const html = `
      <div id="messagetext" class="alert_error">
        <p>抱歉，您尚未登录，没有权限在该版块发帖</p>
      </div>
    `;
    const result = parsePostResult(html);
    assert.strictEqual(result.ok, false);
    assert.ok(result.message.includes("尚未登录"));
  });

  test("detects inajax succeedhandle", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<root><![CDATA[
<script>succeedhandle_fastpost('thread-1-1-1.html', 'reply');</script>
]]></root>`;
    assert.strictEqual(parsePostResult(xml).ok, true);
  });

  test("detects inajax errorhandle", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<root><![CDATA[
抱歉，验证码填写错误<script>errorhandle_fastpost('抱歉，验证码填写错误', {});</script>
]]></root>`;
    const result = parsePostResult(xml);
    assert.strictEqual(result.ok, false);
    assert.ok(result.message.includes("验证码"));
  });

  test("detects system error / empty formhash style rejection", () => {
    const html = `<html><title>stage1st.com - System Error</title>request_tainting</html>`;
    assert.strictEqual(parsePostResult(html).ok, false);
  });

  test("forumRefererHeaders uses S1 host", () => {
    const headers = forumRefererHeaders("/thread-1-1-1.html");
    assert.strictEqual(
      headers.Referer,
      "https://stage1st.com/2b/thread-1-1-1.html"
    );
  });
});
