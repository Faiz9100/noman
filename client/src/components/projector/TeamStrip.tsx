import { motion } from "framer-motion";
import { Avatar } from "../common/Avatar";
import { Team } from "../../types";
import { formatCurrency, cn, resolveUploadUrl } from "../../utils/helpers";

interface TeamStripProps {
  teams: Team[];
  leadingTeamId?: string | null;
}

function TeamCard({ team, isLeading }: { team: Team; isLeading: boolean }) {
  const logoUrl = resolveUploadUrl(team.logoUrl);
  const spentPct = team.purseTotal > 0 ? ((team.purseTotal - team.purseRemaining) / team.purseTotal) * 100 : 0;

  return (
    <motion.div
      layout
      animate={
        isLeading
          ? { scale: 1.04, boxShadow: "0 0 30px rgba(255,213,79,0.5)" }
          : { scale: 1, boxShadow: "0 0 0 rgba(255,213,79,0)" }
      }
      transition={{ duration: 0.35 }}
      className={cn(
        "relative flex min-w-[9.5rem] flex-1 flex-col items-center gap-1.5 overflow-hidden rounded-2xl border px-3 py-3 text-center",
        isLeading
          ? "border-broadcast-gold bg-broadcast-gold/10 animate-card-glow-pulse"
          : "border-white/10 bg-broadcast-bg3/70"
      )}
    >
      {isLeading && (
        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-gold-sweep" />
      )}
      {isLeading && <span className="absolute right-1.5 top-1.5 text-sm">👑</span>}

      {logoUrl ? (
        <img src={logoUrl} alt={team.name} className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10" />
      ) : (
        <Avatar name={team.name} size="sm" className="h-10 w-10" />
      )}

      <p className="truncate w-full font-poppins text-xs font-bold text-broadcast-white sm:text-sm">{team.shortName}</p>
      <p className="font-grotesk text-xs font-semibold text-broadcast-emerald sm:text-sm">{formatCurrency(team.purseRemaining)}</p>
      <p className="text-[10px] text-broadcast-gray">{team.players.length}/{team.maxPlayers} players</p>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", isLeading ? "bg-broadcast-gold" : "bg-broadcast-gold-light/70")}
          style={{ width: `${Math.min(100, spentPct)}%` }}
        />
      </div>
    </motion.div>
  );
}

export function TeamStrip({ teams, leadingTeamId }: TeamStripProps) {
  return (
    <div className="flex flex-wrap items-stretch gap-2.5 px-4 pb-4 sm:gap-3 sm:px-6">
      {teams.map((team) => (
        <TeamCard key={team._id} team={team} isLeading={team._id === leadingTeamId} />
      ))}
    </div>
  );
}
