import express from "express";
import { createDirect } from "../controllers/conversation.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/direct", requireAuth, createDirect);

export default router;