import express from "express";

import {
  register,
  verifyEmailAddress,
  resendVerification,
  login,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);

router.post(
  "/verify-email",
  verifyEmailAddress
);

router.post(
  "/resend-verification",
  resendVerification
);

router.post("/login", login);

export default router;