import { cn, getInitials } from "../../utils/helpers";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  gradient?: string;
  className?: string;
}

const sizeStyles = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-24 w-24 text-2xl",
};

export function Avatar({ name, size = "md", gradient = "from-gold-500/30 to-amber-500/10", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-display font-semibold text-ivory ring-1 ring-white/10",
        sizeStyles[size],
        gradient,
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
