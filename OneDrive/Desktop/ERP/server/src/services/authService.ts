import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Request } from "express";
import { getJwtSecret } from "../config/env.js";
import { DeviceSession } from "../models/DeviceSession.js";

export function createToken(userId: string, tokenId = crypto.randomUUID()) {
  return {
    tokenId,
    token: jwt.sign({ id: userId, tokenId }, getJwtSecret(), { expiresIn: "7d" })
  };
}

export async function createDeviceSession(req: Request, userId: string, tokenId: string) {
  const userAgent = req.headers["user-agent"] || "";
  const deviceName = String(userAgent).includes("Mobile") ? "Mobile Browser" : "Desktop Browser";
  await DeviceSession.create({
    user: userId,
    tokenId,
    deviceName,
    ip: req.ip,
    userAgent,
    lastActiveAt: new Date()
  });
}
