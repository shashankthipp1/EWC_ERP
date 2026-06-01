import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { buildAllowedOrigins, createCorsOptions, logCorsPolicy } from "./config/cors.js";
import { connectDb } from "./config/db.js";
import { logStartupConfig, validateEnv } from "./config/env.js";
import { ensureAdminUser } from "./utils/ensureAdmin.js";
import { errorHandler, notFound } from "./middleware/error.js";
import authRoutes from "./routes/auth.js";
import customerRoutes from "./routes/customers.js";
import dashboardRoutes from "./routes/dashboard.js";
import financeRoutes from "./routes/finance.js";
import inventoryRoutes from "./routes/inventory.js";
import orderRoutes from "./routes/orders.js";
import repairRoutes from "./routes/repairs.js";
import saleRoutes from "./routes/sales.js";
import staffRoutes from "./routes/staff.js";
import settingsRoutes from "./routes/settings.js";
import reportsRoutes from "./routes/reports.js";
import analyticsRoutes from "./routes/analytics.js";

validateEnv();
logStartupConfig();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");
const allowedOrigins = buildAllowedOrigins();
const corsOptions = createCorsOptions(allowedOrigins);
logCorsPolicy(allowedOrigins);

const app = express();
// Required on Render (reverse proxy) — must be set before express-rate-limit
app.set("trust proxy", true);

app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? false : undefined
  })
);

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "2mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    validate: { xForwardedForHeader: false }
  })
);

app.get("/health", (_req, res) =>
  res.json({
    status: "ok",
    env: process.env.NODE_ENV || "development",
    corsOriginsConfigured: allowedOrigins.size
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/repairs", repairRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/analytics", analyticsRoutes);

if (existsSync(clientDist)) {
  console.info("[startup] Serving client build from", clientDist);
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/health") return next();
    res.sendFile(path.join(clientDist, "index.html"), (err) => (err ? next(err) : undefined));
  });
}

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 5000);
connectDb()
  .then(async () => {
    await ensureAdminUser();
    app.listen(port, () => {
      console.info(`[startup] EWC ERP API listening on port ${port}`);
      console.info(`[startup] Health check: http://localhost:${port}/health`);
    });
  })
  .catch((error) => {
    console.error("[startup] Failed to start server:", error);
    process.exit(1);
  });
