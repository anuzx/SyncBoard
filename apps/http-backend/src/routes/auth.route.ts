import { Router } from "express";
import { handleSignup, handleSingin } from "../controllers/auth.controller.js";

const router = Router()

router.post("/signup", handleSignup)
router.post("/login", handleSingin)

export default router
