import {
  RTCPeerConnection,
  RTCDataChannel,
  RTCSessionDescription,
} from "werift";
import { io } from "socket.io-client";

export const socketIOInit = async (user: string | null, onlineUsers: Map<string, string>) => {
  const socket = io("http://gitnessaj.com:3020", {
    // port:3001,
    reconnection: true,
  });
  // let onlineUsers: Map<string,string>;
//   const onlineUsers: Map<string, string> = new Map();
  socket.on("connect", () => {
    console.log(`socket connected: ${socket.id}`);
    user && socket.emit("identify", user);
    // socket.emit("whosisonline", (onlineUsersArray: Array<[string,string]>)=> {
    //     onlineUsersArray.forEach((onlineUser)=>{onlineUsers.set(onlineUser[0],onlineUser[1]);});
    // });
    // console.log(onlineUsers);
  });
  socket.on("disconnect", () => {
    console.log(`socket disconnected: ${socket.id}`);
  });

  socket.on("usersOnline", (userArray: Array<[string, string]>) => {
    userArray.forEach((user) => {
      onlineUsers.set(user[0], user[1]);
    });
    console.log(onlineUsers);
  });

  socket.on("userOffline",(user:string)=>{
    onlineUsers.delete(user);
  });

  return socket;
};
