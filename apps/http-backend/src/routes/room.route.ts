import { Router } from "express";

const router = Router()

router.post("/create-room", createRoom)
router.get("/:slug", findRoom)

export default router
