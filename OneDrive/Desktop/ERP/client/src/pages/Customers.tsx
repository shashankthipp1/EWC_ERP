import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button, Card, SectionHeader } from "../components/ui";
import { currency } from "../utils/format";

type Customer = {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  segment?: string;
  purchaseCount?: number;
  repairCount?: number;
  loyaltyPoints?: number;
  pendingAmount?: number;
};

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => api.get("/customers", { params: { q } }).then((res) => setCustomers(res.data.customers));

  useEffect(() => {
    load();
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/customers/${deleteTarget._id}`);
      toast.success("Customer deleted");
      setDeleteTarget(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Delete failed — remove linked sales and repairs first");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="CRM" title="Customer Management" subtitle={`${customers.length} customers`} />
      <Card>
        <div className="mb-4 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-line bg-ink px-3">
            <Search size={16} />
            <input
              className="w-full bg-transparent py-2 text-sm outline-none"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or phone"
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>
          <Button onClick={load}>Search</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((c) => (
            <div key={c._id} className="rounded-lg border border-line bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-slate-400">{c.phone}</p>
                </div>
                <span className="rounded-full bg-brand/10 px-2 py-1 text-xs text-brand">{c.segment || "New"}</span>
              </div>
              {c.address && <p className="mt-2 text-sm">{c.address}</p>}
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-400">
                <span>Sales: {c.purchaseCount || 0}</span>
                <span>Repairs: {c.repairCount || 0}</span>
                <span>Points: {c.loyaltyPoints || 0}</span>
              </div>
              <p className="mt-3 text-sm text-brand">Pending: {currency(c.pendingAmount || 0)}</p>
              <Button
                variant="ghost"
                className="mt-3 !min-h-8 !px-2 !text-xs text-danger"
                onClick={() => setDeleteTarget(c)}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
        {!customers.length && <p className="text-cream/50">No customers yet. They are added when you record a sale or repair.</p>}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete customer?"
        message={
          deleteTarget
            ? `Remove ${deleteTarget.name}? ${
                (deleteTarget.purchaseCount || 0) + (deleteTarget.repairCount || 0) > 0
                  ? "Delete their sales and repairs first."
                  : "This cannot be undone."
              }`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
