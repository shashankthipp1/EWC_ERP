import mongoose from "mongoose";
import { DEFAULT_PRODUCT_COLORS } from "../utils/categories.js";

const settingsSchema = new mongoose.Schema(
  {
    shopName: { type: String, default: "Sri Eshwar Watch CO" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    defaultMinimumStock: { type: Number, default: 5 },
    productColors: { type: [String], default: () => [...DEFAULT_PRODUCT_COLORS] }
  },
  { timestamps: true }
);

export const Settings = mongoose.model("Settings", settingsSchema);

export async function getShopSettings() {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  return settings;
}
