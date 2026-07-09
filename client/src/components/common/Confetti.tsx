import { useMemo } from "react";

const COLORS = ["#D4AF37", "#F2C94C", "#34d399", "#38bdf8", "#f472b6", "#a78bfa", "#fb923c"];

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  drift: number;
  size: number;
}

/**
 * A dependency-free confetti burst. Mount with a changing `burstKey` (e.g.
 * the id of the sale that triggered it) to replay the animation — CSS
 * keyframes need a fresh element to restart, which remounting via key gives us.
 */
export function Confetti({ burstKey, count = 90 }: { burstKey: string | number; count?: number }) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 2.2 + Math.random() * 1.6,
        color: COLORS[i % COLORS.length],
        drift: (Math.random() - 0.5) * 240,
        size: 6 + Math.random() * 6,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burstKey, count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 1.6,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--drift": `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
