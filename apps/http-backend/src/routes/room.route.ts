import { Router } from "express";
import { createRoom, findRoom } from "../controllers/room.controller.js";

const router = Router()

router.post("/create-room", createRoom)
router.get("/:slug", findRoom)

export default router
