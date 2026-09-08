import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomInt } from "crypto";

import prisma from "../config/prisma.js";
import {
  sendVerificationCode,
} from "../providers/verification.provider.js";

const SALT_ROUNDS = 12;

const VERIFICATION_CODE_EXPIRY_MINUTES = 10;

const MAX_VERIFICATION_ATTEMPTS = 5;

const VALID_VERIFICATION_METHODS = [
  "EMAIL",
  "SMS",
];

function generateVerificationCode() {
  return randomInt(100000, 1000000).toString();
}

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizePhoneNumber(phoneNumber) {
  return phoneNumber.trim();
}

async function createVerificationCode() {
  const code = generateVerificationCode();

  const codeHash = await bcrypt.hash(
    code,
    SALT_ROUNDS
  );

  const expiresAt = new Date(
    Date.now() +
      VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000
  );

  return {
    code,
    codeHash,
    expiresAt,
  };
}

export async function registerUser({
  username,
  displayName,
  email,
  phoneNumber,
  password,
  verificationMethod,
}) {
  const normalizedUsername =
    normalizeUsername(username);

  const normalizedEmail =
    normalizeEmail(email);

  const normalizedPhoneNumber =
    normalizePhoneNumber(phoneNumber);

  const normalizedMethod =
    verificationMethod.trim().toUpperCase();

  if (
    !VALID_VERIFICATION_METHODS.includes(
      normalizedMethod
    )
  ) {
    throw new Error(
      "Verification method must be EMAIL or SMS"
    );
  }

  if (
    normalizedMethod === "EMAIL" &&
    !normalizedEmail
  ) {
    throw new Error(
      "Email is required for email verification"
    );
  }

  if (
    normalizedMethod === "SMS" &&
    !normalizedPhoneNumber
  ) {
    throw new Error(
      "Phone number is required for SMS verification"
    );
  }

  const existingUsername =
    await prisma.user.findUnique({
      where: {
        username: normalizedUsername,
      },
    });

  if (existingUsername) {
    throw new Error(
      "Username is already taken"
    );
  }

  const existingEmail =
    await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

  if (existingEmail) {
    throw new Error(
      "Email is already registered"
    );
  }

  const existingPhone =
    await prisma.user.findUnique({
      where: {
        phoneNumber: normalizedPhoneNumber,
      },
    });

  if (existingPhone) {
    throw new Error(
      "Phone number is already registered"
    );
  }

  const passwordHash =
    await bcrypt.hash(
      password,
      SALT_ROUNDS
    );

  const {
    code,
    codeHash,
    expiresAt,
  } = await createVerificationCode();

  const user = await prisma.user.create({
    data: {
      username: normalizedUsername,
      displayName: displayName.trim(),

      email: normalizedEmail,
      phoneNumber: normalizedPhoneNumber,

      passwordHash,

      emailVerified: false,

      verificationMethod:
        normalizedMethod,

      verificationCodeHash:
        codeHash,

      verificationCodeExpiresAt:
        expiresAt,

      verificationAttempts: 0,
    },

    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      emailVerified: true,
      verificationMethod: true,
      createdAt: true,
    },
  });

  try {
    await sendVerificationCode({
      method: normalizedMethod,
      email: normalizedEmail,
      phoneNumber:
        normalizedPhoneNumber,
      username: normalizedUsername,
      code,
    });
  } catch (error) {
    console.error(
      "Verification delivery error:",
      error
    );

    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    throw new Error(
      error.message ||
        "We could not send the verification code. Please try again."
    );
  }

  return user;
}

export async function verifyEmail({
  username,
  code,
}) {
  return verifyAccount({
    username,
    code,
  });
}

export async function verifyAccount({
  username,
  code,
}) {
  const normalizedUsername =
    normalizeUsername(username);

  const normalizedCode =
    code.trim();

  const user =
    await prisma.user.findUnique({
      where: {
        username: normalizedUsername,
      },
    });

  if (!user) {
    throw new Error(
      "Invalid verification request"
    );
  }

  if (user.emailVerified) {
    throw new Error(
      "Account is already verified"
    );
  }

  if (!user.verificationCodeHash) {
    throw new Error(
      "No verification code is active"
    );
  }

  if (
    !user.verificationCodeExpiresAt ||
    user.verificationCodeExpiresAt < new Date()
  ) {
    throw new Error(
      "Verification code has expired. Please request a new code."
    );
  }

  if (
    user.verificationAttempts >=
    MAX_VERIFICATION_ATTEMPTS
  ) {
    throw new Error(
      "Too many verification attempts. Please request a new code."
    );
  }

  const codeMatches =
    await bcrypt.compare(
      normalizedCode,
      user.verificationCodeHash
    );

  if (!codeMatches) {
    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        verificationAttempts: {
          increment: 1,
        },
      },
    });

    throw new Error(
      "Invalid verification code"
    );
  }

  const verifiedUser =
    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        emailVerified: true,

        verificationCodeHash:
          null,

        verificationCodeExpiresAt:
          null,

        verificationAttempts: 0,
      },

      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        emailVerified: true,
        verificationMethod: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

  return verifiedUser;
}

export async function resendVerificationCode({
  username,
}) {
  const normalizedUsername =
    normalizeUsername(username);

  const user =
    await prisma.user.findUnique({
      where: {
        username: normalizedUsername,
      },
    });

  if (!user) {
    throw new Error(
      "User not found"
    );
  }

  if (user.emailVerified) {
    throw new Error(
      "Account is already verified"
    );
  }

  if (!user.verificationMethod) {
    throw new Error(
      "No verification method is configured for this account"
    );
  }

  if (
    user.verificationMethod === "EMAIL" &&
    !user.email
  ) {
    throw new Error(
      "No email address is associated with this account"
    );
  }

  if (
    user.verificationMethod === "SMS" &&
    !user.phoneNumber
  ) {
    throw new Error(
      "No phone number is associated with this account"
    );
  }

  const {
    code,
    codeHash,
    expiresAt,
  } = await createVerificationCode();

  await prisma.user.update({
    where: {
      id: user.id,
    },

    data: {
      verificationCodeHash:
        codeHash,

      verificationCodeExpiresAt:
        expiresAt,

      verificationAttempts: 0,
    },
  });

  try {
    await sendVerificationCode({
      method:
        user.verificationMethod,

      email: user.email,

      phoneNumber:
        user.phoneNumber,

      username:
        user.username,

      code,
    });
  } catch (error) {
    console.error(
      "Resend verification delivery error:",
      error
    );

    throw new Error(
      error.message ||
        "We could not send the verification code. Please try again."
    );
  }

  return {
    username: user.username,

    verificationMethod:
      user.verificationMethod,
  };
}

export async function loginUser({
  username,
  password,
}) {
  const normalizedUsername =
    normalizeUsername(username);

  const user =
    await prisma.user.findUnique({
      where: {
        username: normalizedUsername,
      },
    });

  if (!user) {
    throw new Error(
      "Invalid username or password"
    );
  }

  const passwordMatches =
    await bcrypt.compare(
      password,
      user.passwordHash
    );

  if (!passwordMatches) {
    throw new Error(
      "Invalid username or password"
    );
  }

  if (!user.emailVerified) {
    throw new Error(
      "Please verify your account before logging in"
    );
  }

  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured"
    );
  }

  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
    },

    process.env.JWT_SECRET,

    {
      expiresIn: "7d",
    }
  );

  return {
    token,

    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      emailVerified:
        user.emailVerified,
      verificationMethod:
        user.verificationMethod,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
  };
}