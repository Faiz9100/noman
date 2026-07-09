import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

interface CounterProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

/** Animates a numeric value up from 0 (or its previous value) whenever `value` changes. */
export function Counter({ value, duration = 1.2, format, className }: CounterProps) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    prevValue.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const rounded = Math.round(display);
  return <span className={className}>{format ? format(rounded) : rounded.toLocaleString("en-IN")}</span>;
}
