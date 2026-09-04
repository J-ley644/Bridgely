import express from "express";
import {
  getMe,
  searchUser,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", requireAuth, getMe);
router.get("/search", requireAuth, searchUser);

export default router;