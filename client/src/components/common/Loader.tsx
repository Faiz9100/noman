export function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-ivory/60">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
      <span className="font-display text-sm tracking-wide">{label}...</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <Loader label="Loading" />
    </div>
  );
}
