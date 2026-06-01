import { AlertTriangle, Boxes, Download, FileSpreadsheet, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { CategoryFields } from "../components/CategoryFields";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { InventoryList } from "../components/inventory/InventoryList";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button, Card, Field, MetricCard, SectionHeader, inputClass } from "../components/ui";
import { APP_NAME } from "../constants/branding";
import { ACTIVE_PRODUCT_CATEGORIES, PRODUCT_CATEGORIES, WALL_CLOCK_CATEGORY } from "../data/categories";
import { usePermissions } from "../hooks/usePermissions";
import { useProductColors } from "../hooks/useProductColors";
import {
  FieldKey,
  ProductFormValues,
  emptyProduct,
  formValuesForFields,
  getInventoryFieldDefs,
  mergeCategoryChange,
  productDisplayLabel,
  productFromInventory,
  toInventoryPayload,
  validateInventoryForm
} from "../data/productFields";
import { Product } from "../types/product";
import { currency, formatDate, productLabel } from "../utils/format";
import { exportRowsToExcel, exportRowsToPdf } from "../utils/exporters";

const defaultShop = { shopName: APP_NAME, address: "", phone: "" };

export function Inventory({ embedded = false }: { embedded?: boolean }) {
  const { canViewCost, canManageInventory } = usePermissions();
  const { colors, addColor } = useProductColors();
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormValues>(emptyProduct("Wall Clocks"));
  const [bulkId, setBulkId] = useState("");
  const [bulkQty, setBulkQty] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [shop, setShop] = useState(defaultShop);
  const [filter, setFilter] = useState({
    q: "",
    category: "",
    brand: "",
    modelNumber: "",
    colorVariant: "",
    lowStock: false,
    sortBy: "updatedAt",
    sortOrder: "desc"
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/inventory", {
        params: { ...filter, page, limit: 15, lowStock: filter.lowStock ? "true" : undefined }
      });
      setItems(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get("/settings").then((res) => {
      const s = res.data.settings;
      setShop({ shopName: s.shopName, address: s.address, phone: s.phone });
    }).catch(() => undefined);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyProduct("Wall Clocks"));
    setShowForm(true);
  }

  async function openEdit(item: Product) {
    setShowForm(true);
    setEditing(item);
    try {
      const { data } = await api.get(`/inventory/${item._id}`);
      const full = data.item as Product;
      setEditing(full);
      setForm({
        ...productFromInventory(full),
        currentStock: Number(full.currentStock) || 0,
        purchasePrice: Number(full.purchasePrice) || 0,
        sellingPrice: Number(full.sellingPrice) || 0,
        mrp: Number(full.mrp) || Number(full.sellingPrice) || 0,
        minimumStock: Number(full.minimumStock) || 5
      });
    } catch {
      setForm({
        ...productFromInventory(item),
        currentStock: Number(item.currentStock) || 0,
        purchasePrice: Number(item.purchasePrice) || 0,
        sellingPrice: Number(item.sellingPrice) || 0,
        mrp: Number(item.mrp) || Number(item.sellingPrice) || 0,
        minimumStock: Number(item.minimumStock) || 5
      });
    }
  }

  async function saveStock(id: string, qty: number) {
    if (qty < 0 || Number.isNaN(qty)) return toast.error("Enter a valid quantity");
    try {
      await api.patch(`/inventory/${id}/stock`, { currentStock: qty });
      toast.success("Stock updated");
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Stock update failed");
    }
  }

  function updateField(key: FieldKey, value: string | number) {
    setForm((prev) => {
      const next = { ...prev };
      if (key === "currentStock" || key === "minimumStock" || key === "purchasePrice" || key === "sellingPrice" || key === "mrp") {
        next[key] = Number(value);
      } else {
        (next as Record<string, string | number>)[key] = value;
      }
      return next;
    });
  }

  function changeCategory(next: Product["category"]) {
    setForm((prev) => (editing ? mergeCategoryChange(prev, next) : emptyProduct(next)));
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateInventoryForm(form, canViewCost);
    if (validationError) return toast.error(validationError);
    setSaving(true);
    try {
      const payload = toInventoryPayload(form);
      if (editing) {
        await api.put(`/inventory/${editing._id}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/inventory", payload);
        toast.success("Product added");
      }
      setShowForm(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/inventory/${deleteTarget._id}`);
      toast.success("Product deleted");
      setDeleteTarget(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  async function bulkStock() {
    if (!bulkId || bulkQty <= 0) return toast.error("Select product and quantity");
    try {
      await api.patch("/inventory/bulk-stock", { updates: [{ id: bulkId, addQuantity: bulkQty }] });
      toast.success("Stock updated");
      setBulkId("");
      setBulkQty(1);
      load();
    } catch {
      toast.error("Bulk update failed");
    }
  }

  function exportData(type: "excel" | "pdf") {
    const rows = items.map((i) => ({
      "Product ID": i.productId,
      Category: i.category,
      Product: productLabel(i),
      Stock: i.currentStock,
      "Purchase ₹": i.purchasePrice,
      Added: formatDate(i.createdAt)
    }));
    if (type === "excel") exportRowsToExcel("our-watch-shop-inventory", rows);
    else exportRowsToPdf("our-watch-shop-inventory", "Inventory Report", rows, shop);
    toast.success(`Exported as ${type.toUpperCase()}`);
  }

  const outOfStockCount = items.filter((i) => i.currentStock <= 0).length;
  const inventoryValue = canViewCost
    ? items.reduce((s, i) => s + (i.purchasePrice ?? 0) * i.currentStock, 0)
    : 0;
  const lowStockCount = items.filter((i) => i.currentStock > 0 && i.currentStock <= i.minimumStock).length;
  const inventoryFields = getInventoryFieldDefs(form.category, colors).filter((f) => !f.adminOnly || canViewCost);

  return (
    <div className="space-y-5 sm:space-y-6">
      {!embedded && (
        <SectionHeader
          eyebrow="Stock"
          title="Inventory"
          subtitle={canManageInventory ? "Add, edit, and track all products" : "View stock and selling prices"}
          action={
            <div className="flex flex-wrap gap-2">
              {canManageInventory && (
                <>
                  <Button variant="ghost" onClick={() => exportData("excel")}>
                    <FileSpreadsheet size={16} /> Excel
                  </Button>
                  <Button variant="ghost" onClick={() => exportData("pdf")}>
                    <Download size={16} /> PDF
                  </Button>
                  <Button onClick={openCreate}>
                    <Plus size={16} /> Add Product
                  </Button>
                </>
              )}
            </div>
          }
        />
      )}
      {embedded && canManageInventory && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => exportData("excel")}>
            <FileSpreadsheet size={16} /> Excel
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} /> Add product
          </Button>
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <MetricCard label="Products" value={total} detail="In list" icon={Boxes} />
        <MetricCard label="Low stock" value={lowStockCount} detail="🟠 Need reorder" icon={AlertTriangle} tone="gold" />
        <MetricCard label="Out of stock" value={outOfStockCount} detail="🔴 Cannot sell" icon={AlertTriangle} tone="danger" />
        {canViewCost && (
          <MetricCard label="Page value" value={currency(inventoryValue)} detail="Cost on this page" icon={Boxes} tone="brand" />
        )}
      </div>

      {showForm && canManageInventory && (
        <Card>
          <h2 className="mb-1 text-lg font-semibold">{editing ? "Edit product" : "Add product"}</h2>
          <p className="mb-4 text-sm text-cream/60">
            {editing
              ? `Editing ${editing.productId} — change any field including category, prices, and stock.`
              : productDisplayLabel(form) || "Fields change based on category"}
          </p>
          <form onSubmit={saveProduct} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editing && (
              <Field label="Product ID">
                <input className={inputClass} value={editing.productId} readOnly disabled />
              </Field>
            )}
            <Field label="Category">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => changeCategory(e.target.value as Product["category"])}
              >
                {[...new Set([...PRODUCT_CATEGORIES, form.category])].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <CategoryFields
              fields={inventoryFields}
              values={formValuesForFields(form)}
              onChange={updateField}
              quantity={form.currentStock}
              colorOptions={colors}
              canAddColors={canManageInventory}
              onAddColor={async (c) => {
                await addColor(c);
                toast.success("Color added to palette");
              }}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end md:col-span-2 lg:col-span-3">
              <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                {saving ? "Saving…" : editing ? "Update" : "Add to inventory"}
              </Button>
              <Button type="button" className="w-full sm:w-auto" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {canManageInventory && (
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <SlidersHorizontal size={20} className="text-brand" /> Bulk Stock Update
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_auto]">
          <select className={inputClass} value={bulkId} onChange={(e) => setBulkId(e.target.value)}>
            <option value="">Select product to restock</option>
            {items.map((i) => (
              <option key={i._id} value={i._id}>
                {i.productId} — {productLabel(i)} ({i.currentStock} in stock)
              </option>
            ))}
          </select>
          <input className={inputClass} type="number" min={1} value={bulkQty} onChange={(e) => setBulkQty(Number(e.target.value))} />
          <Button className="w-full sm:w-auto" onClick={bulkStock}>Add Stock</Button>
        </div>
      </Card>
      )}

      <Card>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-navy/60 px-3 sm:col-span-2 lg:col-span-2">
            <Search size={16} className="text-cream/50" />
            <input
              className="w-full bg-transparent py-2.5 text-sm outline-none"
              placeholder="Search brand, model, ID…"
              value={filter.q}
              onChange={(e) => setFilter({ ...filter, q: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
            />
          </div>
          <select className={inputClass} value={filter.category} onChange={(e) => { setFilter({ ...filter, category: e.target.value }); setPage(1); }}>
            <option value="">All categories</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input className={inputClass} placeholder="Brand" value={filter.brand} onChange={(e) => setFilter({ ...filter, brand: e.target.value })} />
          <input className={inputClass} placeholder="Model" value={filter.modelNumber} onChange={(e) => setFilter({ ...filter, modelNumber: e.target.value })} />
          <input className={inputClass} placeholder="Color" value={filter.colorVariant} onChange={(e) => setFilter({ ...filter, colorVariant: e.target.value })} />
          <div className="flex flex-col gap-2 sm:flex-row sm:col-span-2 lg:col-span-2">
            <select className={inputClass} value={filter.sortBy} onChange={(e) => setFilter({ ...filter, sortBy: e.target.value })}>
              <option value="currentStock">Sort: Stock</option>
              {canViewCost && <option value="purchasePrice">Sort: Cost</option>}
              <option value="category">Sort: Category</option>
              <option value="brand">Sort: Brand</option>
            </select>
            <Button className="w-full sm:w-auto" variant="secondary" onClick={() => { setPage(1); load(); }}>Apply filters</Button>
          </div>
        </div>
        <label className="mb-4 flex items-center gap-2 text-sm text-cream/70">
          <input type="checkbox" checked={filter.lowStock} onChange={(e) => { setFilter({ ...filter, lowStock: e.target.checked }); setPage(1); }} />
          Show low stock only
        </label>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <InventoryList
              items={items}
              canViewCost={canViewCost}
              canManage={canManageInventory}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onStockChange={saveStock}
            />
            {pages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted">
                  Page {page} of {pages}
                </span>
                <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete product?"
        message={`Remove ${deleteTarget?.productId} — ${deleteTarget ? productLabel(deleteTarget) : ""}? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={saving}
      />
    </div>
  );
}
