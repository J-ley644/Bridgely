import { sendVerificationEmail } from "../services/email.service.js";

export async function sendEmailVerification({
  email,
  username,
  code,
}) {
  await sendVerificationEmail({
    email,
    username,
    code,
  });
}