import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/helpers";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
}

export function Card({ children, className, hoverable = false, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "panel p-6",
        hoverable && "transition-transform duration-300 hover:-translate-y-1 hover:shadow-gold",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-4 flex items-center justify-between", className)}>{children}</div>;
}
