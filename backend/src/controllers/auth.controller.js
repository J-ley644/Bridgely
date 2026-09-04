import {
  registerUser,
  loginUser,
} from "../services/auth.service.js";

export async function register(req, res) {
  try {
    const { username, displayName, email, password } = req.body;

    if (!username || !displayName || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, display name, and password are required",
      });
    }

    const user = await registerUser({
      username,
      displayName,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
}

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
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
      message: error.message || "Login failed",
    });
  }
}