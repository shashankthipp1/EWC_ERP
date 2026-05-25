import mongoose from "mongoose";

const repairSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, required: true },
    phoneNumber: { type: String, required: true, index: true },
    address: { type: String, default: "" },
    deviceType: { type: String, enum: ["Wrist Watch", "Wall Clock", "Mobile Phone", "Trimmer", "Electronics"], required: true },
    brand: String,
    modelNumber: String,
    serialNumber: String,
    accessoriesSubmitted: String,
    problemDescription: { type: String, required: true },
    estimatedCost: { type: Number, default: 0 },
    advancePaid: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    technicianName: String,
    repairStatus: { type: String, enum: ["Pending", "Diagnosing", "In Progress", "Waiting Parts", "Completed", "Delivered"], default: "Pending", index: true },
    deliveryDate: Date,
    deliveredAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

repairSchema.pre("validate", function () {
  this.remainingAmount = Math.max(0, Number(this.estimatedCost || 0) - Number(this.advancePaid || 0));
  if (this.repairStatus === "Delivered" && !this.deliveredAt) this.deliveredAt = new Date();
});

export const Repair = mongoose.model("Repair", repairSchema);
