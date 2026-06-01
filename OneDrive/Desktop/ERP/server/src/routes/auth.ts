import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { protect } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { createDeviceSession, createToken } from "../services/authService.js";

const router = Router();

const safeUser = (user: any) => ({ id: user.id, name: user.name, email: user.email, role: user.role });
const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function verifyPassword(user: any, password: string) {
  const storedPassword = user.password;
  if (!storedPassword) return false;

  if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
    return bcrypt.compare(password, storedPassword);
  }

  if (storedPassword === password) {
    user.password = password;
    return true;
  }

  return false;
}

router.post("/signup", async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["admin", "manager", "staff"]).optional()
      })
      .parse(req.body);
    const email = normalizeEmail(body.email);
    const userCount = await User.countDocuments();
    const user = await User.create({ ...body, email, role: userCount === 0 ? "admin" : body.role || "staff" });
    const session = createToken(user.id);
    await createDeviceSession(req, user.id, session.tokenId);
    console.info("[auth] signup ok", { email, origin: req.headers.origin || "(none)", ip: req.ip });
    res.status(201).json({ token: session.token, user: safeUser(user) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.warn("[auth] signup failed", {
      origin: req.headers.origin || "(none)",
      ip: req.ip,
      message
    });
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email().transform(normalizeEmail), password: z.string().min(1) }).parse(req.body);
    const user = await User.findOne({ email: body.email }).select("+password");
    if (!user || !(await verifyPassword(user, body.password))) {
      console.warn("[auth] login rejected", {
        email: body.email,
        reason: user ? "invalid_password" : "user_not_found",
        origin: req.headers.origin || "(none)",
        ip: req.ip
      });
      return res.status(401).json({ message: "Invalid email or password" });
    }
    user.lastLoginAt = new Date();
    user.activityLog = [...(user.activityLog || []), { action: "login", ip: req.ip, at: new Date() }].slice(-50) as any;
    await user.save();
    const session = createToken(user.id);
    await createDeviceSession(req, user.id, session.tokenId);
    console.info("[auth] login ok", { email: body.email, origin: req.headers.origin || "(none)", ip: req.ip });
    res.json({ token: session.token, user: safeUser(user) });
  } catch (err) {
    console.warn("[auth] login error", {
      origin: req.headers.origin || "(none)",
      ip: req.ip,
      message: err instanceof Error ? err.message : "unknown"
    });
    next(err);
  }
});

router.get("/me", protect, (req, res) => res.json({ user: req.user }));

router.post("/forgot-password", async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email().transform(normalizeEmail) }).parse(req.body);
    const user = await User.findOne({ email: body.email }).select("+otpCode");
    if (user) {
      user.otpCode = String(Math.floor(100000 + Math.random() * 900000));
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      user.activityLog = [...(user.activityLog || []), { action: "otp_requested", ip: req.ip, at: new Date() }].slice(-50) as any;
      await user.save();
    }
    res.json({ message: "If the account exists, an OTP has been prepared for verification." });
  } catch (err) {
    next(err);
  }
});

router.post("/verify-otp", async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email().transform(normalizeEmail), otp: z.string().length(6), password: z.string().min(6).optional() }).parse(req.body);
    const user = await User.findOne({ email: body.email }).select("+otpCode +password");
    if (!user || user.otpCode !== body.otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    if (body.password) user.password = body.password;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.activityLog = [...(user.activityLog || []), { action: body.password ? "password_reset" : "otp_verified", ip: req.ip, at: new Date() }].slice(-50) as any;
    await user.save();
    const session = createToken(user.id);
    await createDeviceSession(req, user.id, session.tokenId);
    res.json({ token: session.token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
});

export default router;
