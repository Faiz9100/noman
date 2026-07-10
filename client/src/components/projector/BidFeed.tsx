import { AnimatePresence, motion } from "framer-motion";
import { EngineBid } from "../../types";
import { formatCurrency } from "../../utils/helpers";

interface BidFeedProps {
  bidLog: EngineBid[];
}

export function BidFeed({ bidLog }: BidFeedProps) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-broadcast-bg3/80 to-broadcast-bg2/80 p-4 backdrop-blur-sm sm:p-5">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.3em] text-broadcast-gray">Live Bid Feed</p>

      <div className="scrollbar-none flex flex-1 flex-col gap-2 overflow-hidden">
        <AnimatePresence initial={false}>
          {bidLog.length === 0 && (
            <p className="mt-8 text-center text-sm text-broadcast-gray/70">No bids yet</p>
          )}
          {bidLog.slice(0, 10).map((bid, i) => (
            <motion.div
              key={bid._id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={
                i === 0
                  ? "flex items-center justify-between rounded-xl border border-broadcast-gold/50 bg-broadcast-gold/10 px-3.5 py-2.5 shadow-[0_0_20px_rgba(255,213,79,0.25)]"
                  : "flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5"
              }
            >
              <span className={i === 0 ? "font-poppins text-sm font-bold text-broadcast-white" : "font-poppins text-sm font-medium text-broadcast-gray"}>
                {bid.team.name}
              </span>
              <span className={i === 0 ? "font-grotesk text-base font-bold text-broadcast-gold" : "font-grotesk text-sm font-semibold text-broadcast-white/80"}>
                {formatCurrency(bid.amount)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
