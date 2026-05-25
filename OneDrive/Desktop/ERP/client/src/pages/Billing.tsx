import { ClipboardList, Printer, ReceiptText, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button, Card, Field, SectionHeader, inputClass } from "../components/ui";
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

  const total = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const price = item.sellingPriceOverride || item.sellingPrice;
        return sum + price * item.saleQty;
      }, 0),
    [cart]
  );

  const loadSales = useCallback(async () => {
    const { data } = await api.get("/sales");
    setSales(data.sales);
  }, []);

  useEffect(() => {
    api.get("/inventory", { params: { q, limit: 50 } }).then((res) => setItems(res.data.items));
  }, []);

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

  function search() {
    api.get("/inventory", { params: { q, limit: 50 } }).then((res) => setItems(res.data.items));
  }

  function pick(item: Product) {
    if (item.currentStock < 1) return toast.error("Out of stock");
    setCart((old) =>
      old.some((x) => x._id === item._id)
        ? old
        : [...old, { ...item, saleQty: 1, sellingPriceOverride: item.sellingPrice }]
    );
  }

  async function createBill() {
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
      toast.success(`Sale recorded: ${data.sale.billNumber}`);
      setCart([]);
      loadSales();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Sale failed");
    }
  }

  async function confirmDeleteSale() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/sales/${deleteTarget._id}`);
      toast.success("Sale deleted — stock restored");
      setDeleteTarget(null);
      loadSales();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Daily sales" title="Sales Tracking" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="flex min-h-[44px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-navy/60 px-3">
              <Search size={16} className="shrink-0 text-muted" />
              <input
                className="w-full min-h-[44px] bg-transparent py-2 text-base outline-none sm:text-sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search product…"
                onKeyDown={(e) => e.key === "Enter" && search()}
              />
            </div>
            <Button className="w-full sm:w-auto" onClick={search}>Search</Button>
          </div>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto md:hidden">
            {items.map((item) => (
              <div key={item._id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-navy/50 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{productLabel(item)}</p>
                  <p className="text-xs text-muted">{item.productId} · Stock {item.currentStock} · {currency(item.sellingPrice)}</p>
                </div>
                <Button variant="ghost" className="shrink-0" onClick={() => pick(item)}>Add</Button>
              </div>
            ))}
          </div>
          <div className="hidden max-h-[480px] overflow-y-auto md:block">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase text-cream/50">
                <tr>
                  <th className="px-2 py-2 text-left">Product</th>
                  <th className="px-2 py-2">Stock</th>
                  <th className="px-2 py-2">MRP</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-line/40">
                    <td className="px-2 py-2">
                      <p className="font-medium">{productLabel(item)}</p>
                      <p className="text-xs text-cream/50">{item.productId}</p>
                    </td>
                    <td className="px-2 py-2 text-center">{item.currentStock}</td>
                    <td className="px-2 py-2">{currency(item.sellingPrice)}</td>
                    <td className="px-2 py-2">
                      <Button variant="ghost" className="!min-h-8 !px-2 !py-1 text-xs" onClick={() => pick(item)}>
                        Add
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <ReceiptText size={20} className="text-gold" /> New Sale
          </h2>
          <div className="grid gap-3">
            <Field label="Customer Name (optional)">
              <input className={inputClass} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
            </Field>
          </div>
          <div className="my-4 space-y-3 border-y border-line py-4">
            {cart.map((item, index) => (
              <div key={item._id} className="rounded-lg bg-navy/50 p-3">
                <p className="text-sm font-medium">{productLabel(item)}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="Qty">
                    <input
                      className={inputClass}
                      type="number"
                      min={1}
                      max={item.currentStock}
                      value={item.saleQty}
                      onChange={(e) =>
                        setCart(cart.map((x, i) => (i === index ? { ...x, saleQty: Number(e.target.value) } : x)))
                      }
                    />
                  </Field>
                  <Field label="Selling price">
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      value={item.sellingPriceOverride}
                      onChange={(e) =>
                        setCart(cart.map((x, i) => (i === index ? { ...x, sellingPriceOverride: Number(e.target.value) } : x)))
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <Field label="Payment Mode">
            <select className={inputClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <div className="mt-5 flex items-center justify-between text-xl font-bold">
            <span>Total</span>
            <span className="text-gold">{currency(total)}</span>
          </div>
          <Button disabled={!cart.length} onClick={createBill} className="mt-4 w-full">
            <Printer size={16} /> Record Sale
          </Button>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <ClipboardList size={18} className="text-gold" /> Sales Records ({filteredSales.length})
        </h2>
        <div className="mb-4 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-line/50 bg-navy/40 px-3">
            <Search size={16} className="text-cream/50" />
            <input
              className="w-full bg-transparent py-2 text-sm outline-none"
              placeholder="Search bill no., customer, phone…"
              value={salesQ}
              onChange={(e) => setSalesQ(e.target.value)}
            />
          </div>
        </div>
        <div className="max-h-[480px] space-y-2 overflow-y-auto">
          {filteredSales.map((sale) => (
            <div key={sale._id} className="rounded-lg border border-line/40 bg-navy/40 px-3 py-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gold">{sale.billNumber}</p>
                  <p className="text-xs text-cream/50">
                    {formatDate(sale.createdAt)} · {sale.paymentMethod} · {sale.status}
                  </p>
                  {sale.customerSnapshot?.name && (
                    <p className="text-xs text-cream/60">
                      {sale.customerSnapshot.name}
                      {sale.customerSnapshot.phone ? ` · ${sale.customerSnapshot.phone}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{currency(sale.totalAmount)}</span>
                  <Button variant="ghost" className="!min-h-8 !px-2 !text-xs text-danger" onClick={() => setDeleteTarget(sale)}>
                    Delete
                  </Button>
                </div>
              </div>
              <ul className="mt-2 space-y-0.5 text-xs text-cream/60">
                {sale.items.map((line, i) => (
                  <li key={i}>
                    {line.description || "Item"} × {line.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!filteredSales.length && <p className="text-cream/50">No sales recorded yet.</p>}
        </div>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete sale?"
        message={
          deleteTarget
            ? `Remove ${deleteTarget.billNumber}? Product quantities will be added back to inventory.`
            : ""
        }
        onConfirm={confirmDeleteSale}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
