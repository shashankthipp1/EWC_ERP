import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    shopName: { type: String, default: "Sri Eshwar Watch CO" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    defaultMinimumStock: { type: Number, default: 5 }
  },
  { timestamps: true }
);

export const Settings = mongoose.model("Settings", settingsSchema);

export async function getShopSettings() {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  return settings;
}
