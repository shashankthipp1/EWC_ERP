import mongoose from "mongoose";

const orderListSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: String,
    status: { type: String, enum: ["Draft", "Sent", "Partially Received", "Received", "Cancelled"], default: "Draft", index: true },
    expectedDate: Date,
    totalEstimatedCost: { type: Number, default: 0 },
    notes: String,
    items: [
      {
        category: String,
        data: { type: Map, of: mongoose.Schema.Types.Mixed },
        quantity: Number
      }
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const OrderList = mongoose.model("OrderList", orderListSchema);
