import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PlayerPhoto } from "../components/common/PlayerPhoto";
import { Counter } from "../components/common/Counter";
import { Icon } from "../components/common/Icon";
import { Confetti } from "../components/common/Confetti";
import { useAuctionEngine } from "../hooks/useAuctionEngine";
import { auctionService } from "../services/auctionService";
import { teamService } from "../services/teamService";
import { Team } from "../types";
import { cn, formatCurrency } from "../utils/helpers";
import { ROUTES, APP_NAME } from "../utils/constants";
import { playBidSound, playSoldSound, playUnsoldSound, unlockAudio } from "../utils/sound";

/**
 * Full-screen, unauthenticated, read-only display — deliberately shows
 * only what the requirements call for (photo, name, base price, current
 * bid, leading team, timer, and the sold/unsold moment) and nothing else,
 * so it reads cleanly from across a room.
 */
export function ProjectorScreen() {
  const [auctionId, setAuctionId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [soundOn, setSoundOn] = useState(false);

  const { auction, lotClosed } = useAuctionEngine(auctionId);

  const prevBidRef = useRef<number | null>(null);
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  useEffect(() => {
    auctionService
      .getActive()
      .then((a) => setAuctionId(a?._id ?? null))
      .finally(() => setResolving(false));
  }, []);

  useEffect(() => {
    teamService.getAll().then(setTeams).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (lotClosed?.result === "sold") {
      teamService.getAll().then(setTeams).catch(() => undefined);
    }
  }, [lotClosed]);

  // A tick on every bid raise; skip the reset-to-base-price that happens on a lot change.
  useEffect(() => {
    if (!auction) return;
    const prev = prevBidRef.current;
    prevBidRef.current = auction.currentBid;
    if (prev !== null && auction.currentBid > prev && soundOnRef.current) {
      playBidSound();
    }
  }, [auction?.currentBid, auction]);

  useEffect(() => {
    if (!lotClosed || !soundOnRef.current) return;
    if (lotClosed.result === "sold") playSoldSound();
    else playUnsoldSound();
  }, [lotClosed]);

  function enableSound() {
    unlockAudio();
    setSoundOn(true);
  }

  const player = auction?.currentPlayer;
  const leadingTeam = auction?.leadingTeam;
  const soldTeamFull = teams.find((t) => t._id === lotClosed?.team?._id);
  const timer = auction?.timer;
  const progressPct = timer && timer.total > 0 ? (timer.remaining / timer.total) * 100 : 0;
  const isSold = lotClosed?.result === "sold";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-navy-950">
      <div className="pointer-events-none absolute inset-0 bg-mesh-gold" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-[length:56px_56px] opacity-30 [mask-image:radial-gradient(circle_at_50%_35%,black,transparent_75%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-gold-500/10 blur-[120px]" />

      {/* Winning-team color wash on a sale */}
      <AnimatePresence>
        {isSold && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute inset-0 z-[5]"
            style={{
              background: `radial-gradient(circle at 50% 55%, ${soldTeamFull?.color ?? "#D4AF37"}33, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {isSold && <Confetti burstKey={lotClosed?.player._id ?? "sold"} />}

      <Link
        to={ROUTES.DASHBOARD}
        className="absolute right-5 top-5 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ivory/40 backdrop-blur-sm transition-colors hover:text-ivory"
      >
        <Icon name="close" className="h-3.5 w-3.5" />
        Exit projector
      </Link>

      {!soundOn && (
        <button
          onClick={enableSound}
          className="absolute left-5 top-5 z-20 flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-xs text-gold-400 backdrop-blur-sm transition-colors hover:bg-gold-500/20"
        >
          <Icon name="sparkles" className="h-3.5 w-3.5" />
          Enable sound
        </button>
      )}

      <header className="relative z-10 flex items-center justify-center gap-3 pt-8">
        <span className="h-2.5 w-2.5 animate-floodlight rounded-full bg-gold-500 shadow-gold" />
        <p className="font-display text-lg font-semibold uppercase tracking-[0.3em] text-ivory/70">{APP_NAME}</p>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-8">
        {!resolving && !auctionId && (
          <p className="font-display text-2xl text-ivory/40">Waiting for an auction to be configured…</p>
        )}

        {auction?.status === "draft" && (
          <div className="text-center">
            <Icon name="bolt" className="mx-auto mb-4 h-10 w-10 text-gold-500/60" />
            <p className="font-display text-2xl text-ivory/60">Waiting for the auctioneer to start the auction…</p>
          </div>
        )}

        {auction?.status === "completed" && (
          <div className="text-center">
            <Icon name="trophy" className="mx-auto mb-4 h-12 w-12 text-gold-500" />
            <p className="font-display text-3xl text-ivory">Auction Complete</p>
          </div>
        )}

        {auction?.status === "closed" && (
          <div className="text-center">
            <Icon name="close" className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <p className="font-display text-3xl text-ivory">Auction Closed</p>
          </div>
        )}

        {player && (auction?.status === "live" || auction?.status === "paused") && (
          <>
            {auction.currentRound > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex flex-col items-center gap-1 rounded-2xl border border-gold-500/30 bg-gold-500/10 px-8 py-3 text-center"
              >
                <p className="font-display text-2xl font-bold uppercase tracking-[0.2em] text-gold-400 sm:text-3xl">
                  Round {auction.currentRound}
                </p>
                <p className="eyebrow text-ivory/60">Unsold Player Re-Auction</p>
              </motion.div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={player._id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.4 }}
                className="flex w-full max-w-4xl flex-col items-center text-center"
              >
                <PlayerPhoto
                  name={player.name}
                  photoUrl={player.photoUrl}
                  size="xl"
                  className="mb-6 h-40 w-40 text-4xl shadow-gold-lg sm:h-52 sm:w-52 sm:text-6xl"
                />

                <h1 className="font-display text-4xl font-bold text-ivory sm:text-6xl">{player.name}</h1>

                <div className="mt-10 grid w-full grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-4">
                  <div>
                    <p className="led-digit text-lg sm:text-3xl md:text-4xl">{formatCurrency(player.basePrice)}</p>
                    <p className="eyebrow mt-3">Base Price</p>
                  </div>

                  <div>
                    <p className="led-digit text-xl sm:text-4xl md:text-5xl">
                      <Counter value={auction.currentBid} format={formatCurrency} />
                    </p>
                    <p className="eyebrow mt-3">Current Bid</p>
                  </div>

                  <div>
                    <p className="font-display text-lg font-bold text-ivory sm:text-3xl md:text-4xl">
                      {leadingTeam ? leadingTeam.shortName : "—"}
                    </p>
                    <p className="eyebrow mt-3">Leading Team</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="relative flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
                      <svg className="absolute h-16 w-16 -rotate-90 sm:h-20 sm:w-20" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke={(timer?.remaining ?? 0) <= 5 ? "#f43f5e" : "#D4AF37"}
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={2 * Math.PI * 28 * (1 - progressPct / 100)}
                          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                        />
                      </svg>
                      <span className="led-digit text-xl sm:text-2xl">{timer?.remaining ?? 0}</span>
                    </div>
                    <p className="eyebrow mt-3">{timer?.status === "paused" ? "Paused" : "Timer"}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {lotClosed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.4, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="relative z-10 mt-10 flex flex-col items-center gap-3"
                >
                  <div
                    className={cn(
                      "rounded-2xl border-4 px-10 py-4 font-display text-4xl font-bold uppercase tracking-[0.15em] sm:text-5xl",
                      lotClosed.result === "sold"
                        ? "border-emerald-500 text-emerald-400 shadow-[0_0_60px_rgba(52,211,153,0.45)]"
                        : "border-red-500 text-red-400 shadow-[0_0_60px_rgba(248,113,113,0.4)]"
                    )}
                  >
                    {lotClosed.result === "sold" ? "SOLD!" : "UNSOLD"}
                  </div>

                  {lotClosed.result === "sold" && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <p className="font-display text-2xl font-bold text-ivory sm:text-3xl">
                        {soldTeamFull?.name ?? lotClosed.team?.shortName}
                      </p>
                      <p className="led-digit text-xl sm:text-2xl">{formatCurrency(lotClosed.price ?? 0)}</p>
                      <p className="eyebrow mt-1">Winning Team &amp; Price</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}
