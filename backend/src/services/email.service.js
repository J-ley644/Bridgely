import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail({
  email,
  username,
  code,
}) {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    throw new Error("Email service is not configured");
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
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

        <p>Your email verification code is:</p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          margin: 24px 0;
        ">
          ${code}
        </div>

        <p>This code expires in <strong>10 minutes</strong>.</p>

        <p>If you did not create a Bridgely account, you can ignore this email.</p>

        <p>— Bridgely</p>
      </div>
    `,
  });
}