import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Icon } from "../components/common/Icon";
import { BroadcastBackground } from "../components/projector/BroadcastBackground";
import { PlayerCard } from "../components/projector/PlayerCard";
import { CenterStage } from "../components/projector/CenterStage";
import { BidFeed } from "../components/projector/BidFeed";
import { TeamStrip } from "../components/projector/TeamStrip";
import { SoldOverlay } from "../components/projector/SoldOverlay";
import { useAuctionEngine } from "../hooks/useAuctionEngine";
import { auctionService } from "../services/auctionService";
import { teamService } from "../services/teamService";
import { Team } from "../types";
import { ROUTES, APP_NAME } from "../utils/constants";
import { playBidSound, playSoldSound, playUnsoldSound, unlockAudio } from "../utils/sound";

/**
 * Full-screen, unauthenticated, read-only broadcast display. Same data
 * source and Socket.io wiring as before (useAuctionEngine) — only the
 * presentation changed, redesigned as a three-column live-broadcast
 * layout (player / bid stage / bid feed) with a team strip beneath,
 * meant to read cleanly for 200+ spectators from across a room.
 */
export function ProjectorScreen() {
  const [auctionId, setAuctionId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [soundOn, setSoundOn] = useState(false);

  const { auction, bidLog, lotClosed } = useAuctionEngine(auctionId);

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
  const leadingTeamFull = teams.find((t) => t._id === leadingTeam?._id);
  const soldTeamFull = teams.find((t) => t._id === lotClosed?.team?._id);
  const timer = auction?.timer;
  const isLive = auction?.status === "live" || auction?.status === "paused";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-broadcast-bg1">
      <BroadcastBackground />

      <Link
        to={ROUTES.DASHBOARD}
        className="absolute right-5 top-5 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-broadcast-gray backdrop-blur-sm transition-colors hover:text-broadcast-white"
      >
        <Icon name="close" className="h-3.5 w-3.5" />
        Exit projector
      </Link>

      {!soundOn && (
        <button
          onClick={enableSound}
          className="absolute left-5 top-5 z-20 flex items-center gap-1.5 rounded-full border border-broadcast-gold/30 bg-broadcast-gold/10 px-3 py-1.5 text-xs text-broadcast-gold backdrop-blur-sm transition-colors hover:bg-broadcast-gold/20"
        >
          <Icon name="sparkles" className="h-3.5 w-3.5" />
          Enable sound
        </button>
      )}

      <header className="relative z-10 flex items-center justify-center gap-3 pt-6">
        <span className="h-2.5 w-2.5 animate-floodlight rounded-full bg-broadcast-gold shadow-[0_0_16px_rgba(255,213,79,0.7)]" />
        <p className="font-poppins text-lg font-bold uppercase tracking-[0.3em] text-broadcast-white/80">{APP_NAME}</p>
      </header>

      {auction && auction.currentRound > 1 && isLive && (
        <div className="relative z-10 mx-auto mt-3 flex items-center gap-2 rounded-full border border-broadcast-gold/30 bg-broadcast-gold/10 px-5 py-1.5">
          <p className="font-poppins text-xs font-bold uppercase tracking-[0.2em] text-broadcast-gold">
            Round {auction.currentRound} &middot; Unsold Player Re-Auction
          </p>
        </div>
      )}

      <main className="relative z-10 flex flex-1 flex-col justify-center gap-4 px-4 py-4 sm:px-6">
        {!resolving && !auctionId && (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-poppins text-2xl text-broadcast-gray">Waiting for an auction to be configured…</p>
          </div>
        )}

        {auction?.status === "draft" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Icon name="bolt" className="mx-auto mb-4 h-10 w-10 text-broadcast-gold/60" />
            <p className="font-poppins text-2xl text-broadcast-gray">Waiting for the auctioneer to start the auction…</p>
          </div>
        )}

        {auction?.status === "completed" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Icon name="trophy" className="mx-auto mb-4 h-12 w-12 text-broadcast-gold" />
            <p className="font-poppins text-4xl font-bold text-broadcast-white">Auction Complete</p>
          </div>
        )}

        {auction?.status === "closed" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Icon name="close" className="mx-auto mb-4 h-12 w-12 text-broadcast-red" />
            <p className="font-poppins text-4xl font-bold text-broadcast-white">Auction Closed</p>
          </div>
        )}

        {player && isLive && timer && (
          <>
            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[3fr_4fr_3fr]">
              <AnimatePresence mode="wait">
                <PlayerCard key={player._id} player={player} />
              </AnimatePresence>

              <div className="order-first rounded-3xl border border-white/10 bg-gradient-to-b from-broadcast-bg3/60 to-broadcast-bg2/60 backdrop-blur-sm lg:order-none">
                <CenterStage
                  currentBid={auction.currentBid}
                  leadingTeam={leadingTeam}
                  leadingTeamFull={leadingTeamFull}
                  timer={timer}
                />
              </div>

              <BidFeed bidLog={bidLog} />
            </div>

            {teams.length > 0 && <TeamStrip teams={teams} leadingTeamId={leadingTeam?._id ?? null} />}
          </>
        )}
      </main>

      <AnimatePresence>
        {lotClosed && <SoldOverlay lotClosed={lotClosed} teamName={soldTeamFull?.name} />}
      </AnimatePresence>
    </div>
  );
}
