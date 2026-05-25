import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    email: { type: String, default: "" },
    pendingAmount: { type: Number, default: 0 },
    loyaltyPoints: { type: Number, default: 0 },
    segment: { type: String, enum: ["New", "Repeat", "Premium", "At Risk"], default: "New" },
    communicationLogs: [
      {
        channel: String,
        message: String,
        at: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

customerSchema.index({ phone: 1 }, { unique: true });

export const Customer = mongoose.model("Customer", customerSchema);
