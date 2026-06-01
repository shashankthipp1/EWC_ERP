import { CreditCard, Minus, Plus, Printer, ReceiptText, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Badge, Button, Card, Field, PageShell, inputClass } from "../components/ui";
import { PAYMENT_MODES } from "../data/categories";
import { Product } from "../types/product";
import { currency, formatDate, productLabel } from "../utils/format";

type CartItem = Product & { saleQty: number; sellingPriceOverride: number };

type SaleRecord = {
  _id: string;
  billNumber: string;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  customerSnapshot?: { name?: string; phone?: string };
  items: Array<{ description?: string; quantity: number }>;
};

export function Billing() {
  const [items, setItems] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [q, setQ] = useState("");
  const [salesQ, setSalesQ] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [deleteTarget, setDeleteTarget] = useState<SaleRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + (item.sellingPriceOverride || item.sellingPrice) * item.saleQty, 0),
    [cart]
  );

  const loadSales = useCallback(async () => {
    const { data } = await api.get("/sales");
    setSales(data.sales);
  }, []);

  useEffect(() => {
    api.get("/inventory", { params: { q, limit: 80 } }).then((res) => setItems(res.data.items));
  }, [q]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const filteredSales = useMemo(() => {
    const term = salesQ.trim().toLowerCase();
    if (!term) return sales;
    return sales.filter(
      (s) =>
        s.billNumber.toLowerCase().includes(term) ||
        s.customerSnapshot?.name?.toLowerCase().includes(term) ||
        s.customerSnapshot?.phone?.includes(term) ||
        s.paymentMethod.toLowerCase().includes(term)
    );
  }, [sales, salesQ]);

  function pick(item: Product) {
    if (item.currentStock < 1) return toast.error("Out of stock");
    setCart((old) =>
      old.some((x) => x._id === item._id) ? old : [...old, { ...item, saleQty: 1, sellingPriceOverride: item.sellingPrice }]
    );
  }

  function adjustQty(id: string, delta: number) {
    setCart((rows) =>
      rows
        .map((r) => {
          if (r._id !== id) return r;
          const next = Math.min(r.currentStock, Math.max(1, r.saleQty + delta));
          return { ...r, saleQty: next };
        })
        .filter((r) => r.saleQty > 0)
    );
  }

  function removeLine(id: string) {
    setCart((rows) => rows.filter((r) => r._id !== id));
  }

  async function createBill() {
    setCheckingOut(true);
    try {
      const { data } = await api.post("/sales", {
        customer,
        paymentMethod,
        paidAmount: total,
        items: cart.map((item) => ({
          inventoryItem: item._id,
          quantity: item.saleQty,
          sellingPrice: item.sellingPriceOverride,
          description: productLabel(item)
        }))
      });
      toast.success(`Ticket ${data.sale.billNumber} — ${currency(total)}`);
      setCart([]);
      loadSales();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  }

  async function confirmDeleteSale() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/sales/${deleteTarget._id}`);
      toast.success("Voided — stock restored");
      setDeleteTarget(null);
      loadSales();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Void failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageShell>
      <div className="grid min-h-[calc(100vh-12rem)] gap-4 xl:grid-cols-[1fr_400px]">
        {/* Product grid — cashier left */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-panel/90 p-2 shadow-soft">
            <Search className="ml-2 shrink-0 text-muted" size={20} />
            <input
              className="min-h-[48px] flex-1 bg-transparent text-base outline-none placeholder:text-muted"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Scan or search SKU, brand, model…"
              autoFocus
            />
          </div>

          <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => pick(item)}
                disabled={item.currentStock < 1}
                className="flex flex-col rounded-2xl border border-line bg-surface-2/80 p-3 text-left transition hover:border-brand/40 hover:shadow-lift active:scale-[0.98] disabled:opacity-40"
              >
                <p className="line-clamp-2 text-sm font-semibold text-cream">{productLabel(item)}</p>
                <p className="mt-1 font-mono text-[10px] text-muted">{item.productId}</p>
                <div className="mt-auto flex items-end justify-between pt-3">
                  <span className="text-lg font-bold text-brand">{currency(item.sellingPrice)}</span>
                  <Badge tone={item.currentStock <= item.minimumStock ? "danger" : "neutral"}>{item.currentStock} left</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart — POS ticket */}
        <Card className="flex flex-col border-brand/20 shadow-lift">
          <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <ReceiptText className="text-brand" size={22} />
              <div>
                <p className="font-display font-bold text-cream">Current ticket</p>
                <p className="text-xs text-muted">{cart.length} line items</p>
              </div>
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setCart([])}>
                Clear
              </Button>
            )}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto" style={{ maxHeight: "min(40vh, 320px)" }}>
            {cart.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted">Tap products to add to ticket</p>
            ) : (
              cart.map((line) => (
                <div key={line._id} className="rounded-xl border border-line bg-navyLight/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{productLabel(line)}</p>
                    <button type="button" onClick={() => removeLine(line._id)} className="text-muted hover:text-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 p-0.5">
                      <button type="button" className="pos-key !min-h-9 !w-9 !text-base" onClick={() => adjustQty(line._id, -1)}>
                        <Minus size={16} />
                      </button>
                      <span className="min-w-[2rem] text-center font-bold">{line.saleQty}</span>
                      <button type="button" className="pos-key !min-h-9 !w-9 !text-base" onClick={() => adjustQty(line._id, 1)}>
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="font-bold text-brand">
                      {currency((line.sellingPriceOverride || line.sellingPrice) * line.saleQty)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 space-y-3 border-t border-line pt-4">
            <Field label="Guest name">
              <input className={inputClass} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Optional" />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
            </Field>
            <Field label="Payment">
              <select className={inputClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_MODES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-brand/10 px-4 py-3">
            <span className="text-sm font-medium text-muted">Total due</span>
            <span className="font-display text-3xl font-bold text-brand">{currency(total)}</span>
          </div>

          <Button disabled={!cart.length || checkingOut} onClick={createBill} className="mt-4 w-full" size="lg">
            <CreditCard size={20} />
            {checkingOut ? "Processing…" : "Charge & print"}
            <Printer size={18} className="ml-auto opacity-70" />
          </Button>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold">Recent tickets ({filteredSales.length})</h2>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3">
            <Search size={16} className="text-muted" />
            <input
              className="min-h-[40px] w-full min-w-[200px] bg-transparent text-sm outline-none"
              placeholder="Bill #, guest, phone…"
              value={salesQ}
              onChange={(e) => setSalesQ(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2/80 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Pay</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredSales.slice(0, 20).map((sale) => (
                <tr key={sale._id} className="data-grid-row">
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold text-brand">{sale.billNumber}</p>
                    <p className="text-xs text-muted">{formatDate(sale.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">{sale.customerSnapshot?.name || "—"}</td>
                  <td className="px-4 py-3">{sale.paymentMethod}</td>
                  <td className="px-4 py-3 font-semibold">{currency(sale.totalAmount)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="!text-danger" onClick={() => setDeleteTarget(sale)}>
                      Void
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Void ticket?"
        message={deleteTarget ? `Remove ${deleteTarget.billNumber}? Inventory will be restored.` : ""}
        onConfirm={confirmDeleteSale}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </PageShell>
  );
}
