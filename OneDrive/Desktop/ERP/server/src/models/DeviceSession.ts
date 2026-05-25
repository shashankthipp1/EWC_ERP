import mongoose from "mongoose";

const deviceSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenId: { type: String, required: true, unique: true },
    deviceName: { type: String, default: "Unknown device" },
    ip: String,
    userAgent: String,
    lastActiveAt: { type: Date, default: Date.now },
    revokedAt: Date
  },
  { timestamps: true }
);

export const DeviceSession = mongoose.model("DeviceSession", deviceSessionSchema);
