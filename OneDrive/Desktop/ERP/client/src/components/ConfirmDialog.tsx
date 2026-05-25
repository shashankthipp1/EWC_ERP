import { Button } from "./ui";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel, loading }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div
        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-panel shadow-panel sm:rounded-2xl"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <h3 className="text-lg font-semibold text-cream">{title}</h3>
        </div>
        <p className="px-5 py-4 text-sm leading-relaxed text-muted sm:px-6">{message}</p>
        <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] px-5 py-4 sm:flex sm:justify-end sm:px-6">
          <Button className="w-full sm:w-auto" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Please wait…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
