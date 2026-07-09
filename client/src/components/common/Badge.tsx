import { cn } from "../../utils/helpers";

type BadgeTone = "gold" | "success" | "danger" | "neutral";

const toneStyles: Record<BadgeTone, string> = {
  gold: "bg-gold-500/15 text-gold-400 border-gold-500/30",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  danger: "bg-red-500/15 text-red-400 border-red-500/30",
  neutral: "bg-white/5 text-ivory/70 border-white/10",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
