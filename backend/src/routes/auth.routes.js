
import express from "express";

import {
  register,
  registerFirebase,
  verifyEmailAddress,
  resendVerification,
  login,
  firebaseLogin,
  linkFirebase,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post(
  "/register",
  register
);

router.post(
  "/firebase/register",
  registerFirebase
);

router.post(
  "/verify-email",
  verifyEmailAddress
);

router.post(
  "/resend-verification",
  resendVerification
);

router.post(
  "/login",
  login
);

router.post(
  "/firebase/login",
  firebaseLogin
);

router.post(
  "/firebase/link",
  linkFirebase
);

export default router;

