import { ProductCategory } from "../data/categories";

export type Product = {
  _id: string;
  productId: string;
  category: ProductCategory;
  brand: string;
  modelNumber: string;
  colorVariant: string;
  purchasePrice?: number;
  sellingPrice: number;
  mrp?: number;
  currentStock: number;
  minimumStock: number;
  batteryType: string;
  accessoryType: string;
  strapType: string;
  watchDisplay: string;
  supplierName: string;
  createdAt: string;
  updatedAt: string;
};

export type { ProductFormValues } from "../data/productFields";
export { emptyProduct } from "../data/productFields";
