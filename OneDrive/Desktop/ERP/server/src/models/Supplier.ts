import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    phone: String,
    email: String,
    gstNumber: String,
    address: String,
    categories: [String],
    outstandingAmount: { type: Number, default: 0 },
    rating: { type: Number, default: 5 },
    notes: String
  },
  { timestamps: true }
);

export const Supplier = mongoose.model("Supplier", supplierSchema);
