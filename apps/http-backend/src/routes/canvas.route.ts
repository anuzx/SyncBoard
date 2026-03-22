import { Router } from "express";
import { getCanvas } from "../controllers/canvas.controller.js";

const router = Router()

router.get("/:room-id", getCanvas)

export default router
