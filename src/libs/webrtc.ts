// import {
//   RTCPeerConnection,
//   RTCDataChannel,
//   RTCSessionDescription,
// } from "werift";
import { io } from "socket.io-client";
import { commands, TreeItemCollapsibleState, window, Uri } from "vscode";
import { ForumTitleProvider, ThreadTitle } from "../threads/ForumTitle";
import { GUEST } from "../types/S1types";

const updateUser = (userMap: Map<string, string>, userSet: Set<string>) => {
  userSet.clear();
  userMap.forEach((value) => {
    userSet.add(value);
  });
};

export const socketIOInit = async (
  forumProvider: ForumTitleProvider,
  onlineUsers: Map<string, string>
) => {
  // const onlineUsers: Map<string, string> = new Map();
  const socket = io("http://gitnessaj.com:3020", {
    reconnection: true,
  });
  socket.on("connect", () => {
    if (forumProvider.credential !== GUEST) {
      socket.emit("identify", forumProvider.credential.username);
    }
    // console.log(`socket connected: ${socket.id}`);
  });

  socket.on("refreshUsers", (userArray: [string, string][]) => {
    if (forumProvider.credential !== GUEST) {
      onlineUsers.clear();
      userArray.forEach((user) => {
        onlineUsers.set(user[0], user[1]);
      });
      updateUser(onlineUsers, forumProvider.opens1Users);
      // forumProvider.refresh();
      forumProvider.accounts &&
        forumProvider.updateView(forumProvider.accounts);
    }
  });
  socket.on("disconnect", () => {
    console.log(`socket disconnected: ${socket.id}`);
  });

  socket.on("replyreminder", (threadattr) => {
    const thread = new ThreadTitle(
      threadattr.title,
      threadattr.path,
      threadattr.fid,
      threadattr.replies
      // TreeItemCollapsibleState.None
    );
    thread.page = threadattr.page;
    thread.threadUri = Uri.parse(
      `s1:${thread.path.slice(4, -5)}-${thread.page}.${thread.ext}`
    );
  window
      .showInformationMessage(`New reply: ${thread.title}`, "Read", "Ignore")
      .then((action) => {
        if (action === "Read") {
          commands.executeCommand("opens1.showthread", thread);
        }
      });
  });

  socket.on("usersOnline", (user: [string, string]) => {
    if (forumProvider.credential !== GUEST) {
      onlineUsers.set(user[0], user[1]);
      updateUser(onlineUsers, forumProvider.opens1Users);
      // forumProvider.refresh();
      forumProvider.accounts &&
        forumProvider.updateView(forumProvider.accounts);
    }
  });

  socket.on("userOffline", (socketid: string) => {
    if (forumProvider.credential !== GUEST) {
      onlineUsers.delete(socketid);
      updateUser(onlineUsers, forumProvider.opens1Users);
      forumProvider.accounts &&
        forumProvider.updateView(forumProvider.accounts);
      // forumProvider.refresh();
    }
  });
  return socket;
};
