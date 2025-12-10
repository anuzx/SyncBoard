import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import {prisma} from "@repo/db"
const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

/*
const users = [
  {
    userId: 1,
    rooms: ["room1", "room2"],
  },
  {
    userId: 2,
    rooms: ["room1"],
  },
  {
    userId: 3,
    rooms: [],
  },
];*/

function checkUser(token: string): string | null {
 try {
   const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
 
   if (!decoded || !decoded.userId) {
     return null;
   }
   return decoded.userId;
 } catch (error) {
  return null
 }
  return null
}

//we are allowing the user to join multiple rooms and send mesages to mutiple room

//we can you use redux in backend too

wss.on("connection", function connection(ws, request) {
  //ws object is to interact with user

  const url = request.url; // url= ws://localhost:8080?token=123123
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = checkUser(token);

  if (userId == null) {
    ws.close();
    return null; //early return if userId is null
  }

  users.push({
    userId,
    rooms: [],
    ws,
  });
  //data that we will get in form of string: {type:"join_room" , roomId: "1"}
  wss.on("message", async function message(data) {
   
     let parsedData;
     if (typeof data !== "string") {
       parsedData = JSON.parse(data.toString());
     } else {
       parsedData = JSON.parse(data); // {type: "join-room", roomId: 1}
     }

    if (parsedData.type === "join_room") {
      const user = users.find((x) => x.ws === ws); //if type is join_room , find the user in the global users array and to theat users rooms push the roomId
      user?.rooms.push(parsedData.roomId);
    }

    if (parsedData.type === "leave_room") {
      const user = users.find((x) => x.ws === parsedData.room);
      if (!user) {
        return;
      }
      user.rooms = user?.rooms.filter((x) => x === parsedData.room);
    }
    if (parsedData.type === "chat") {
      //broadcast the message to everyone
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      //better approach is to use queues

      await prisma.chat.create({
        data: {
          roomId : Number(roomId),
          message,
          userId
        }
      })

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message: message,
              roomId,
            })
          );
        }
      });
    }
  });
});
