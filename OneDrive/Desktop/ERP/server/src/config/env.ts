import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export function validateEnv(): void {
  const missing: string[] = [];

  if (!process.env.MONGODB_URI?.trim()) {
    missing.push("MONGODB_URI");
  }

  if (isProduction && !process.env.JWT_SECRET?.trim()) {
    missing.push("JWT_SECRET");
  }

  if (missing.length > 0) {
    const message = `Missing required environment variable(s): ${missing.join(", ")}`;
    console.error(`[startup] ${message}`);
    throw new Error(message);
  }

  if (!isProduction && !process.env.JWT_SECRET?.trim()) {
    console.warn("[startup] JWT_SECRET is not set — using insecure dev fallback");
  }

  if (isProduction && process.env.JWT_SECRET === "change-this-secret") {
    console.warn("[startup] JWT_SECRET is still the example placeholder — change it in production");
  }
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  if (isProduction) {
    throw new Error("JWT_SECRET is not configured");
  }
  return "dev-secret";
}

export function logStartupConfig(): void {
  const clientUrls = (process.env.CLIENT_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  console.info("[startup] Environment", {
    nodeEnv: process.env.NODE_ENV || "development",
    port: process.env.PORT || 5000,
    clientUrlCount: clientUrls.length,
    clientUrls: clientUrls.length ? clientUrls : "(none — using defaults + *.onrender.com)",
    mongoConfigured: Boolean(process.env.MONGODB_URI?.trim()),
    jwtConfigured: Boolean(process.env.JWT_SECRET?.trim())
  });
}
