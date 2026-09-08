import { Resend } from "resend";

export async function sendEmailVerification({
  email,
  username,
  code,
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "Resend email service is not configured"
    );
  }

  const resend = new Resend(
    process.env.RESEND_API_KEY
  );

  const { error } = await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ||
      "onboarding@resend.dev",

    to: email,

    subject: "Verify your Bridgely account",

    text: `Hi ${username},

Your Bridgely verification code is:

${code}

This code expires in 10 minutes.

If you did not create a Bridgely account, you can ignore this email.

— Bridgely`,

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Welcome to Bridgely 👋</h2>

        <p>Hi ${username},</p>

        <p>Your Bridgely verification code is:</p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          margin: 24px 0;
        ">
          ${code}
        </div>

        <p>This code expires in <strong>10 minutes</strong>.</p>

        <p>
          If you did not create a Bridgely account,
          you can ignore this email.
        </p>

        <p>— Bridgely</p>
      </div>
    `,
  });

  if (error) {
    console.error(
      "Resend API error:",
      error
    );

    throw new Error(
      error.message ||
        "Failed to send verification email"
    );
  }
}