// import {
//   RTCPeerConnection,
//   RTCDataChannel,
//   RTCSessionDescription,
// } from "werift";
import { io } from "socket.io-client";
import { ForumTitleProvider } from "../threads/ForumTitle";
import { GUEST } from "../types/S1types";

const updateUser = (userMap: Map<string, string>, userSet: Set<string>) => {
  userSet.clear();
  userMap.forEach((value) => {
    userSet.add(value);
  });
};

export const socketIOInit = async (forumProvider: ForumTitleProvider) => {
  const onlineUsers: Map<string, string> = new Map();
  const socket = io("http://gitnessaj.com:3020", {
    reconnection: true,
  });
  socket.on("connect", () => {
    console.log(`socket connected: ${socket.id}`);
  });
  socket.on("disconnect", () => {
    console.log(`socket disconnected: ${socket.id}`);
  });

  socket.on("usersOnline", (userArray: [string, string][]) => {
    if (forumProvider.credential !== GUEST) {
      userArray.forEach((user) => {
        onlineUsers.set(user[0], user[1]);
      });
      updateUser(onlineUsers, forumProvider.opens1Users);
      forumProvider.refresh();
      // forumProvider.accounts && forumProvider.updateView(forumProvider.accounts);

    }
  });

  socket.on("userOffline", (socketid: string) => {
    if (forumProvider.credential !== GUEST) {
      onlineUsers.delete(socketid);
      updateUser(onlineUsers, forumProvider.opens1Users);
      // forumProvider.accounts && forumProvider.updateView(forumProvider.accounts);
      forumProvider.refresh();
    }
  });

  return socket;
};
