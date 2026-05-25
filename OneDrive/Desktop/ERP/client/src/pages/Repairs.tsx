import { Bell, Printer, Search, Wrench } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button, Card, Field, SectionHeader, inputClass } from "../components/ui";
import { compactDate, currency } from "../utils/format";

const statuses = ["Pending", "Diagnosing", "In Progress", "Waiting Parts", "Completed", "Delivered"];
const devices = ["Wrist Watch", "Wall Clock", "Mobile Phone", "Trimmer", "Electronics"];

const empty = {
  customerName: "",
  phoneNumber: "",
  problemDescription: "",
  deviceType: "Wrist Watch",
  estimatedCost: 0,
  advancePaid: 0,
  deliveryDate: "",
  brand: "",
  modelNumber: ""
};

export function Repairs() {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ _id: string; receiptNumber: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const balance = useMemo(
    () => Math.max(0, Number(form.estimatedCost || 0) - Number(form.advancePaid || 0)),
    [form.estimatedCost, form.advancePaid]
  );

  const load = () => api.get("/repairs", { params: { q } }).then((res) => setRepairs(res.data.repairs));

  useEffect(() => {
    load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.customerName.trim() || !form.phoneNumber.trim() || !form.problemDescription.trim()) {
      return toast.error("Customer name, phone, and description are required");
    }
    if (!form.deliveryDate) return toast.error("Set expected delivery date (use for jobs taking more than a day)");
    await api.post("/repairs", form);
    toast.success("Repair job registered");
    setForm(empty);
    load();
    window.setTimeout(() => window.print(), 250);
  }

  async function status(id: string, repairStatus: string) {
    await api.put(`/repairs/${id}`, { repairStatus });
    toast.success(repairStatus === "Delivered" ? "Marked as delivered — handed over to customer" : "Status updated");
    load();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/repairs/${deleteTarget._id}`);
      toast.success("Repair record deleted");
      setDeleteTarget(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Service center"
        title="Repair Management"
        subtitle="For watches, wall clocks, and mobiles when delivery is more than a day away."
      />
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statuses.map((s) => (
          <Card key={s}>
            <p className="text-sm text-slate-400">{s}</p>
            <p className="mt-2 text-2xl font-semibold">{repairs.filter((r) => r.repairStatus === s).length}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <Wrench size={20} /> Take repair job
          </h2>
          <p className="mb-4 text-sm text-cream/60">Record customer details, advance, and balance due on delivery.</p>
          <form onSubmit={submit} className="grid gap-3">
            <Field label="Customer name">
              <input
                className={inputClass}
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                required
              />
            </Field>
            <Field label="Phone number">
              <input
                className={inputClass}
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                required
              />
            </Field>
            <Field label="Device">
              <select className={inputClass} value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })}>
                {devices.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Brand (optional)">
                <input className={inputClass} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </Field>
              <Field label="Model (optional)">
                <input className={inputClass} value={form.modelNumber} onChange={(e) => setForm({ ...form, modelNumber: e.target.value })} />
              </Field>
            </div>
            <Field label="Problem / description">
              <textarea
                className={inputClass}
                rows={3}
                value={form.problemDescription}
                onChange={(e) => setForm({ ...form, problemDescription: e.target.value })}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Total amount">
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  value={form.estimatedCost}
                  onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value) })}
                />
              </Field>
              <Field label="Advance paid">
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  value={form.advancePaid}
                  onChange={(e) => setForm({ ...form, advancePaid: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm">
              <span className="text-cream/70">Balance on delivery: </span>
              <span className="font-semibold text-gold">{currency(balance)}</span>
            </div>
            <Field label="Expected delivery date">
              <input
                className={inputClass}
                type="date"
                value={form.deliveryDate}
                onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                required
              />
            </Field>
            <Button>
              <Printer size={16} /> Save & print slip
            </Button>
          </form>
        </Card>
        <Card>
          <div className="mb-4 flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-md border border-line bg-ink px-3">
              <Search size={16} />
              <input
                className="w-full bg-transparent py-2 text-sm outline-none"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by customer, phone, or status"
              />
            </div>
            <Button onClick={load}>Search</Button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase text-slate-400">
                <tr>
                  {["Receipt", "Customer", "Device", "Advance", "Balance", "Status", "Delivery", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {repairs.map((repair) => (
                  <tr key={repair._id}>
                    <td className="px-3 py-3 text-brand">{repair.receiptNumber}</td>
                    <td className="px-3 py-3">
                      {repair.customerName}
                      <p className="text-xs text-slate-400">{repair.phoneNumber}</p>
                    </td>
                    <td className="px-3 py-3">
                      {repair.deviceType}
                      <p className="text-xs text-slate-400">
                        {repair.brand} {repair.modelNumber}
                      </p>
                    </td>
                    <td className="px-3 py-3">{currency(repair.advancePaid)}</td>
                    <td className="px-3 py-3 font-medium">{currency(repair.remainingAmount)}</td>
                    <td className="px-3 py-3">
                      <select
                        className={inputClass}
                        value={repair.repairStatus}
                        onChange={(e) => status(repair._id, e.target.value)}
                      >
                        {statuses.map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">{compactDate(repair.deliveryDate)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {repair.repairStatus !== "Delivered" && (
                          <Button
                            variant="ghost"
                            className="!min-h-8 !px-2 !text-xs"
                            onClick={() => status(repair._id, "Delivered")}
                          >
                            Hand over
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          className="!min-h-8 !px-2 !text-xs text-danger"
                          onClick={() => setDeleteTarget({ _id: repair._id, receiptNumber: repair.receiptNumber })}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!repairs.length && <p className="px-3 py-6 text-center text-cream/50">No repair jobs yet.</p>}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {["SMS notification", "WhatsApp update", "Delivery tracking"].map((item) => (
              <div key={item} className="rounded-lg border border-line bg-white/[0.035] p-3 text-sm">
                <Bell size={16} className="mb-2 text-brand" />
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete repair?"
        message={deleteTarget ? `Remove repair ${deleteTarget.receiptNumber}? This cannot be undone.` : ""}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
