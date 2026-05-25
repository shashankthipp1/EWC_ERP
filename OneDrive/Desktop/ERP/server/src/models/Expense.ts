import mongoose from "mongoose";
import { EXPENSE_CATEGORIES, PAYMENT_MODES } from "../utils/categories.js";

const expenseSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now, required: true },
    category: { type: String, required: true, enum: EXPENSE_CATEGORIES },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: { type: String, enum: PAYMENT_MODES, default: "Cash" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const Expense = mongoose.model("Expense", expenseSchema);
