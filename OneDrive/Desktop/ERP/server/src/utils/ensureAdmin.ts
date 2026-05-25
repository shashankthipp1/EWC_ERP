import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_PASSWORD } from "../constants/adminDefaults.js";
import { User } from "../models/User.js";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function ensureAdminUser() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || DEFAULT_ADMIN_NAME;

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      console.log(`[EWC ERP] Promoted ${email} to admin`);
    }
    return existing;
  }

  const user = await User.create({ name, email, password, role: "admin" });
  console.log(`[EWC ERP] Admin account ready: ${email}`);
  return user;
}
