import { Download, MessageCircle, Printer, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Badge, Button, Card, PageShell, inputClass } from "../components/ui";
import { downloadInvoicePdf, printInvoice, shareWhatsApp, type InvoiceData } from "../utils/invoice";
import { currency, formatDateTime } from "../utils/format";

type SaleRecord = {
  _id: string;
  billNumber: string;
  subtotal: number;
  discount: number;
  gstAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  customerSnapshot?: { name?: string; phone?: string };
  items: Array<{ description?: string; quantity: number; sellingPrice: number; total: number }>;
};

function toInvoice(sale: SaleRecord): InvoiceData {
  return {
    billNumber: sale.billNumber,
    createdAt: sale.createdAt,
    customerName: sale.customerSnapshot?.name,
    customerPhone: sale.customerSnapshot?.phone,
    items: sale.items.map((i) => ({
      description: i.description || "Item",
      quantity: i.quantity,
      sellingPrice: i.sellingPrice,
      total: i.total
    })),
    subtotal: sale.subtotal ?? sale.totalAmount,
    discount: sale.discount ?? 0,
    gstAmount: sale.gstAmount ?? 0,
    totalAmount: sale.totalAmount,
    paymentMethod: sale.paymentMethod
  };
}

export function Sales() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SaleRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/sales");
      setSales(data.sales);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return sales;
    return sales.filter(
      (s) =>
        s.billNumber.toLowerCase().includes(term) ||
        s.customerSnapshot?.name?.toLowerCase().includes(term) ||
        s.customerSnapshot?.phone?.includes(term)
    );
  }, [sales, q]);

  async function confirmVoid() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/sales/${deleteTarget._id}`);
      toast.success("Bill removed — stock restored");
      setDeleteTarget(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Could not remove bill");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageShell className="space-y-4">
      <div className="rounded-2xl border border-brand/20 bg-brand/10 p-5">
        <p className="text-lg font-bold">Past bills</p>
        <p className="mt-1 text-base text-muted">Search a bill number, print, download PDF, or share.</p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-3">
        <Search className="shrink-0 text-muted" size={22} />
        <input
          className={`${inputClass} min-h-[52px] flex-1 border-0 bg-transparent text-base`}
          placeholder="Bill number or customer phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-center text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card className="py-12 text-center text-base text-muted">No bills found.</Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((sale) => (
            <li key={sale._id} className="enterprise-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xl font-bold text-brand">{sale.billNumber}</p>
                  <p className="mt-1 text-base text-muted">
                    {sale.customerSnapshot?.name || "Walk-in customer"} · {formatDateTime(sale.createdAt)}
                  </p>
                  <Badge tone="brand" className="mt-2">
                    {sale.paymentMethod}
                  </Badge>
                </div>
                <p className="font-display text-3xl font-bold">{currency(sale.totalAmount)}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" className="min-h-[44px]" onClick={() => printInvoice(toInvoice(sale))}>
                  <Printer size={18} /> Print
                </Button>
                <Button variant="secondary" size="sm" className="min-h-[44px]" onClick={() => downloadInvoicePdf(toInvoice(sale))}>
                  <Download size={18} /> PDF
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-[44px] !text-success"
                  onClick={() => shareWhatsApp(toInvoice(sale), sale.customerSnapshot?.phone)}
                >
                  <MessageCircle size={18} /> WhatsApp
                </Button>
                <Button variant="ghost" size="sm" className="min-h-[44px] !text-danger" onClick={() => setDeleteTarget(sale)}>
                  <Trash2 size={18} /> Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove this bill?"
        message={deleteTarget ? `${deleteTarget.billNumber} will be deleted and stock put back.` : ""}
        onConfirm={confirmVoid}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </PageShell>
  );
}
