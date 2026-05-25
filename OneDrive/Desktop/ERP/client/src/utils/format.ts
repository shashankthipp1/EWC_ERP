export const currency = (value: number | string | undefined) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

export const indianNumber = (value: number | string | undefined) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

export const formatDate = (value: string | Date | undefined) => {
  if (!value) return "-";
  const d = new Date(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTime = (value: string | Date | undefined) => {
  if (!value) return "-";
  const d = new Date(value);
  return `${formatDate(d)} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
};

export const compactDate = formatDate;

export { productDisplayLabel as productLabel } from "../data/productFields";
