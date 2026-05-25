export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-gold border-r-gold/50" />
      </div>
      <p className="text-sm font-medium text-muted">Loading workspace…</p>
    </div>
  );
}
