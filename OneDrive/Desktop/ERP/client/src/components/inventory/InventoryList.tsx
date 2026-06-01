import { Pencil, Trash2 } from "lucide-react";
import { StockBadge } from "../ewc/StockBadge";
import { Product } from "../../types/product";
import { currency, productLabel } from "../../utils/format";
import { compactInputClass } from "../ui";

type Props = {
  items: Product[];
  canViewCost: boolean;
  canManage: boolean;
  onEdit: (item: Product) => void;
  onDelete: (item: Product) => void;
  onStockChange: (id: string, qty: number) => void;
};

export function InventoryList({ items, canViewCost, canManage, onEdit, onDelete, onStockChange }: Props) {
  if (!items.length) {
    return <p className="py-12 text-center text-muted">No products found. Try another search or filter.</p>;
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-line md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2/80 text-left text-[10px] font-bold uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Product name</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3 w-20">Qty</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Selling price</th>
              {canViewCost && <th className="px-3 py-3">Cost</th>}
              {canViewCost && <th className="px-3 py-3">Profit/unit</th>}
              {canManage && <th className="px-3 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              const profit = (r.sellingPrice ?? 0) - (r.purchasePrice ?? 0);
              return (
                <tr key={r._id} className="border-b border-line/50 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium">{productLabel(r)}</td>
                  <td className="px-3 py-3 text-muted">{r.category}</td>
                  <td className="px-3 py-3">
                    {canManage ? (
                      <input
                        type="number"
                        min={0}
                        className={`${compactInputClass} w-16 text-center`}
                        defaultValue={r.currentStock}
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isNaN(n) && n !== r.currentStock) onStockChange(r._id, n);
                        }}
                      />
                    ) : (
                      <span className="font-semibold">{r.currentStock}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <StockBadge current={r.currentStock} minimum={r.minimumStock} />
                  </td>
                  <td className="px-3 py-3 font-semibold text-brand">{currency(r.sellingPrice)}</td>
                  {canViewCost && <td className="px-3 py-3 text-muted">{currency(r.purchasePrice ?? 0)}</td>}
                  {canViewCost && (
                    <td className={`px-3 py-3 font-medium ${profit >= 0 ? "text-success" : "text-danger"}`}>
                      {currency(profit)}
                    </td>
                  )}
                  {canManage && (
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => onEdit(r)} className="grid h-9 w-9 place-items-center rounded-lg text-brand hover:bg-brand/10" aria-label="Edit">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => onDelete(r)} className="grid h-9 w-9 place-items-center rounded-lg text-danger hover:bg-danger/10" aria-label="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {items.map((r) => {
          const profit = (r.sellingPrice ?? 0) - (r.purchasePrice ?? 0);
          return (
            <li key={r._id} className="rounded-xl border border-line bg-surface-2/50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{productLabel(r)}</p>
                  <p className="mt-0.5 text-xs text-muted">{r.category}</p>
                </div>
                <StockBadge current={r.currentStock} minimum={r.minimumStock} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span>
                  Qty: <strong>{r.currentStock}</strong>
                </span>
                <span className="font-bold text-brand">{currency(r.sellingPrice)}</span>
                {canViewCost && <span className="text-muted">Cost {currency(r.purchasePrice ?? 0)}</span>}
                {canViewCost && <span className={profit >= 0 ? "text-success" : "text-danger"}>Profit {currency(profit)}</span>}
              </div>
              {canManage && (
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => onEdit(r)} className="flex-1 rounded-lg border border-line py-2 text-sm font-semibold text-brand">
                    Edit
                  </button>
                  <button type="button" onClick={() => onDelete(r)} className="flex-1 rounded-lg border border-danger/30 py-2 text-sm font-semibold text-danger">
                    Delete
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
