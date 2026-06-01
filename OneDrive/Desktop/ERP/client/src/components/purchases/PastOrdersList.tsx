import { ChevronDown, Download, FileSpreadsheet, Pencil, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import { OrderLineValues } from "../../data/productFields";
import { formatSavedOrderItem, savedItemToOrderLine } from "../../utils/orderListExport";
import { formatDate } from "../../utils/format";
import { Button } from "../ui";

type SavedOrder = {
  _id: string;
  orderNumber: string;
  status: string;
  totalEstimatedCost?: number;
  createdAt?: string;
  items?: Array<{ category: string; quantity: number; data?: Record<string, unknown> }>;
};

type Props = {
  orders: SavedOrder[];
  canManage: boolean;
  onEdit: (order: SavedOrder) => void;
  onDelete: (id: string, orderNumber: string) => void;
  onPdf: (lines: OrderLineValues[], orderNumber: string) => void;
  onDoc: (lines: OrderLineValues[], orderNumber: string) => void;
};

export function PastOrdersList({ orders, canManage, onEdit, onDelete, onPdf, onDoc }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!orders.length) {
    return <p className="py-8 text-center text-sm text-muted">No saved purchase lists yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-2/80 text-left text-[10px] font-bold uppercase tracking-wider text-muted">
            <th className="px-4 py-2.5">Order</th>
            <th className="hidden px-3 py-2.5 sm:table-cell">Date</th>
            <th className="px-3 py-2.5">Items</th>
            <th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const expanded = openId === o._id;
            const lines = (o.items || []).map(savedItemToOrderLine);
            return (
              <Fragment key={o._id}>
                <tr className="border-b border-line/50 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      className="flex items-center gap-1 font-mono text-sm font-semibold text-brand"
                      onClick={() => setOpenId(expanded ? null : o._id)}
                    >
                      <ChevronDown size={14} className={`transition ${expanded ? "rotate-180" : ""}`} />
                      {o.orderNumber}
                    </button>
                  </td>
                  <td className="hidden px-3 py-2.5 text-muted sm:table-cell">{o.createdAt ? formatDate(o.createdAt) : "—"}</td>
                  <td className="px-3 py-2.5">{o.items?.length ?? 0}</td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand">{o.status}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="!min-h-8 !px-2" onClick={() => onPdf(lines, o.orderNumber)} title="PDF">
                        <Download size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" className="!min-h-8 !px-2" onClick={() => onDoc(lines, o.orderNumber)} title="Word">
                        <FileSpreadsheet size={14} />
                      </Button>
                      {canManage && (
                        <>
                          <Button variant="ghost" size="sm" className="!min-h-8 !px-2" onClick={() => onEdit(o)}>
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" className="!min-h-8 !px-2 !text-danger" onClick={() => onDelete(o._id, o.orderNumber)}>
                            <Trash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {expanded && o.items?.length ? (
                  <tr className="bg-surface-2/30">
                    <td colSpan={5} className="px-4 py-2">
                      <ul className="space-y-1 text-xs text-muted">
                        {o.items.map((item, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="w-5 shrink-0 text-muted">{idx + 1}.</span>
                            <span>
                              <span className="text-cream/80">{item.category}</span> — {formatSavedOrderItem(item)} · qty {item.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
