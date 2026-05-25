import { Download, Save } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";
import { api } from "../api/http";
import { Button, Card, Field, SectionHeader, inputClass } from "../components/ui";
import { SHOP_DISPLAY_NAME } from "../constants/branding";

export function Settings() {
  const [form, setForm] = useState({ shopName: "", address: "", phone: "", defaultMinimumStock: 5 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/settings").then((res) => setForm(res.data.settings)).catch(() => undefined);
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api.put("/settings", form);
      toast.success("Settings saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function backup() {
    try {
      const { data } = await api.get("/settings/backup");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      saveAs(blob, `ewc-erp-backup-${new Date().toISOString().slice(0, 10)}.json`);
      toast.success("Backup downloaded");
    } catch {
      toast.error("Backup failed");
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Configuration" title="Settings" />
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Shop name (shown on order list PDF / Word)">
            <input
              className={inputClass}
              placeholder={SHOP_DISPLAY_NAME}
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Address">
            <textarea className={inputClass} rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Default Minimum Stock Alert">
            <input className={inputClass} type="number" min={0} value={form.defaultMinimumStock} onChange={(e) => setForm({ ...form, defaultMinimumStock: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={save} disabled={saving}>
            <Save size={16} /> {saving ? "Saving…" : "Save Settings"}
          </Button>
          <Button variant="secondary" onClick={backup}>
            <Download size={16} /> Backup Data (JSON)
          </Button>
        </div>
      </Card>
      <Card>
        <p className="text-sm text-cream/60">Staff user management is available under Staff Ops (admin only). PDF exports use shop name, address, and phone from these settings.</p>
      </Card>
    </div>
  );
}
