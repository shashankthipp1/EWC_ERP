import { CreditCard, Minus, Plus, Printer, ReceiptText, Search, Share2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { StockBadge } from "../components/ewc/StockBadge";
import { Badge, Button, Card, Field, PageShell, inputClass } from "../components/ui";
import { PAYMENT_MODES } from "../data/categories";
import { Product } from "../types/product";
import { downloadInvoicePdf, printInvoice, shareInvoice, type InvoiceData } from "../utils/invoice";
import { currency, productLabel } from "../utils/format";

type CartItem = Product & { saleQty: number; sellingPriceOverride: number };

export function Billing() {
  const [items, setItems] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [q, setQ] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [discount, setDiscount] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);
  const [mixed, setMixed] = useState({ cash: 0, upi: 0, card: 0 });
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastBill, setLastBill] = useState<InvoiceData | null>(null);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + (item.sellingPriceOverride || item.sellingPrice) * item.saleQty, 0),
    [cart]
  );
  const gstAmount = useMemo(() => subtotal * (gstPercent / 100), [subtotal, gstPercent]);
  const total = useMemo(() => Math.max(0, subtotal + gstAmount - discount), [subtotal, gstAmount, discount]);

  useEffect(() => {
    api.get("/inventory", { params: { q, limit: 80 } }).then((res) => setItems(res.data.items));
  }, [q]);

  useEffect(() => {
    if (paymentMethod !== "Mixed") return;
    setMixed((m) => ({ ...m, cash: total }));
  }, [paymentMethod, total]);

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
      const paidAmount = paymentMethod === "Mixed" ? mixed.cash + mixed.upi + mixed.card : total;
      if (paymentMethod === "Mixed" && Math.abs(paidAmount - total) > 0.02) {
        toast.error("Mixed payment must equal the bill total");
        return;
      }
      const { data } = await api.post("/sales", {
        customer,
        paymentMethod,
        discount,
        gstPercent,
        paidAmount,
        paymentBreakdown: paymentMethod === "Mixed" ? mixed : undefined,
        items: cart.map((item) => ({
          inventoryItem: item._id,
          quantity: item.saleQty,
          sellingPrice: item.sellingPriceOverride,
          description: productLabel(item)
        }))
      });
      const sale = data.sale;
      const invoice: InvoiceData = {
        billNumber: sale.billNumber,
        createdAt: sale.createdAt,
        customerName: customer.name,
        customerPhone: customer.phone,
        items: cart.map((item) => ({
          description: productLabel(item),
          quantity: item.saleQty,
          sellingPrice: item.sellingPriceOverride || item.sellingPrice,
          total: (item.sellingPriceOverride || item.sellingPrice) * item.saleQty
        })),
        subtotal,
        discount,
        gstAmount,
        totalAmount: total,
        paymentMethod,
        paymentNote:
          paymentMethod === "Mixed"
            ? `Cash ${currency(mixed.cash)} · UPI ${currency(mixed.upi)} · Card ${currency(mixed.card)}`
            : undefined
      };
      setLastBill(invoice);
      toast.success(`Bill ${sale.billNumber} — ${currency(total)}`);
      setCart([]);
      setDiscount(0);
      setGstPercent(0);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Could not complete bill");
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <PageShell>
      <div className="grid min-h-[calc(100vh-12rem)] gap-4 xl:grid-cols-[1fr_420px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-panel/90 p-2 shadow-soft">
            <Search className="ml-2 shrink-0 text-muted" size={24} />
            <input
              className="min-h-[52px] flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search product name or model…"
              autoFocus
            />
          </div>

          <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => pick(item)}
                disabled={item.currentStock < 1}
                className="flex min-h-[120px] flex-col rounded-2xl border border-line bg-surface-2/80 p-4 text-left transition hover:border-brand/40 active:scale-[0.98] disabled:opacity-40"
              >
                <p className="line-clamp-2 text-base font-bold text-cream">{productLabel(item)}</p>
                <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                  <span className="text-xl font-bold text-brand">{currency(item.sellingPrice)}</span>
                  <StockBadge current={item.currentStock} minimum={item.minimumStock} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <Card className="sticky top-24 flex flex-col border-brand/20 shadow-lift max-xl:bottom-20">
          <div className="mb-4 flex items-center gap-3 border-b border-line pb-4">
            <ReceiptText className="text-brand" size={28} />
            <div>
              <p className="text-xl font-bold text-cream">Current bill</p>
              <p className="text-base text-muted">{cart.length} items</p>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto" style={{ maxHeight: "min(36vh, 280px)" }}>
            {cart.length === 0 ? (
              <p className="py-12 text-center text-base text-muted">Tap products on the left to add them</p>
            ) : (
              cart.map((line) => (
                <div key={line._id} className="rounded-xl border border-line bg-navyLight/50 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-semibold leading-snug">{productLabel(line)}</p>
                    <button type="button" onClick={() => removeLine(line._id)} className="text-muted hover:text-danger">
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-xl border border-line bg-surface-2 p-1">
                      <button type="button" className="pos-key !min-h-11 !w-11" onClick={() => adjustQty(line._id, -1)}>
                        <Minus size={18} />
                      </button>
                      <span className="min-w-[2.5rem] text-center text-lg font-bold">{line.saleQty}</span>
                      <button type="button" className="pos-key !min-h-11 !w-11" onClick={() => adjustQty(line._id, 1)}>
                        <Plus size={18} />
                      </button>
                    </div>
                    <span className="text-xl font-bold text-brand">
                      {currency((line.sellingPriceOverride || line.sellingPrice) * line.saleQty)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 grid gap-3 border-t border-line pt-4">
            <Field label="Customer name (optional)">
              <input className={`${inputClass} min-h-[48px] text-base`} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
            </Field>
            <Field label="Phone (optional)">
              <input className={`${inputClass} min-h-[48px] text-base`} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount (₹)">
                <input
                  type="number"
                  min={0}
                  className={`${inputClass} min-h-[48px] text-base`}
                  value={discount || ""}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                />
              </Field>
              <Field label="Tax %">
                <input
                  type="number"
                  min={0}
                  max={28}
                  className={`${inputClass} min-h-[48px] text-base`}
                  value={gstPercent || ""}
                  onChange={(e) => setGstPercent(Math.max(0, Number(e.target.value) || 0))}
                />
              </Field>
            </div>
            <Field label="How did they pay?">
              <select className={`${inputClass} min-h-[52px] text-base`} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            {paymentMethod === "Mixed" && (
              <div className="grid gap-2 rounded-xl border border-line bg-surface-2 p-3">
                <p className="text-sm font-semibold text-muted">Split amount (must equal total)</p>
                {(["cash", "upi", "card"] as const).map((key) => (
                  <Field key={key} label={key.toUpperCase()}>
                    <input
                      type="number"
                      min={0}
                      className={`${inputClass} min-h-[44px]`}
                      value={mixed[key] || ""}
                      onChange={(e) => setMixed({ ...mixed, [key]: Number(e.target.value) || 0 })}
                    />
                  </Field>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-1 rounded-xl bg-brand/10 px-4 py-3 text-base">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{currency(subtotal)}</span>
            </div>
            {gstAmount > 0 && (
              <div className="flex justify-between text-muted">
                <span>Tax</span>
                <span>{currency(gstAmount)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-muted">
                <span>Discount</span>
                <span>-{currency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 text-xl font-bold text-brand">
              <span>Total</span>
              <span>{currency(total)}</span>
            </div>
          </div>

          <Button disabled={!cart.length || checkingOut} onClick={createBill} className="mt-4 w-full min-h-[56px] text-lg" size="lg">
            <CreditCard size={22} />
            {checkingOut ? "Saving…" : "Save bill"}
          </Button>

          {lastBill && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" className="min-h-[44px] flex-1" onClick={() => printInvoice(lastBill)}>
                <Printer size={18} /> Print
              </Button>
              <Button variant="secondary" className="min-h-[44px] flex-1" onClick={() => downloadInvoicePdf(lastBill)}>
                PDF
              </Button>
              <Button variant="secondary" className="min-h-[44px] flex-1" onClick={() => shareInvoice(lastBill).catch(() => toast.error("Share not available"))}>
                <Share2 size={18} /> Share
              </Button>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
