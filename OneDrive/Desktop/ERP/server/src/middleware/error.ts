import { NextFunction, Request, Response } from "express";
import { isOriginAllowed, buildAllowedOrigins } from "../config/cors.js";

const allowedOrigins = buildAllowedOrigins();

function applyCorsOnError(req: Request, res: Response): void {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin, allowedOrigins) && !res.headersSent) {
    res.setHeader("Access-Control-Allow-Origin", origin.replace(/\/$/, ""));
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
}

export function notFound(req: Request, res: Response) {
  applyCorsOnError(req, res);
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(
  err: Error & { status?: number; code?: number; type?: string },
  req: Request,
  res: Response,
  _next: NextFunction
) {
  applyCorsOnError(req, res);

  const status = err.status || (err.code === 11000 ? 409 : err.message?.startsWith("CORS:") ? 403 : 500);
  const isProduction = process.env.NODE_ENV === "production";

  if (status >= 500 || err.message?.startsWith("CORS:")) {
    console.error("[error]", {
      method: req.method,
      path: req.originalUrl,
      origin: req.headers.origin || "(none)",
      status,
      message: err.message,
      type: err.type
    });
  }

  res.status(status).json({
    message:
      err.code === 11000
        ? "Duplicate record already exists"
        : err.message?.startsWith("CORS:")
          ? isProduction
            ? "Cross-origin request blocked. Set CLIENT_URL on the API service to your frontend URL."
            : err.message
          : err.message || "Server error"
  });
}
