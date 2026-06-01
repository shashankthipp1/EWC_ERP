import { Building2, Plus } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/http";
import { Button, Card, EmptyState, Field, inputClass, Skeleton } from "../../components/ui";

type Supplier = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
};

export function SuppliersPanel() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/orders/suppliers");
      setSuppliers(data.suppliers);
    } catch {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Supplier name required");
    try {
      await api.post("/orders/suppliers", form);
      toast.success("Supplier saved");
      setForm({ name: "", phone: "", email: "", address: "" });
      load();
    } catch {
      toast.error("Could not save supplier");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <h3 className="mb-4 font-display text-lg font-semibold">Add vendor</h3>
        <form className="space-y-3" onSubmit={save}>
          <Field label="Company name">
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Address">
            <textarea className={inputClass} rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Button type="submit" className="w-full">
            <Plus size={16} /> Save supplier
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 font-display text-lg font-semibold">Vendor directory ({suppliers.length})</h3>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : suppliers.length === 0 ? (
          <EmptyState icon={Building2} title="No suppliers yet" description="Add vendors to link purchase orders and replenishment." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {suppliers.map((s) => (
              <article key={s._id} className="rounded-xl border border-line bg-surface-2/60 p-4 transition hover:border-brand/25">
                <p className="font-semibold text-cream">{s.name}</p>
                {s.phone && <p className="mt-1 text-sm text-muted">{s.phone}</p>}
                {s.email && <p className="text-xs text-muted">{s.email}</p>}
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
