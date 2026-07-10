import { motion } from "framer-motion";
import { PlayerPhoto } from "../common/PlayerPhoto";
import { LotPlayer } from "../../types";
import { formatCurrency, cn } from "../../utils/helpers";

interface PlayerCardProps {
  player: LotPlayer;
}

/** Derived purely from data already on the lot — no backend/schema change. */
function badgeFor(player: LotPlayer): { label: string; tone: string } | null {
  if (player.basePrice >= 200000) return { label: "Marquee Player", tone: "border-broadcast-gold/60 text-broadcast-gold bg-broadcast-gold/10" };
  if (player.basePrice >= 75000) return { label: "Star Player", tone: "border-broadcast-gold-light/50 text-broadcast-gold-light bg-broadcast-gold-light/10" };
  if (player.basePrice <= 5000) return { label: "Emerging Talent", tone: "border-broadcast-emerald/50 text-broadcast-emerald bg-broadcast-emerald/10" };
  return null;
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-center">
      <p className="font-grotesk text-lg font-semibold text-broadcast-white sm:text-xl">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-broadcast-gray">{label}</p>
    </div>
  );
}

export function PlayerCard({ player }: PlayerCardProps) {
  const badge = badgeFor(player);
  const s = player.stats;

  return (
    <motion.div
      key={player._id}
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="flex h-full flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-broadcast-bg3/80 to-broadcast-bg2/80 p-5 shadow-[0_0_50px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-7"
    >
      {badge && (
        <span className={cn("mb-4 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em]", badge.tone)}>
          {badge.label}
        </span>
      )}

      <div className="relative mb-5">
        <div className="absolute inset-0 -m-3 rounded-full bg-broadcast-gold/15 blur-2xl" />
        <PlayerPhoto
          name={player.name}
          photoUrl={player.photoUrl}
          size="xl"
          className="relative h-32 w-32 border-4 border-broadcast-gold/40 text-3xl shadow-[0_0_40px_rgba(255,213,79,0.25)] sm:h-44 sm:w-44 sm:text-5xl lg:h-52 lg:w-52"
        />
      </div>

      <h2 className="text-center font-poppins text-2xl font-bold leading-tight text-broadcast-white sm:text-3xl lg:text-4xl">
        {player.name}
      </h2>
      <p className="mt-1.5 text-sm font-medium uppercase tracking-[0.2em] text-broadcast-gray">
        {player.role} &middot; {player.country}
      </p>

      <div className="mt-6 grid w-full grid-cols-2 gap-2.5">
        <StatCell label="Base Price" value={formatCurrency(player.basePrice)} />
        <StatCell label="Status" value={player.status} />
        {s?.matches !== undefined && <StatCell label="Matches" value={s.matches} />}
        {s?.runs !== undefined && <StatCell label="Runs" value={s.runs} />}
        {s?.wickets !== undefined && <StatCell label="Wickets" value={s.wickets} />}
        {s?.average !== undefined && <StatCell label="Average" value={s.average} />}
        {s?.strikeRate !== undefined && <StatCell label="Strike Rate" value={s.strikeRate} />}
        {s?.economy !== undefined && <StatCell label="Economy" value={s.economy} />}
      </div>
    </motion.div>
  );
}
