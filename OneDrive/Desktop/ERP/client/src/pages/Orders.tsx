import { ClipboardList, Download, FileSpreadsheet, Plus, Save, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { CategoryFields } from "../components/CategoryFields";
import { Button, Card, Field, SectionHeader, inputClass } from "../components/ui";
import { SHOP_DISPLAY_NAME } from "../constants/branding";
import { PRODUCT_CATEGORIES } from "../data/categories";
import {
  FieldKey,
  OrderLineValues,
  emptyOrderLine,
  formValuesForFields,
  getOrderFieldDefs,
  orderLineDisplayLabel,
  orderLineFromProduct,
  orderLineToPayload,
  validateOrderLine
} from "../data/productFields";
import { Product } from "../types/product";
import { ShopHeader } from "../utils/exporters";
import { currency, productLabel } from "../utils/format";
import { downloadOrderListDoc, downloadOrderListPdf, formatSavedOrderItem, savedItemToOrderLine } from "../utils/orderListExport";

type SavedOrder = {
  _id: string;
  orderNumber: string;
  status: string;
  totalEstimatedCost?: number;
  createdAt?: string;
  items?: Array<{ category: string; quantity: number; data?: Record<string, unknown> }>;
};

const defaultShop: ShopHeader = { shopName: SHOP_DISPLAY_NAME, address: "", phone: "" };

export function Orders() {
  const [items, setItems] = useState<Product[]>([]);
  const [invSearch, setInvSearch] = useState("");
  const [orderItems, setOrderItems] = useState<OrderLineValues[]>([]);
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{ product: string; suggestedQuantity: number }>>([]);
  const [shop, setShop] = useState<ShopHeader>(defaultShop);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const [orderRes, suggestionRes, settingsRes] = await Promise.all([
      api.get("/orders"),
      api.get("/orders/reorder-suggestions"),
      api.get("/settings").catch(() => ({ data: { settings: {} } }))
    ]);
    setOrders(orderRes.data.orders);
    setSuggestions(suggestionRes.data.suggestions);
    const s = settingsRes.data.settings;
    setShop({
      shopName: s.shopName?.trim() || SHOP_DISPLAY_NAME,
      address: s.address || "",
      phone: s.phone || ""
    });
  }

  async function searchInventory(term: string) {
    const { data } = await api.get("/inventory", { params: { q: term || undefined, limit: 50 } });
    setItems(data.items);
  }

  useEffect(() => {
    load();
    searchInventory("");
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => searchInventory(invSearch), 300);
    return () => window.clearTimeout(t);
  }, [invSearch]);

  function pick(item: Product) {
    setOrderItems((old) => [...old, orderLineFromProduct(item)]);
    toast.success("Added to order list");
  }

  function addManualLine() {
    setOrderItems((old) => [...old, emptyOrderLine("Wall Clocks")]);
  }

  function updateLine(index: number, key: FieldKey, value: string | number) {
    setOrderItems((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row };
        if (key === "quantity") next.quantity = Number(value);
        else if (key === "purchasePrice") next.purchasePrice = Number(value);
        else (next as Record<string, string | number>)[key] = value;
        return next;
      })
    );
  }

  function changeLineCategory(index: number, category: OrderLineValues["category"]) {
    setOrderItems((rows) => rows.map((row, i) => (i === index ? emptyOrderLine(category) : row)));
  }

  function removeLine(index: number) {
    setOrderItems((rows) => rows.filter((_, i) => i !== index));
  }

  function downloadPdf(lines: OrderLineValues[], orderNumber?: string) {
    if (!lines.length) return toast.error("Add items to the order list first");
    downloadOrderListPdf(lines, shop, orderNumber);
    toast.success("PDF downloaded");
  }

  function downloadDoc(lines: OrderLineValues[], orderNumber?: string) {
    if (!lines.length) return toast.error("Add items to the order list first");
    downloadOrderListDoc(lines, shop, orderNumber);
    toast.success("Document downloaded");
  }

  function startEdit(order: SavedOrder) {
    const lines = (order.items || []).map(savedItemToOrderLine);
    if (!lines.length) return toast.error("This order has no items to edit");
    setOrderItems(lines);
    setEditingId(order._id);
    toast.success(`Editing ${order.orderNumber}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setOrderItems([]);
  }

  async function save() {
    for (let i = 0; i < orderItems.length; i++) {
      const err = validateOrderLine(orderItems[i]);
      if (err) return toast.error(`Line ${i + 1}: ${err}`);
    }
    if (!orderItems.length) return toast.error("Add at least one item");
    setSaving(true);
    try {
      const payload = { items: orderItems.map(orderLineToPayload) };
      if (editingId) {
        const { data } = await api.put(`/orders/${editingId}`, payload);
        toast.success(`Order updated: ${data.order.orderNumber}`);
        downloadPdf(orderItems, data.order.orderNumber);
        setEditingId(null);
      } else {
        const { data } = await api.post("/orders", payload);
        toast.success(`Order list saved: ${data.order.orderNumber}`);
        downloadPdf(orderItems, data.order.orderNumber);
      }
      setOrderItems([]);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeOrder(id: string, orderNumber: string) {
    if (!window.confirm(`Delete order list ${orderNumber}?`)) return;
    try {
      await api.delete(`/orders/${id}`);
      toast.success("Order list deleted");
      if (editingId === id) cancelEdit();
      load();
    } catch {
      toast.error("Delete failed");
    }
  }

  const grandTotal = orderItems.reduce((s, i) => s + i.quantity * i.purchasePrice, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Procurement"
        title="Order List Manager"
        action={
          <Button onClick={addManualLine}>
            <Plus size={16} /> Add line manually
          </Button>
        }
      />

      {editingId && (
        <div className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm text-gold">
          Editing a saved order — change lines below, then Save.{" "}
          <button type="button" className="underline" onClick={cancelEdit}>
            Cancel edit
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Add from Inventory</h2>
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-line/50 bg-navy/40 px-3">
            <Search size={16} className="text-cream/50" />
            <input
              className="w-full bg-transparent py-2 text-sm outline-none"
              placeholder="Search products (brand, model, colour…)"
              value={invSearch}
              onChange={(e) => setInvSearch(e.target.value)}
            />
          </div>
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {items.map((item) => (
              <li key={item._id} className="flex items-center justify-between rounded-lg border border-line/40 px-3 py-2 text-sm">
                <span>
                  <span className="text-xs text-cream/50">{item.category}</span>
                  <br />
                  {productLabel(item)}
                </span>
                <Button variant="ghost" className="!min-h-8 !px-2" onClick={() => pick(item)}>
                  <Plus size={14} />
                </Button>
              </li>
            ))}
            {!items.length && <p className="text-sm text-cream/50">No products match your search.</p>}
          </ul>
          {suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase text-gold">Low stock suggestions</p>
              <ul className="mt-2 space-y-1 text-sm text-cream/70">
                {suggestions.slice(0, 5).map((s) => (
                  <li key={s.product}>
                    {s.product} — order {s.suggestedQuantity} units
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card>
          <p className="mb-4 text-sm text-cream/60">
            PDF / Word export uses <strong>{SHOP_DISPLAY_NAME}</strong> from Settings (no supplier on the document).
          </p>
          <div className="mb-4 rounded-lg border border-line/50 bg-navy/40 px-3 py-2 text-sm">
            <p className="font-medium text-gold">{shop.shopName}</p>
            {shop.address && <p className="text-cream/70">{shop.address}</p>}
            {shop.phone && <p className="text-cream/50">{shop.phone}</p>}
          </div>

          <div className="space-y-4">
            {orderItems.length === 0 && (
              <p className="text-sm text-cream/50">Search inventory and add items, or add a line manually.</p>
            )}
            {orderItems.map((line, i) => (
              <div key={i} className="rounded-lg border border-line/50 bg-navy/40 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gold">{orderLineDisplayLabel(line) || `Line ${i + 1}`}</p>
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="rounded p-1 text-danger hover:bg-danger/10"
                    title="Remove line"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="Category">
                    <select
                      className={inputClass}
                      value={line.category}
                      onChange={(e) => changeLineCategory(i, e.target.value as OrderLineValues["category"])}
                    >
                      {PRODUCT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <CategoryFields
                    fields={getOrderFieldDefs(line.category)}
                    values={formValuesForFields(line)}
                    onChange={(key, value) => updateLine(i, key, value)}
                  />
                </div>
              </div>
            ))}
          </div>

          {orderItems.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button className="w-full" variant="ghost" onClick={() => downloadPdf(orderItems)}>
                <Download size={16} /> Download PDF
              </Button>
              <Button className="w-full" variant="ghost" onClick={() => downloadDoc(orderItems)}>
                <FileSpreadsheet size={16} /> Download Word (.doc)
              </Button>
            </div>
          )}

          {grandTotal > 0 && <p className="mt-4 text-sm text-cream/60">Estimated total (internal): {currency(grandTotal)}</p>}

          <Button className="mt-4 w-full" onClick={save} disabled={!orderItems.length || saving}>
            <Save size={16} /> {saving ? "Saving…" : editingId ? "Update order list" : "Save & download PDF"}
          </Button>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <ClipboardList size={18} /> Past Order Lists
        </h2>
        <div className="space-y-3">
          {orders.map((o) => {
            const lines = (o.items || []).map(savedItemToOrderLine);
            return (
              <div key={o._id} className="rounded-lg border border-line/40 px-3 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{o.orderNumber}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold">{o.status}</span>
                    <Button variant="ghost" className="!min-h-8 !px-2 !text-xs" onClick={() => startEdit(o)}>
                      Edit
                    </Button>
                    <Button variant="ghost" className="!min-h-8 !px-2 !text-xs text-danger" onClick={() => removeOrder(o._id, o.orderNumber)}>
                      Delete
                    </Button>
                    <Button variant="ghost" className="!min-h-8 !px-2 !text-xs" onClick={() => downloadPdf(lines, o.orderNumber)}>
                      <Download size={14} /> PDF
                    </Button>
                    <Button variant="ghost" className="!min-h-8 !px-2 !text-xs" onClick={() => downloadDoc(lines, o.orderNumber)}>
                      <FileSpreadsheet size={14} /> DOC
                    </Button>
                  </div>
                </div>
                {o.items?.length ? (
                  <ul className="mt-2 space-y-1 text-xs text-cream/60">
                    {o.items.map((item, idx) => (
                      <li key={idx}>
                        {item.category}: {formatSavedOrderItem(item)} — qty {item.quantity}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
          {!orders.length && <p className="text-cream/50">No saved order lists yet.</p>}
        </div>
      </Card>
    </div>
  );
}
