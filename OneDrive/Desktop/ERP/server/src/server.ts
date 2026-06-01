import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { connectDb } from "./config/db.js";
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

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");

const corsFromEnv = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const corsOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "https://erp-1-3f4g.onrender.com",
  ...corsFromEnv
];

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? false : undefined
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const ok = corsOrigins.includes(origin) || origin.endsWith(".onrender.com");
      callback(null, ok);
    },
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500 }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
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
    app.listen(port, () => console.log(`EWC ERP API running on port ${port}`));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
