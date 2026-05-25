import { FileCheck2, ShieldAlert, Upload } from "lucide-react";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { Button, Card, SectionHeader } from "../components/ui";

export function ImportInventory() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>();
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post("/inventory/import", form);
    setResult(data);
    toast.success(`Imported ${data.inserted} products`);
  }
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Bulk operations" title="Excel and CSV Import System" />
      <Card>
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <form onSubmit={submit} className="rounded-lg border border-dashed border-brand/40 bg-brand/5 p-6">
            <Upload className="mb-4 text-brand" size={28} />
            <h2 className="text-lg font-semibold">Smart inventory import</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Upload CSV, XLS, or XLSX files. The backend validates fields, auto-detects categories where possible, prevents duplicates, and returns a clean import report.</p>
            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <input className="rounded-md border border-line bg-ink px-3 py-2 text-sm" type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <Button disabled={!file}><Upload size={16} /> Import Products</Button>
            </div>
          </form>
          <div className="space-y-3">
            {["Auto-detect category", "Auto-map columns", "Validate data", "Prevent duplicates", "Show import errors"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-line bg-white/[0.035] p-3 text-sm"><FileCheck2 size={17} className="text-brand" /> {item}</div>
            ))}
          </div>
        </div>
      </Card>
      {result && (
        <Card>
          <h2 className="mb-4 font-semibold">Import Analytics</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-brand/10 p-4"><p className="text-sm text-slate-400">Inserted</p><p className="mt-1 text-3xl font-semibold text-brand">{result.inserted}</p></div>
            <div className="rounded-lg bg-gold/10 p-4"><p className="text-sm text-slate-400">Skipped</p><p className="mt-1 text-3xl font-semibold text-gold">{result.skipped}</p></div>
            <div className="rounded-lg bg-danger/10 p-4"><p className="text-sm text-slate-400">Errors</p><p className="mt-1 text-3xl font-semibold text-danger">{result.errors?.length || 0}</p></div>
          </div>
          <div className="mt-4 space-y-2">
            {result.errors?.map((error: string) => <p key={error} className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-red-200"><ShieldAlert className="mr-2 inline" size={15} />{error}</p>)}
          </div>
        </Card>
      )}
    </div>
  );
}
