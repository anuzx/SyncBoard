import { Router } from "express";

const router = Router()

router.get("/:room-id", getCanvas)

export default router
