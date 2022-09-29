import {
  RTCPeerConnection,
  RTCDataChannel,
  RTCSessionDescription,
} from "werift";
import { io } from "socket.io-client";
import { ForumTitleProvider } from "../threads/ForumTitle";

export const socketIOInit = async (
  forumProvider: ForumTitleProvider,
  onlineUsers: Map<string, string>
) => {
  const socket = io("http://gitnessaj.com:3020", {
    reconnection: true,
  });
  socket.on("connect", () => {
    console.log(`socket connected: ${socket.id}`);
  });
  socket.on("disconnect", () => {
    console.log(`socket disconnected: ${socket.id}`);
  });

  socket.on("usersOnline", (userArray: Array<[string, string]>) => {
    userArray.forEach((user) => {
      onlineUsers.set(user[0], user[1]);
    });
    forumProvider.accounts && forumProvider.updateView(forumProvider.accounts);
  });

  socket.on("userOffline", (user: string) => {
    onlineUsers.delete(user);
  });

  return socket;
};
