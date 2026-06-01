import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { APP_HEADER, APP_TAGLINE, SHOP_DISPLAY_NAME } from "../constants/branding";
import { currency, formatDateTime } from "./format";

export type InvoiceLine = {
  description: string;
  quantity: number;
  sellingPrice: number;
  total: number;
};

export type InvoiceData = {
  billNumber: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  items: InvoiceLine[];
  subtotal: number;
  discount: number;
  gstAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentNote?: string;
};

export function buildInvoicePdf(data: InvoiceData): jsPDF {
  const doc = new jsPDF();
  let y = 14;
  doc.setFontSize(18);
  doc.text(SHOP_DISPLAY_NAME, 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(APP_HEADER, 14, y);
  y += 6;
  doc.text(APP_TAGLINE, 14, y);
  y += 10;
  doc.setFontSize(12);
  doc.text(`Bill: ${data.billNumber}`, 14, y);
  y += 6;
  doc.text(`Date: ${formatDateTime(data.createdAt)}`, 14, y);
  y += 6;
  if (data.customerName) {
    doc.text(`Customer: ${data.customerName}${data.customerPhone ? ` · ${data.customerPhone}` : ""}`, 14, y);
    y += 6;
  }
  autoTable(doc, {
    startY: y + 4,
    head: [["Item", "Qty", "Rate", "Amount"]],
    body: data.items.map((line) => [
      line.description,
      String(line.quantity),
      currency(line.sellingPrice),
      currency(line.total)
    ]),
    styles: { fontSize: 9 }
  });
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.text(`Subtotal: ${currency(data.subtotal)}`, 14, finalY);
  if (data.discount > 0) doc.text(`Discount: -${currency(data.discount)}`, 14, finalY + 6);
  if (data.gstAmount > 0) doc.text(`Tax: ${currency(data.gstAmount)}`, 14, finalY + (data.discount > 0 ? 12 : 6));
  const totalY = finalY + (data.discount > 0 ? 12 : 6) + (data.gstAmount > 0 ? 6 : 0) + 6;
  doc.setFontSize(14);
  doc.text(`Total: ${currency(data.totalAmount)}`, 14, totalY);
  doc.setFontSize(10);
  doc.text(`Paid via: ${data.paymentMethod}${data.paymentNote ? ` (${data.paymentNote})` : ""}`, 14, totalY + 8);
  return doc;
}

export function downloadInvoicePdf(data: InvoiceData) {
  buildInvoicePdf(data).save(`${data.billNumber}.pdf`);
}

export function printInvoice(data: InvoiceData) {
  const doc = buildInvoicePdf(data);
  const blob = doc.output("bloburl");
  const win = window.open(blob, "_blank");
  if (win) win.onload = () => win.print();
}

export async function shareInvoice(data: InvoiceData) {
  const doc = buildInvoicePdf(data);
  const blob = doc.output("blob");
  const file = new File([blob], `${data.billNumber}.pdf`, { type: "application/pdf" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: `Invoice ${data.billNumber}`,
      text: `${SHOP_DISPLAY_NAME} — ${currency(data.totalAmount)}`,
      files: [file]
    });
    return;
  }
  downloadInvoicePdf(data);
}
