import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { DeviceSession } from "../models/DeviceSession.js";
import { User } from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: "admin" | "manager" | "staff"; name: string; email: string };
    }
  }
}

export async function protect(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined;
    if (!token) return res.status(401).json({ message: "Authentication required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as { id: string; tokenId?: string };
    if (decoded.tokenId) {
      const session = await DeviceSession.findOne({ tokenId: decoded.tokenId, revokedAt: { $exists: false } });
      if (!session) return res.status(401).json({ message: "Session has been revoked" });
      session.lastActiveAt = new Date();
      await session.save();
    }
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Invalid session" });

    req.user = { id: user.id, role: user.role as "admin" | "manager" | "staff", name: user.name, email: user.email };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  next();
}

export function requireRole(...roles: Array<"admin" | "manager" | "staff">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: "Insufficient permissions" });
    next();
  };
}
