import {
  window,
  workspace,
  InputBoxOptions,
  QuickPickOptions,
  QuickPickItem,
  Uri,
  QuickPickItemKind,
} from "vscode";
import { Newpost } from "../types/S1types";

class SubmitItem implements QuickPickItem {
  label: string;
  constructor(public uri: Uri) {
    this.label = uri.fsPath;
  }
}

export const replyPrompt: () => Promise<string | undefined> = async () => {
  const replyOption: QuickPickOptions = {
    title: "回帖",
    // canPickMany: false,
    placeHolder:
      "你可以新建一个.s1文件并在下列选单里选中作为回帖正文，或者点“手动输入”直接在输入框内输入正文。",
  };
  //   const rootPath = (workspace.workspaceFolders && (workspace.workspaceFolders.length > 0))
  // 		? workspace.workspaceFolders[0].uri.fsPath : undefined;
  //   const fileList = rootPath? await workspace.fs.readDirectory(Uri.file(rootPath)):[];

  const manually: QuickPickItem = {
    label: "$(comment-discussion) 手动输入回复",
  };
  const separator: QuickPickItem = {
    label: "在当前工作区选一个.s1文件作为回帖",
    kind: QuickPickItemKind.Separator,
  };
  const replyFilesUri =
    // workspace.workspaceFolders?.map((wd) => new SubmitItem(wd.uri)) || [];
    await workspace.findFiles("**/*.s1");

  const replyItems = replyFilesUri.map((uri) => new SubmitItem(uri));
  const pickedReplyItem = await window.showQuickPick(
    [manually, separator, ...replyItems],
    replyOption
  );
  if (!pickedReplyItem) {
    return undefined;
  } else if (pickedReplyItem instanceof SubmitItem) {
    const doc = await workspace.openTextDocument(pickedReplyItem.uri);
    return doc.getText();
  } else {
    return await window.showInputBox({
      title: "回帖内容",
      prompt: "直接输入回帖内容",
    });
  }
};

export const newpostPrompt: () => Promise<Newpost | undefined> = async () => {
  const newPostOption: QuickPickOptions = {
    title: "发新帖",
    // canPickMany: false,
    placeHolder:
      "你可以新建一个.s1文件并在下列选单里选中作为新帖正文，或者点“手动输入”直接在输入框内输入正文。",
  };
  //   const rootPath = (workspace.workspaceFolders && (workspace.workspaceFolders.length > 0))
  // 		? workspace.workspaceFolders[0].uri.fsPath : undefined;
  //   const fileList = rootPath? await workspace.fs.readDirectory(Uri.file(rootPath)):[];

  const subjectOption: InputBoxOptions = {
    title: "标题",
    prompt: "直接输入新帖标题",
  };
  const manually: QuickPickItem = {
    label: "$(edit) 手动输入新帖",
  };
  const separator: QuickPickItem = {
    label: "在当前工作区选一个.s1文件作为新帖",
    kind: QuickPickItemKind.Separator,
  };
  const newpostFilesUri =
    // workspace.workspaceFolders?.map((wd) => new SubmitItem(wd.uri)) || [];
    await workspace.findFiles("**/*.s1");

  const newpostItems = newpostFilesUri.map((uri) => new SubmitItem(uri));
  const pickedNewpostItem = await window.showQuickPick(
    [manually, separator, ...newpostItems],
    newPostOption
  );
  if (!pickedNewpostItem) {
    return undefined;
  } else if (pickedNewpostItem instanceof SubmitItem) {
    const doc = await workspace.openTextDocument(pickedNewpostItem.uri);
    const subject = await window.showInputBox(subjectOption);
    return subject
      ? {
          subject,
          message: doc.getText(),
        }
      : undefined;
  } else {
    const message = await window.showInputBox({
      title: "回帖内容",
      prompt: "直接输入新帖",
    });
    if (!message) {
      return undefined;
    }
    const subject = await window.showInputBox(subjectOption);
    return subject
      ? {
          subject,
          message,
        }
      : undefined;
  }
};
