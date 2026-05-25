import mongoose from "mongoose";
import { PRODUCT_CATEGORIES } from "../utils/categories.js";
import { buildProductSearchText, productFingerprint } from "../utils/productFields.js";

const inventorySchema = new mongoose.Schema(
  {
    productId: { type: String, unique: true, index: true },
    category: { type: String, required: true, enum: PRODUCT_CATEGORIES },
    brand: { type: String, required: true, trim: true },
    modelNumber: { type: String, default: "", trim: true },
    colorVariant: { type: String, default: "", trim: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    currentStock: { type: Number, default: 0, min: 0 },
    minimumStock: { type: Number, default: 5, min: 0 },
    batteryType: { type: String, default: "" },
    accessoryType: { type: String, default: "", trim: true },
    strapType: { type: String, default: "", trim: true },
    watchDisplay: { type: String, default: "", trim: true },
    supplierName: { type: String, default: "", trim: true },
    searchText: { type: String, index: "text" },
    duplicateKey: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

inventorySchema.pre("validate", function () {
  this.duplicateKey = productFingerprint({
    category: this.category,
    brand: this.brand,
    modelNumber: this.modelNumber,
    colorVariant: this.colorVariant,
    batteryType: this.batteryType,
    accessoryType: this.accessoryType,
    strapType: this.strapType,
    watchDisplay: this.watchDisplay
  });
  this.searchText = buildProductSearchText({
    productId: this.productId || undefined,
    category: this.category,
    brand: this.brand,
    modelNumber: this.modelNumber,
    colorVariant: this.colorVariant,
    purchasePrice: this.purchasePrice,
    sellingPrice: this.sellingPrice,
    currentStock: this.currentStock,
    minimumStock: this.minimumStock,
    batteryType: this.batteryType,
    accessoryType: this.accessoryType,
    strapType: this.strapType,
    watchDisplay: this.watchDisplay,
    supplierName: this.supplierName
  });
});

inventorySchema.pre("save", async function () {
  if (this.productId) return;
  const count = await mongoose.model("InventoryItem").countDocuments();
  this.productId = `OWS-${String(count + 1).padStart(5, "0")}`;
});

export const InventoryItem = mongoose.model("InventoryItem", inventorySchema);
