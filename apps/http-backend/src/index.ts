import express ,{Request, Response} from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { userAuth } from "./middleware";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
} from "@repo/common/types";
import {prismaClient} from "@repo/db/client"

const app = express();

app.use(express.json())

app.post("/signup", async(req, res) => {
  // zod validation here
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "incorrect inputs",
    });
    return;
  }
  //db call
 try {
  const user = await prismaClient.user.create({
     data: {
      email: parsedData.data?.username,
       //TODO:hash the password
       password: parsedData.data?.password,
       name:parsedData.data?.name
     
     }
     
   })
   res.json({
     userId: user.id,
   });
 } catch (error) {
   res.status(411).json({
    message:"user already exist"
  })
 }
});

app.post("/signin", async(req, res) => {
  const parsedData = SigninSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "incorrect inputs",
    });
    return;
  }
  //TODO: compare the hased password
  const user = await prismaClient.user.findFirst({
    where: {
      email: parsedData.data.username,
      password: parsedData.data.password,
    },
  });
  if (!user) {
    res.status(403).json({
      message:"not authorized"
    })
    return
  }

  
  const token = jwt.sign(
    {
      userId:user?.id,
    },
    JWT_SECRET
  );

  res.json({
    token,
  });
});

app.post("/createRoom", userAuth, async(req:Request, res:Response) => {
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
   const room = await prismaClient.room.create({
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
    message:"room already exists with this name"
  })
 }
});

app.listen(3001, () => console.log("server started at port 3001"));
