import { cn } from "../../utils/helpers";

interface StatDigitProps {
  value: string;
  label: string;
  className?: string;
}

/**
 * The site's signature element: an LED-scoreboard-style numeric readout,
 * echoing the stadium display behind a live auction. Used for purse
 * amounts, prices, and headline stats wherever a number is the hero.
 */
export function StatDigit({ value, label, className }: StatDigitProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="led-digit text-3xl sm:text-4xl">{value}</span>
      <span className="eyebrow">{label}</span>
    </div>
  );
}
