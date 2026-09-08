import {
  sendEmailVerification,
} from "./email.provider.js";

import {
  sendSmsVerification,
} from "./sms.provider.js";

export async function sendVerificationCode({
  method,
  email,
  phoneNumber,
  username,
  code,
}) {
  if (method === "EMAIL") {
    if (!email) {
      throw new Error(
        "No email address is available for verification"
      );
    }

    await sendEmailVerification({
      email,
      username,
      code,
    });

    return;
  }

  if (method === "SMS") {
    if (!phoneNumber) {
      throw new Error(
        "No phone number is available for verification"
      );
    }

    await sendSmsVerification({
      phoneNumber,
      username,
      code,
    });

    return;
  }

  throw new Error(
    "Unsupported verification method"
  );
}