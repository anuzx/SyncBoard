import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prisma } from "@repo/db";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded || !decoded.userId) {
      return null;
    }
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

wss.on("connection", function connection(ws, request) {
  const url = request.url;
  if (!url) {
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = checkUser(token);

  if (userId == null) {
    ws.close();
    return;
  }

  users.push({
    userId,
    rooms: [],
    ws,
  });

  // IMPORTANT: Use ws.on, NOT wss.on
  ws.on("message", async function message(data) {
    try {
      let parsedData;
      if (typeof data !== "string") {
        parsedData = JSON.parse(data.toString());
      } else {
        parsedData = JSON.parse(data);
      }

      if (parsedData.type === "join_room") {
        const user = users.find((x) => x.ws === ws);
        if (user && !user.rooms.includes(parsedData.roomId)) {
          user.rooms.push(parsedData.roomId);
        }
        console.log(`User ${userId} joined room ${parsedData.roomId}`);
      }

      if (parsedData.type === "leave_room") {
        const user = users.find((x) => x.ws === ws);
        if (!user) {
          return;
        }
        user.rooms = user.rooms.filter((x) => x !== parsedData.room);
      }

      if (parsedData.type === "chat") {
        const roomId = parsedData.roomId;
        const message = parsedData.message;

        console.log(`Saving message to room ${roomId}:`, message);

        // Save to database
        await prisma.chat.create({
          data: {
            roomId: Number(roomId),
            message,
            userId,
          },
        });

        console.log("Message saved to database");

        // Broadcast to all users in the room
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

      if (parsedData.type === "erase") {
        const roomId = parsedData.roomId;
        const remainingShapes = parsedData.shapes;

        console.log(`Erasing shapes in room ${roomId}`);
        console.log(`Remaining shapes:`, remainingShapes.length);

        // Delete ALL shapes from the room
        await prisma.chat.deleteMany({
          where: {
            roomId: Number(roomId),
          },
        });

        console.log("Deleted all shapes from database");

        // Re-insert the remaining shapes
        for (const shape of remainingShapes) {
          await prisma.chat.create({
            data: {
              roomId: Number(roomId),
              message: JSON.stringify({ shape }),
              userId,
            },
          });
        }

        console.log("Re-inserted remaining shapes to database");

        // Broadcast to ALL users in the room (including sender for confirmation)
        users.forEach((user) => {
          if (user.rooms.includes(roomId)) {
            console.log(`Broadcasting erase to user in room ${roomId}`);
            user.ws.send(
              JSON.stringify({
                type: "erase",
                shapes: remainingShapes,
                roomId,
              })
            );
          }
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    const index = users.findIndex((x) => x.ws === ws);
    if (index !== -1) {
      users.splice(index, 1);
    }
  });
});
