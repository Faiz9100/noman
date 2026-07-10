import { motion } from "framer-motion";
import { Confetti } from "../common/Confetti";
import { LotClosedPayload } from "../../types";
import { formatCurrency } from "../../utils/helpers";

interface SoldOverlayProps {
  lotClosed: LotClosedPayload;
  teamName?: string;
}

/** Full-screen celebratory (sold) or somber (unsold) moment — pauses the
 * eye on the outcome before the next lot animates in. */
export function SoldOverlay({ lotClosed, teamName }: SoldOverlayProps) {
  const isSold = lotClosed.result === "sold";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-broadcast-bg1/90 backdrop-blur-md"
    >
      {isSold && <Confetti burstKey={lotClosed.player._id} />}

      <motion.div
        initial={{ scale: 0.4, rotate: isSold ? -8 : 0, opacity: 0 }}
        animate={{ scale: 1, rotate: isSold ? -4 : -6, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 16 }}
        className={
          isSold
            ? "rounded-3xl border-8 border-broadcast-emerald px-14 py-6 shadow-[0_0_90px_rgba(0,230,118,0.5)]"
            : "rounded-3xl border-8 border-broadcast-red px-14 py-6 shadow-[0_0_90px_rgba(255,59,48,0.5)]"
        }
      >
        <p
          className={
            isSold
              ? "font-poppins text-6xl font-black uppercase tracking-[0.1em] text-broadcast-emerald sm:text-8xl"
              : "font-poppins text-6xl font-black uppercase tracking-[0.1em] text-broadcast-red sm:text-8xl"
          }
        >
          {isSold ? "🔨 SOLD 🔨" : "UNSOLD"}
        </p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-8 font-poppins text-3xl font-bold text-broadcast-white sm:text-5xl"
      >
        {lotClosed.player.name}
      </motion.p>

      {isSold && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 flex flex-col items-center gap-1"
        >
          <p className="font-poppins text-xl font-semibold text-broadcast-gold-light sm:text-2xl">
            {teamName ?? lotClosed.team?.name}
          </p>
          <p className="font-grotesk text-2xl font-bold text-broadcast-gold sm:text-3xl">
            {formatCurrency(lotClosed.price ?? 0)}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
