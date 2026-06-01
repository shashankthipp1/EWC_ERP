import { ChevronDown, Download, FileSpreadsheet, Plus, Save, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { OrderLineTable } from "../components/purchases/OrderLineTable";
import { PastOrdersList } from "../components/purchases/PastOrdersList";
import { PurchaseCharts } from "../components/purchases/PurchaseCharts";
import { Button, Card, PageShell, compactInputClass } from "../components/ui";
import { SHOP_DISPLAY_NAME } from "../constants/branding";
import { usePermissions } from "../hooks/usePermissions";
import { useProductColors } from "../hooks/useProductColors";
import {
  FieldKey,
  OrderLineValues,
  emptyOrderLine,
  orderLineFromProduct,
  orderLineToPayload,
  validateOrderLine
} from "../data/productFields";
import { Product } from "../types/product";
import { ShopHeader } from "../utils/exporters";
import { currency, productLabel } from "../utils/format";
import { downloadOrderListDoc, downloadOrderListPdf, savedItemToOrderLine } from "../utils/orderListExport";

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
  const { canManageOrders, canViewCost } = usePermissions();
  const { colors } = useProductColors();
  const [items, setItems] = useState<Product[]>([]);
  const [invSearch, setInvSearch] = useState("");
  const [showInventory, setShowInventory] = useState(false);
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
    const { data } = await api.get("/inventory", { params: { q: term || undefined, limit: 30 } });
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
    toast.success("Added");
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
    if (!lines.length) return toast.error("Add items first");
    downloadOrderListPdf(lines, shop, orderNumber);
    toast.success("PDF downloaded");
  }

  function downloadDoc(lines: OrderLineValues[], orderNumber?: string) {
    if (!lines.length) return toast.error("Add items first");
    downloadOrderListDoc(lines, shop, orderNumber);
    toast.success("Document downloaded");
  }

  function startEdit(order: SavedOrder) {
    const lines = (order.items || []).map(savedItemToOrderLine);
    if (!lines.length) return toast.error("This order has no items");
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
    if (!orderItems.length) return toast.error("Add at least one line");
    setSaving(true);
    try {
      const payload = { items: orderItems.map(orderLineToPayload) };
      if (editingId) {
        const { data } = await api.put(`/orders/${editingId}`, payload);
        toast.success(`Updated ${data.order.orderNumber}`);
        downloadPdf(orderItems, data.order.orderNumber);
        setEditingId(null);
      } else {
        const { data } = await api.post("/orders", payload);
        toast.success(`Saved ${data.order.orderNumber}`);
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
    if (!window.confirm(`Delete ${orderNumber}?`)) return;
    try {
      await api.delete(`/orders/${id}`);
      toast.success("Deleted");
      if (editingId === id) cancelEdit();
      load();
    } catch {
      toast.error("Delete failed");
    }
  }

  const grandTotal = useMemo(
    () => (canViewCost ? orderItems.reduce((s, i) => s + i.quantity * i.purchasePrice, 0) : 0),
    [orderItems, canViewCost]
  );

  return (
    <PageShell className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Purchases</h1>
          <p className="mt-1 text-sm text-muted">Build a clean order list line by line — charts update as you type.</p>
        </div>
        {canManageOrders && (
          <Button onClick={addManualLine} size="sm">
            <Plus size={16} /> New line
          </Button>
        )}
      </div>

      {editingId && (
        <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-sm">
          <span>Editing saved list</span>
          <button type="button" className="font-semibold text-brand underline" onClick={cancelEdit}>
            Cancel
          </button>
        </div>
      )}

      <PurchaseCharts
        lines={orderItems}
        savedOrders={orders}
        suggestions={suggestions}
        showCost={canViewCost}
        grandTotal={grandTotal}
      />

      <Card className="!p-4 sm:!p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Order lines</h2>
          <p className="text-xs text-muted">{shop.shopName}</p>
        </div>

        <OrderLineTable
          lines={orderItems}
          colorOptions={colors}
          canEdit={canManageOrders}
          onAddLine={addManualLine}
          onUpdate={updateLine}
          onCategoryChange={changeLineCategory}
          onRemove={removeLine}
        />

        {canManageOrders && (
          <details className="mt-4 group">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted hover:text-brand">
              <ChevronDown size={16} className="transition group-open:rotate-180" />
              Add from inventory search
            </summary>
            <div className="mt-3 rounded-xl border border-line bg-surface-2/40 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Search size={16} className="text-muted" />
                <input
                  className={`${compactInputClass} flex-1`}
                  placeholder="Search brand, model…"
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  onFocus={() => setShowInventory(true)}
                />
              </div>
              {(showInventory || invSearch) && (
                <ul className="max-h-40 space-y-1 overflow-y-auto">
                  {items.map((item) => (
                    <li key={item._id}>
                      <button
                        type="button"
                        onClick={() => pick(item)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-brand/10"
                      >
                        <span className="truncate">
                          <span className="text-[10px] text-muted">{item.category}</span>
                          <br />
                          {productLabel(item)}
                        </span>
                        <Plus size={14} className="shrink-0 text-brand" />
                      </button>
                    </li>
                  ))}
                  {!items.length && <p className="py-2 text-center text-xs text-muted">No matches</p>}
                </ul>
              )}
              {suggestions.length > 0 && (
                <div className="mt-3 border-t border-line pt-2">
                  <p className="text-[10px] font-bold uppercase text-warning">Low stock — tap to add</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {suggestions.slice(0, 6).map((s) => (
                      <span key={s.product} className="rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">
                        {s.product} ×{s.suggestedQuantity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        )}

        {orderItems.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            {canViewCost && grandTotal > 0 && (
              <span className="mr-auto text-sm text-muted">
                Est. cost: <strong className="text-cream">{currency(grandTotal)}</strong>
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={() => downloadPdf(orderItems)}>
              <Download size={14} /> PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={() => downloadDoc(orderItems)}>
              <FileSpreadsheet size={14} /> Word
            </Button>
            {canManageOrders && (
              <Button size="sm" onClick={save} disabled={saving}>
                <Save size={14} /> {saving ? "Saving…" : editingId ? "Update" : "Save"}
              </Button>
            )}
          </div>
        )}
      </Card>

      <Card className="!p-4 sm:!p-5">
        <h2 className="mb-3 text-base font-semibold">Saved purchase lists</h2>
        <PastOrdersList
          orders={orders}
          canManage={canManageOrders}
          onEdit={startEdit}
          onDelete={removeOrder}
          onPdf={downloadPdf}
          onDoc={downloadDoc}
        />
      </Card>
    </PageShell>
  );
}
