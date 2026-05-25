import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    billNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerSnapshot: {
      name: String,
      phone: String,
      address: String
    },
    items: [
      {
        inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem" },
        category: String,
        description: String,
        quantity: Number,
        purchasePrice: Number,
        sellingPrice: Number,
        discount: { type: Number, default: 0 },
        gstRate: { type: Number, default: 0 },
        total: Number
      }
    ],
    subtotal: Number,
    discount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalAmount: Number,
    paidAmount: Number,
    paymentMethod: { type: String, enum: ["Cash", "UPI", "Card", "Bank Transfer", "Credit"], default: "Cash" },
    status: { type: String, enum: ["Paid", "Partial", "Pending"], default: "Paid" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const Sale = mongoose.model("Sale", saleSchema);
