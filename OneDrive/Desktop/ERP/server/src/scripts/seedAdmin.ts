import dotenv from "dotenv";
import { connectDb } from "../config/db.js";
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from "../constants/adminDefaults.js";
import { ensureAdminUser } from "../utils/ensureAdmin.js";

dotenv.config();

await connectDb();
await ensureAdminUser();
console.log("Admin credentials:");
console.log(`  Email:    ${process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL}`);
console.log(`  Password: ${process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD}`);
process.exit(0);
