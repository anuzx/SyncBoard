import express, { } from "express";
import cors from "cors"

import cookieParser from "cookie-parser";
const app = express();
app.use(cookieParser());
app.use(express.json())
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

import authRouter from "./routes/auth.route.js"
import roomRouter from "./routes/room.route.js"
import canvasRouter from "./routes/canvas.route.js"
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";

app.use("/api/auth", authRouter)

app.use("/api/room", roomRouter)

app.use("/api/canvas", canvasRouter)


app.use((_req, res, _next) => {
  res.status(404).json({ message: "endpoint not found" })
})

app.use(globalErrorHandler)
app.listen(3001, () => console.log("server started at port 3001"));
