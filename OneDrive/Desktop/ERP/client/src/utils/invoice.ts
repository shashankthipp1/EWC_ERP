import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { APP_HEADER, APP_NAME, APP_TAGLINE, SHOP_DISPLAY_NAME } from "../constants/branding";
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

export function formatInvoiceText(data: InvoiceData): string {
  const lines = [
    `*${APP_NAME}*`,
    SHOP_DISPLAY_NAME,
    `Bill: *${data.billNumber}*`,
    `Date: ${formatDateTime(data.createdAt)}`
  ];
  if (data.customerName) lines.push(`Customer: ${data.customerName}`);
  if (data.customerPhone) lines.push(`Phone: ${data.customerPhone}`);
  lines.push("", "*Items*");
  for (const item of data.items) {
    lines.push(`• ${item.description}`);
    lines.push(`  ${item.quantity} × ${currency(item.sellingPrice)} = ${currency(item.total)}`);
  }
  lines.push("");
  lines.push(`Subtotal: ${currency(data.subtotal)}`);
  if (data.discount > 0) lines.push(`Discount: -${currency(data.discount)}`);
  if (data.gstAmount > 0) lines.push(`Tax: ${currency(data.gstAmount)}`);
  lines.push(`*TOTAL: ${currency(data.totalAmount)}*`);
  lines.push(`Payment: ${data.paymentMethod}${data.paymentNote ? ` (${data.paymentNote})` : ""}`);
  lines.push("", "Thank you for shopping with us!");
  return lines.join("\n");
}

export function buildInvoicePdf(data: InvoiceData): jsPDF {
  const doc = new jsPDF();
  let y = 14;
  doc.setFontSize(18);
  doc.text(APP_NAME, 14, y);
  y += 7;
  doc.setFontSize(11);
  doc.text(SHOP_DISPLAY_NAME, 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.text(APP_HEADER, 14, y);
  y += 5;
  doc.text(APP_TAGLINE, 14, y);
  y += 10;
  doc.setFontSize(11);
  doc.text(`Bill No: ${data.billNumber}`, 14, y);
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
    styles: { fontSize: 9 },
    headStyles: { fillColor: [13, 148, 136] }
  });
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.text(`Subtotal: ${currency(data.subtotal)}`, 14, finalY);
  let offset = 6;
  if (data.discount > 0) {
    doc.text(`Discount: -${currency(data.discount)}`, 14, finalY + offset);
    offset += 6;
  }
  if (data.gstAmount > 0) {
    doc.text(`Tax (GST): ${currency(data.gstAmount)}`, 14, finalY + offset);
    offset += 6;
  }
  doc.setFontSize(13);
  doc.text(`Grand Total: ${currency(data.totalAmount)}`, 14, finalY + offset + 2);
  doc.setFontSize(9);
  doc.text(`Paid via: ${data.paymentMethod}${data.paymentNote ? ` — ${data.paymentNote}` : ""}`, 14, finalY + offset + 12);
  return doc;
}

export function downloadInvoicePdf(data: InvoiceData) {
  buildInvoicePdf(data).save(`${data.billNumber}.pdf`);
}

/** Thermal / receipt-style print (58mm-friendly) */
export function printInvoice(data: InvoiceData, thermal = true) {
  if (thermal) {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${data.billNumber}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  body { font-family: system-ui, sans-serif; font-size: 12px; max-width: 72mm; margin: 0 auto; color: #000; }
  h1 { font-size: 16px; margin: 0 0 4px; text-align: center; }
  .sub { text-align: center; font-size: 10px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { text-align: left; padding: 3px 0; border-bottom: 1px dashed #ccc; }
  td.r, th.r { text-align: right; }
  .total { font-size: 14px; font-weight: bold; margin-top: 8px; text-align: right; }
  .muted { color: #555; font-size: 10px; }
</style></head><body>
<h1>${APP_NAME}</h1>
<p class="sub">${SHOP_DISPLAY_NAME}<br/>${data.billNumber}<br/>${formatDateTime(data.createdAt)}</p>
${data.customerName ? `<p class="muted">Customer: ${data.customerName}${data.customerPhone ? ` · ${data.customerPhone}` : ""}</p>` : ""}
<table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Amt</th></tr></thead><tbody>
${data.items.map((i) => `<tr><td>${i.description}</td><td class="r">${i.quantity}</td><td class="r">${currency(i.total)}</td></tr>`).join("")}
</tbody></table>
<p class="muted">Subtotal: ${currency(data.subtotal)}${data.discount > 0 ? `<br/>Discount: -${currency(data.discount)}` : ""}${data.gstAmount > 0 ? `<br/>Tax: ${currency(data.gstAmount)}` : ""}</p>
<p class="total">TOTAL ${currency(data.totalAmount)}</p>
<p class="muted">Payment: ${data.paymentMethod}</p>
<p class="sub" style="margin-top:12px">Thank you!</p>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
    const win = window.open("", "_blank", "width=320,height=600");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
    return;
  }
  const doc = buildInvoicePdf(data);
  const blob = doc.output("bloburl");
  const w = window.open(blob, "_blank");
  if (w) w.onload = () => w.print();
}

export function shareWhatsApp(data: InvoiceData, phone?: string) {
  const text = encodeURIComponent(formatInvoiceText(data));
  const base = phone ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(base, "_blank", "noopener,noreferrer");
}

export async function shareInvoice(data: InvoiceData) {
  const doc = buildInvoicePdf(data);
  const blob = doc.output("blob");
  const file = new File([blob], `${data.billNumber}.pdf`, { type: "application/pdf" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: `Invoice ${data.billNumber}`,
      text: formatInvoiceText(data),
      files: [file]
    });
    return;
  }
  downloadInvoicePdf(data);
}
