import { Router } from "express";
import {
  githubLogin,
  githubCallback,
  googleLogin,
  googleCallback
} from "../controllers/auth.controller.js";

const router = Router();

//redirect to github
router.get("/github", githubLogin);
router.get("/google", googleLogin)

//callback
router.get("/github/callback", githubCallback);
router.get("/google/callback", googleCallback)

export default router;
