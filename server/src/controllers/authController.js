import bcrypt from "bcryptjs";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";
import { signUser, safeUser } from "../utils/auth.js";

/* =========================================================
   COOKIE OPTIONS
   ========================================================= */

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/* =========================================================
   REGISTER
   ========================================================= */

export async function register(req, res) {
  try {
    const {
      gymName,
      ownerName,
      email,
      phone,
      password,
    } = req.body;

    if (!gymName || !ownerName || !email || !password) {
      return res.status(400).json({
        message:
          "Gym name, owner name, email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const tenant = await Tenant.create({
      gymName,
      ownerName,
      email: normalizedEmail,
      phone,
    });

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      tenantId: tenant._id,
      name: ownerName,
      email: normalizedEmail,
      passwordHash,
      role: "owner",
    });

    const token = signUser(user);

    res.cookie(
      "aura_token",
      token,
      cookieOptions
    );

    return res.status(201).json({
      user: safeUser(user),
      tenant,
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
}

/* =========================================================
   LOGIN
   ========================================================= */

export async function login(req, res) {
  try {
    const {
      email,
      password,
    } = req.body;

    const normalizedEmail = email?.toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (
      !user ||
      !(await bcrypt.compare(
        password || "",
        user.passwordHash
      ))
    ) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Account inactive",
      });
    }

    const tenant = await Tenant.findById(
      user.tenantId
    );

    const token = signUser(user);

    res.cookie(
      "aura_token",
      token,
      cookieOptions
    );

    return res.json({
      user: safeUser(user),
      tenant,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed",
    });
  }
}

/* =========================================================
   LOGOUT
   ========================================================= */

export async function logout(req, res) {
  res.clearCookie(
    "aura_token",
    {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    }
  );

  return res.json({
    message: "Logged out",
  });
}

/* =========================================================
   CURRENT USER
   ========================================================= */

export async function me(req, res) {
  try {
    const tenant = await Tenant.findById(
      req.user.tenantId
    );

    return res.json({
      user: safeUser(req.user),
      tenant,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      message: "Failed to get user information",
    });
  }
}