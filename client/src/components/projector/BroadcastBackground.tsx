import { useMemo } from "react";

interface Particle {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

/**
 * Subtle broadcast-style backdrop: a slow-drifting gold mesh gradient plus a
 * handful of tiny floating particles. Deliberately understated — the brief
 * calls for "no distracting animations" behind foreground content that's
 * meant to be read from 20-30 meters away.
 */
export function BroadcastBackground() {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        duration: 14 + Math.random() * 12,
        delay: Math.random() * 10,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,213,79,0.10),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(245,197,66,0.08),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(0,230,118,0.04),transparent_55%)] animate-broadcast-drift" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:64px_64px] [mask-image:radial-gradient(circle_at_50%_35%,black,transparent_75%)]" />
      <div className="absolute -top-32 left-1/2 h-80 w-[50rem] -translate-x-1/2 rounded-full bg-broadcast-gold/10 blur-[130px]" />
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute bottom-0 rounded-full bg-broadcast-gold/40 animate-particle-float"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
