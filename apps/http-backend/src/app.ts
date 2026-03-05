import express, { Request, Response } from "express";
import { userAuth } from "./middlewares/middleware.js";
import {
  CreateRoomSchema,
} from "@repo/common/types";
import { prisma } from "@repo/db"
import cors from "cors"

const app = express();

app.use(express.json())
app.use(cors())

import authRouter from "./routes/auth.route.js"
import roomRouter from "./routes/room.route.js"
import canvasRouter from "./routes/canvas.route.js"
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";

app.use("/api/auth", authRouter)

app.use("/api/room", roomRouter)

app.use("/api/canvas", canvasRouter)

app.post("/createRoom", userAuth, async (req: Request, res: Response) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "incorrect inputs",
    });
    return;
  }
  const userId = req.userId
  //db call
  //slug is unique so we will keep it inside try catch so that if any error occur our backend does not crashes
  if (!req.userId) {
    throw new Error("Unauthorized");
  }
  try {
    const room = await prisma.room.create({
      data: {
        slug: parsedData.data.name,
        admin: {
          connect: { id: req.userId },
        },
      },
    });
    res.json({
      roomId: room.id,
    });
  } catch (error) {
    res.status(411).json({
      message: "room already exists with this name"
    })
  }
});

//if people comes to your chat , they should see the existing messages , old messages will comes via http layer but new messages will come through ws

app.get("/canvas/:roomId", async (req, res) => {
  try {
    const roomId = Number(req.params.roomId)
    const messages = await prisma.chat.findMany({
      where: {
        roomId: roomId
      },
      orderBy: {
        id: "desc" // arrange messages in desc format
      },
      take: 1000 //only get 1000 messages
    })

    res.json({
      messages
    })
  } catch (error) {
    console.log(error);
    res.json({
      messages: []
    })
  }
})

app.get("/room/:slug", async (req, res) => {
  const slug = req.params.slug;
  const room = await prisma.room.findFirst({
    where: {
      slug,
    },

  });

  res.json({
    room,
  });
});

app.use((_req, res, _next) => {
  res.status(404).json({ message: "endpoint not found" })
})

app.use(globalErrorHandler)
app.listen(3001, () => console.log("server started at port 3001"));
