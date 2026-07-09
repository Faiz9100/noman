import { motion } from "framer-motion";
import { Icon, IconName } from "./Icon";
import { Counter } from "./Counter";
import { cn } from "../../utils/helpers";

interface StatCardProps {
  icon: IconName;
  label: string;
  value: number;
  format?: (n: number) => string;
  suffix?: string;
  subtitle?: string;
  accent?: string;
  index?: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" },
  }),
};

export function StatCard({
  icon,
  label,
  value,
  format,
  suffix,
  subtitle,
  accent = "from-gold-500/25 to-amber-500/5 text-gold-400",
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-navy-800/60 p-5 shadow-inner-line backdrop-blur-sm transition-shadow duration-300 hover:shadow-gold-lg sm:p-6"
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40",
          accent
        )}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="eyebrow mb-3">{label}</p>
          <div className="led-digit text-2xl sm:text-3xl">
            <Counter value={value} format={format} />
            {suffix && <span className="ml-1 text-lg text-gold-400/70">{suffix}</span>}
          </div>
          {subtitle && <p className="mt-2 text-xs text-ivory/40">{subtitle}</p>}
        </div>

        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br", accent)}>
          <Icon name={icon} className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
