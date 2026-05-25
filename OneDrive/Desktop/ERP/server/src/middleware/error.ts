import { NextFunction, Request, Response } from "express";

export function notFound(req: Request, res: Response) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err: Error & { status?: number; code?: number }, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || (err.code === 11000 ? 409 : 500);
  res.status(status).json({
    message: err.code === 11000 ? "Duplicate record already exists" : err.message || "Server error"
  });
}
