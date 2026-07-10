import { AnimatePresence, motion } from "framer-motion";
import { Counter } from "../common/Counter";
import { Avatar } from "../common/Avatar";
import { LotTeam, TimerSnapshot, Team } from "../../types";
import { formatCurrency, cn, resolveUploadUrl } from "../../utils/helpers";

interface CenterStageProps {
  currentBid: number;
  leadingTeam?: LotTeam | null;
  leadingTeamFull?: Team;
  timer: TimerSnapshot;
}

function timerColor(remaining: number): { text: string; ring: string } {
  if (remaining <= 5) return { text: "text-broadcast-red", ring: "#FF3B30" };
  if (remaining <= 10) return { text: "text-broadcast-orange", ring: "#FF9800" };
  return { text: "text-broadcast-white", ring: "#F8FAFC" };
}

export function CenterStage({ currentBid, leadingTeam, leadingTeamFull, timer }: CenterStageProps) {
  const progressPct = timer.total > 0 ? (timer.remaining / timer.total) * 100 : 0;
  const { text: timerText, ring: timerRing } = timerColor(timer.remaining);
  const isFinalCountdown = timer.remaining > 0 && timer.remaining <= 3 && timer.status !== "paused";
  const logoUrl = resolveUploadUrl(leadingTeamFull?.logoUrl);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-4 text-center">
      {/* Current bid */}
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.35em] text-broadcast-gray">Current Bid</p>
        <AnimatePresence mode="popLayout">
          <motion.p
            key={currentBid}
            initial={{ opacity: 0.4, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="font-grotesk text-6xl font-bold text-broadcast-gold [text-shadow:0_0_40px_rgba(255,213,79,0.45)] sm:text-7xl lg:text-8xl"
          >
            <Counter value={currentBid} format={formatCurrency} duration={0.7} />
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Leading team */}
      <AnimatePresence mode="wait">
        {leadingTeam ? (
          <motion.div
            key={leadingTeam._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-broadcast-gray">Leading Team</p>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={leadingTeamFull?.name ?? leadingTeam.name}
                className="h-20 w-20 rounded-full border-4 border-broadcast-gold/60 object-cover shadow-[0_0_30px_rgba(255,213,79,0.35)] sm:h-24 sm:w-24"
              />
            ) : (
              <Avatar name={leadingTeam.name} size="lg" className="h-20 w-20 border-4 border-broadcast-gold/60 text-2xl sm:h-24 sm:w-24" />
            )}
            <p className="font-poppins text-xl font-bold text-broadcast-white sm:text-2xl">{leadingTeamFull?.name ?? leadingTeam.name}</p>
          </motion.div>
        ) : (
          <motion.p
            key="no-bid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-poppins text-lg font-medium text-broadcast-gray"
          >
            Awaiting first bid…
          </motion.p>
        )}
      </AnimatePresence>

      {/* Timer */}
      <div className="relative flex h-32 w-32 items-center justify-center sm:h-40 sm:w-40">
        <svg className="absolute h-32 w-32 -rotate-90 sm:h-40 sm:w-40" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={timerRing}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={2 * Math.PI * 44 * (1 - progressPct / 100)}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        <AnimatePresence mode="wait">
          <motion.span
            key={isFinalCountdown ? `count-${timer.remaining}` : "timer"}
            initial={isFinalCountdown ? { scale: 0.5, opacity: 0 } : { opacity: 0 }}
            animate={isFinalCountdown ? { scale: [0.5, 1.25, 1], opacity: 1 } : { opacity: 1 }}
            transition={{ duration: 0.45 }}
            className={cn("font-grotesk font-bold", timerText, isFinalCountdown ? "text-6xl sm:text-7xl" : "text-4xl sm:text-5xl")}
          >
            {timer.remaining}
          </motion.span>
        </AnimatePresence>
      </div>
      <p className="-mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-broadcast-gray">
        {timer.status === "paused" ? "Paused" : "Auction Timer"}
      </p>
    </div>
  );
}
