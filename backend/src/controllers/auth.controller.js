import {
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
} from "../services/auth.service.js";

export async function register(req, res) {
  try {
    const {
      username,
      displayName,
      email,
      phoneNumber,
      password,
      verificationMethod,
    } = req.body;

    if (
      !username ||
      !displayName ||
      !email ||
      !phoneNumber ||
      !password ||
      !verificationMethod
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username, display name, email, phone number, password, and verification method are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long",
      });
    }

    const user = await registerUser({
      username,
      displayName,
      email,
      phoneNumber,
      password,
      verificationMethod,
    });

    return res.status(201).json({
      success: true,
      message:
        "Account created. Please check your selected verification channel for your verification code.",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Registration failed",
    });
  }
}

export async function verifyEmailAddress(req, res) {
  try {
    const { username, code } = req.body;

    if (!username || !code) {
      return res.status(400).json({
        success: false,
        message:
          "Username and verification code are required",
      });
    }

    if (!/^\d{6}$/.test(code.trim())) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code must be 6 digits",
      });
    }

    const user = await verifyEmail({
      username,
      code,
    });

    return res.status(200).json({
      success: true,
      message:
        "Account verified successfully. You can now log in.",
      user,
    });
  } catch (error) {
    console.error(
      "Account verification error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Account verification failed",
    });
  }
}

export async function resendVerification(req, res) {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const result =
      await resendVerificationCode({
        username,
      });

    return res.status(200).json({
      success: true,
      message:
        "A new verification code has been sent.",
      user: result,
    });
  } catch (error) {
    console.error(
      "Resend verification error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to resend verification code",
    });
  }
}

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Username and password are required",
      });
    }

    const result = await loginUser({
      username,
      password,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(401).json({
      success: false,
      message:
        error.message || "Login failed",
    });
  }
}