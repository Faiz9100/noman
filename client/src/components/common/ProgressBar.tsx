import { motion } from "framer-motion";
import { cn } from "../../utils/helpers";

interface ProgressBarProps {
  value: number; // 0-100
  gradient?: string;
  trackClassName?: string;
  className?: string;
  delay?: number;
}

export function ProgressBar({
  value,
  gradient = "from-gold-500 to-amber-300",
  trackClassName,
  className,
  delay = 0,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/5", trackClassName)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 1, delay, ease: "easeOut" }}
        className={cn("h-full rounded-full bg-gradient-to-r", gradient, className)}
      />
    </div>
  );
}
