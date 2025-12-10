import express ,{Request, Response} from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { userAuth } from "./middleware.js";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
} from "@repo/common/types";
import { prisma } from "@repo/db"
import cors from "cors"

const app = express();

app.use(express.json())
app.use(cors())

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
  const user = await prisma.user.create({
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
  const user = await prisma.user.findFirst({
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
    message:"room already exists with this name"
  })
 }
});

//if people comes to your chat , they should see the existing messages , old messages will comes via http layer but new messages will come through ws

app.get("/canvas/:roomId", async(req, res)=>{
 try {
   const roomId = Number(req.params.roomId)
  const messages = await prisma.chat.findMany({
     where: {
       roomId:roomId
    },
    orderBy: {
      id:"desc" // arrange messages in desc format
    },
    take:1000 //only get 1000 messages
  })
   
   res.json({
     messages
   })
 } catch (error) {
   console.log(error);
   res.json({
  messages:[]
})
 }
})

app.get("/room/:slug",async (req, res) => {
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


app.listen(3001, () => console.log("server started at port 3001"));
