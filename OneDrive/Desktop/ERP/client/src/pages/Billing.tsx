import { CreditCard, Keyboard, MessageCircle, Minus, Plus, Printer, ReceiptText, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { StockBadge } from "../components/ewc/StockBadge";
import { CategoryBar } from "../components/pos/CategoryBar";
import { PaymentBar } from "../components/pos/PaymentBar";
import { Button, Card, Field, PageShell, compactInputClass, inputClass } from "../components/ui";
import { usePermissions } from "../hooks/usePermissions";
import { Product } from "../types/product";
import { downloadInvoicePdf, printInvoice, shareWhatsApp, type InvoiceData } from "../utils/invoice";
import { currency, productLabel } from "../utils/format";

type CartItem = Product & {
  saleQty: number;
  sellingPriceOverride: number;
  /** Admin: cost per unit for margin display (does not change inventory) */
  costOverride: number;
};

export function Billing() {
  const { canViewCost } = usePermissions();
  const searchRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [q, setQ] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [category, setCategory] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);
  const [mixed, setMixed] = useState({ cash: 0, upi: 0, card: 0 });
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastBill, setLastBill] = useState<InvoiceData | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [scanSound, setScanSound] = useState(true);

  const loadProducts = useCallback(async () => {
    const { data } = await api.get("/inventory", {
      params: { q: q || undefined, category: category || undefined, limit: 100 }
    });
    setItems(data.items);
  }, [q, category]);

  useEffect(() => {
    const t = window.setTimeout(loadProducts, 250);
    return () => window.clearTimeout(t);
  }, [loadProducts]);

  const lineTotal = (line: CartItem) => line.sellingPriceOverride * line.saleQty;
  const lineCost = (line: CartItem) => line.costOverride * line.saleQty;

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + lineTotal(item), 0), [cart]);
  const gstAmount = useMemo(() => subtotal * (gstPercent / 100), [subtotal, gstPercent]);
  const total = useMemo(() => Math.max(0, subtotal + gstAmount - discount), [subtotal, gstAmount, discount]);
  const cartProfit = useMemo(
    () => (canViewCost ? cart.reduce((sum, item) => sum + (lineTotal(item) - lineCost(item)), 0) : 0),
    [cart, canViewCost]
  );

  useEffect(() => {
    if (paymentMethod === "Mixed") setMixed((m) => ({ ...m, cash: total }));
  }, [paymentMethod, total]);

  useEffect(() => {
    if (!cart.length) {
      setSelectedLineId(null);
      return;
    }
    if (!selectedLineId || !cart.some((line) => line._id === selectedLineId)) {
      setSelectedLineId(cart[0]._id);
    }
  }, [cart, selectedLineId]);

  function pick(item: Product) {
    if (item.currentStock < 1) {
      toast.error("Out of stock");
      return;
    }
    setCart((old) => {
      const existing = old.find((x) => x._id === item._id);
      if (existing) {
        if (existing.saleQty >= item.currentStock) {
          toast.error("Not enough stock");
          return old;
        }
        return old.map((x) => (x._id === item._id ? { ...x, saleQty: x.saleQty + 1 } : x));
      }
      return [
        ...old,
        {
          ...item,
          saleQty: 1,
          sellingPriceOverride: item.sellingPrice,
          costOverride: item.purchasePrice ?? 0
        }
      ];
    });
    setSelectedLineId(item._id);
    if (barcodeMode) {
      window.setTimeout(() => barcodeRef.current?.focus(), 0);
    }
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

  function updateLineRate(id: string, rate: number) {
    if (rate < 0 || Number.isNaN(rate)) return;
    setCart((rows) => rows.map((r) => (r._id === id ? { ...r, sellingPriceOverride: rate } : r)));
  }

  function updateLineCost(id: string, cost: number) {
    if (cost < 0 || Number.isNaN(cost)) return;
    setCart((rows) => rows.map((r) => (r._id === id ? { ...r, costOverride: cost } : r)));
  }

  function removeLine(id: string) {
    setCart((rows) => rows.filter((r) => r._id !== id));
  }

  async function createBill() {
    setCheckingOut(true);
    try {
      const paidAmount = paymentMethod === "Mixed" ? mixed.cash + mixed.upi + mixed.card : total;
      if (paymentMethod === "Mixed" && Math.abs(paidAmount - total) > 0.02) {
        toast.error("Split payment must equal total");
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
          sellingPrice: item.sellingPriceOverride,
          total: lineTotal(item)
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
      toast.success(`Bill saved — ${currency(total)}`);
      setCart([]);
      setDiscount(0);
      setGstPercent(0);
      loadProducts();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Could not save bill");
    } finally {
      setCheckingOut(false);
    }
  }

  function playScanBeep(success: boolean) {
    if (!scanSound) return;
    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = success ? 880 : 220;
      gain.gain.value = 0.03;
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.08);
    } catch {
      // Ignore beep failures on unsupported browsers/devices.
    }
  }

  async function handleBarcodeSubmit(rawInput: string) {
    const cleaned = rawInput.trim();
    if (!cleaned) return;

    let quantity = 1;
    let code = cleaned;
    const qtyMatch = cleaned.match(/^(\d+)\s*[*xX]\s*(.+)$/);
    if (qtyMatch) {
      quantity = Math.max(1, Number(qtyMatch[1]) || 1);
      code = qtyMatch[2].trim();
    }

    const byLocalMatch =
      items.find((item) => item.productId?.toLowerCase() === code.toLowerCase()) ||
      items.find((item) => item.productId?.toLowerCase().startsWith(code.toLowerCase()));

    let matched = byLocalMatch;
    if (!matched) {
      const { data } = await api.get("/inventory", { params: { q: code, limit: 20 } });
      const fetched = (data.items || []) as Product[];
      matched =
        fetched.find((item) => item.productId?.toLowerCase() === code.toLowerCase()) ||
        fetched.find((item) => item.productId?.toLowerCase().startsWith(code.toLowerCase())) ||
        fetched[0];
    }

    if (!matched) {
      playScanBeep(false);
      toast.error(`No item found for code "${code}"`);
      return;
    }

    for (let i = 0; i < quantity; i += 1) {
      pick(matched);
    }
    playScanBeep(true);
    setScanCode("");
    if (barcodeMode) {
      window.setTimeout(() => barcodeRef.current?.focus(), 0);
    }
  }

  useEffect(() => {
    function handleHotkeys(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inField =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (e.key === "F2" || (e.ctrlKey && e.key.toLowerCase() === "b")) {
        e.preventDefault();
        if (barcodeMode) {
          barcodeRef.current?.focus();
          barcodeRef.current?.select();
        } else {
          searchRef.current?.focus();
          searchRef.current?.select();
        }
        return;
      }

      if (e.key === "F4") {
        e.preventDefault();
        setShowHotkeys((s) => !s);
        return;
      }

      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        if (cart.length && !checkingOut) {
          void createBill();
        }
        return;
      }

      if (e.altKey && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        const map: Record<string, string> = { "1": "Cash", "2": "UPI", "3": "Card", "4": "Mixed" };
        setPaymentMethod(map[e.key]);
        return;
      }

      if (e.ctrlKey && e.key === "Backspace") {
        e.preventDefault();
        setCart([]);
        setSelectedLineId(null);
        return;
      }

      if (!inField && e.key === "Enter" && q.trim() && items[0]) {
        e.preventDefault();
        pick(items[0]);
        return;
      }

      if (!selectedLineId || inField) return;

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        adjustQty(selectedLineId, 1);
      } else if (e.key === "-") {
        e.preventDefault();
        adjustQty(selectedLineId, -1);
      } else if (e.key === "Delete") {
        e.preventDefault();
        removeLine(selectedLineId);
      }
    }

    window.addEventListener("keydown", handleHotkeys);
    return () => window.removeEventListener("keydown", handleHotkeys);
  }, [cart.length, checkingOut, createBill, items, q, selectedLineId]);

  return (
    <PageShell className="pb-28 lg:pb-8">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">New Bill</h1>
          <p className="text-sm text-muted">Lightning mode: F2 focus, Enter quick-add, Ctrl+Enter checkout.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBarcodeMode((s) => !s)}
            className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${
              barcodeMode ? "border-success bg-success text-white" : "border-line bg-white text-muted"
            }`}
          >
            Barcode Mode {barcodeMode ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={() => setScanSound((s) => !s)}
            className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${
              scanSound ? "border-brand bg-brand/10 text-brand" : "border-line bg-white text-muted"
            }`}
          >
            Scan Beep {scanSound ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={() => setShowHotkeys((s) => !s)}
            className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-muted"
          >
            <Keyboard size={15} />
            {showHotkeys ? "Hide shortcuts" : "Show shortcuts"}
          </button>
        </div>
      </div>

      {showHotkeys && (
        <Card className="mb-4 !rounded-xl !p-3">
          <div className="grid gap-2 text-xs text-muted sm:grid-cols-2 lg:grid-cols-4">
            <p><strong className="text-cream">F2 / Ctrl+B:</strong> Focus search</p>
            <p><strong className="text-cream">Enter:</strong> Add first search result</p>
            <p><strong className="text-cream">+ / -:</strong> Qty up/down (selected row)</p>
            <p><strong className="text-cream">Delete:</strong> Remove selected row</p>
            <p><strong className="text-cream">Alt+1..4:</strong> Cash/UPI/Card/Mixed</p>
            <p><strong className="text-cream">Ctrl+Enter:</strong> Checkout bill</p>
            <p><strong className="text-cream">Ctrl+Backspace:</strong> Clear cart</p>
            <p><strong className="text-cream">F4:</strong> Toggle shortcut panel</p>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_430px]">
        <div className="flex min-h-0 flex-col gap-3">
          {barcodeMode && (
            <div className="rounded-2xl border border-success/30 bg-success/10 p-2 shadow-soft">
              <input
                ref={barcodeRef}
                className="min-h-[48px] w-full rounded-xl border border-success/30 bg-white px-3 text-base outline-none placeholder:text-muted"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    await handleBarcodeSubmit(scanCode);
                  }
                }}
                placeholder='Scan barcode / product ID (use "3xCODE" for quantity)'
                autoFocus
              />
            </div>
          )}
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-white p-2 shadow-soft">
            <Search className="ml-2 shrink-0 text-muted" size={22} />
            <input
              ref={searchRef}
              className="min-h-[48px] flex-1 bg-transparent text-base outline-none placeholder:text-muted"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && items[0]) {
                  e.preventDefault();
                  pick(items[0]);
                }
              }}
              placeholder="Search product…"
              autoFocus
            />
          </div>

          <div className="grid min-h-0 gap-3 lg:grid-cols-[138px_1fr]">
            <div className="rounded-2xl border border-line bg-white p-2 shadow-soft">
              <CategoryBar active={category} onChange={setCategory} vertical />
            </div>
            <div className="grid max-h-[min(58vh,560px)] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => pick(item)}
                  disabled={item.currentStock < 1}
                  className="flex flex-col rounded-xl border border-line bg-white p-3 text-left shadow-soft transition hover:border-brand/50 active:scale-[0.98] disabled:opacity-40"
                >
                  <div className="mb-2 grid h-16 place-items-center rounded-lg bg-surface-2">
                    <span className="text-xs font-semibold text-muted">{item.category.split(" ")[0]}</span>
                  </div>
                  <p className="line-clamp-2 text-sm font-bold leading-snug">{productLabel(item)}</p>
                  <p className="mt-0.5 text-[10px] text-muted">{item.category}</p>
                  <div className="mt-auto flex items-end justify-between gap-1 pt-2">
                    <span className="text-lg font-bold text-brand">{currency(item.sellingPrice)}</span>
                    <StockBadge current={item.currentStock} minimum={item.minimumStock} />
                  </div>
                </button>
              ))}
              {!items.length && <p className="col-span-full py-8 text-center text-sm text-muted">No products in this category</p>}
            </div>
          </div>
        </div>

        <Card className="flex flex-col border-brand/10 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <ReceiptText className="text-brand" size={24} />
            <div>
              <p className="font-bold">Bill summary</p>
              <p className="text-xs text-muted">Current Bill</p>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto py-3" style={{ maxHeight: "min(40vh, 320px)" }}>
            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">Cart is empty — tap a product</p>
            ) : (
              cart.map((line) => (
                <div
                  key={line._id}
                  className={`rounded-lg border p-2.5 ${
                    selectedLineId === line._id ? "border-brand bg-brand/10" : "border-line bg-surface-2/60"
                  }`}
                  onClick={() => setSelectedLineId(line._id)}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-semibold leading-snug">{productLabel(line)}</p>
                    <button type="button" onClick={() => removeLine(line._id)} className="shrink-0 text-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-0.5 rounded-lg border border-line p-0.5">
                      <button type="button" className="pos-key !min-h-9 !w-9" onClick={() => adjustQty(line._id, -1)}>
                        <Minus size={16} />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-bold">{line.saleQty}</span>
                      <button type="button" className="pos-key !min-h-9 !w-9" onClick={() => adjustQty(line._id, 1)}>
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="font-bold text-brand">{currency(lineTotal(line))}</span>
                  </div>

                  <div className={`mt-2 grid gap-2 ${canViewCost ? "grid-cols-2" : "grid-cols-1"}`}>
                    <label className="block">
                      <span className="text-[10px] font-semibold uppercase text-muted">Sale rate ₹</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        className={`${compactInputClass} mt-0.5 font-semibold`}
                        value={line.sellingPriceOverride || ""}
                        onChange={(e) => updateLineRate(line._id, Number(e.target.value) || 0)}
                      />
                    </label>
                    {canViewCost && (
                      <label className="block">
                        <span className="text-[10px] font-semibold uppercase text-muted">Cost ₹</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className={`${compactInputClass} mt-0.5`}
                          value={line.costOverride || ""}
                          onChange={(e) => updateLineCost(line._id, Number(e.target.value) || 0)}
                        />
                      </label>
                    )}
                  </div>
                  {canViewCost && (
                    <p className="mt-1 text-[10px] text-muted">
                      Profit this line:{" "}
                      <span className={lineTotal(line) - lineCost(line) >= 0 ? "text-success" : "text-danger"}>
                        {currency(lineTotal(line) - lineCost(line))}
                      </span>
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 border-t border-line pt-3">
            {canViewCost && cart.length > 0 && (
              <div className="rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm">
                <span className="text-muted">Est. profit on this bill: </span>
                <span className="font-bold text-success">{currency(cartProfit)}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Field label="Discount ₹">
                <input
                  type="number"
                  min={0}
                  className={compactInputClass}
                  value={discount || ""}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                />
              </Field>
              <Field label="Tax %">
                <input
                  type="number"
                  min={0}
                  max={28}
                  className={compactInputClass}
                  value={gstPercent || ""}
                  onChange={(e) => setGstPercent(Math.max(0, Number(e.target.value) || 0))}
                />
              </Field>
            </div>

            <PaymentBar value={paymentMethod} onChange={setPaymentMethod} />

            {paymentMethod === "Mixed" && (
              <div className="grid grid-cols-3 gap-2">
                {(["cash", "upi", "card"] as const).map((key) => (
                  <Field key={key} label={key.toUpperCase()}>
                    <input
                      type="number"
                      min={0}
                      className={compactInputClass}
                      value={mixed[key] || ""}
                      onChange={(e) => setMixed({ ...mixed, [key]: Number(e.target.value) || 0 })}
                    />
                  </Field>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-brand/20 bg-brand/10 px-3 py-2 text-sm">
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
              <div className="mt-2 flex justify-between text-xl font-bold text-success">
                <span>Total</span>
                <span>{currency(total)}</span>
              </div>
            </div>

            <input
              className={`${inputClass} !min-h-[44px] !text-sm`}
              placeholder="Customer name (optional)"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            />
            <input
              className={`${inputClass} !min-h-[44px] !text-sm`}
              placeholder="Phone (optional)"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            />

            <Button disabled={!cart.length || checkingOut} onClick={createBill} className="w-full !min-h-[52px]" size="lg">
              <CreditCard size={20} />
              {checkingOut ? "Saving…" : `Charge ${currency(total)}`}
            </Button>

            {lastBill && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" className="!min-h-[44px] !bg-success !text-white" onClick={() => printInvoice(lastBill, true)}>
                  <Printer size={16} /> Print
                </Button>
                <Button variant="secondary" size="sm" className="!min-h-[44px] !bg-brand !text-white" onClick={() => downloadInvoicePdf(lastBill)}>
                  PDF
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="col-span-2 !min-h-[44px] !border-success/40 !bg-white !text-success"
                  onClick={() => shareWhatsApp(lastBill, customer.phone || undefined)}
                >
                  <MessageCircle size={18} /> Share on WhatsApp
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
