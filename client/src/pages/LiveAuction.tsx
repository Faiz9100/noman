import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { PlayerPhoto } from "../components/common/PlayerPhoto";
import { Counter } from "../components/common/Counter";
import { Icon } from "../components/common/Icon";
import { Button } from "../components/common/Button";
import { PageLoader } from "../components/common/Loader";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { useAuctionEngine } from "../hooks/useAuctionEngine";
import { auctionService } from "../services/auctionService";
import { teamService } from "../services/teamService";
import { historyService } from "../services/historyService";
import { Team } from "../types";
import { cn, formatCurrency } from "../utils/helpers";

export function LiveAuction() {
  const [auctionId, setAuctionId] = useState<string | null>(null);
  const [resolvingAuction, setResolvingAuction] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [toolbarBusy, setToolbarBusy] = useState<"pause" | "resume" | "export" | null>(null);
  const [customBid, setCustomBid] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [creatingAuction, setCreatingAuction] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { auction, bidLog, lotClosed, roundAdvanced, isLoading, error, connected, actions } =
    useAuctionEngine(auctionId);

  useEffect(() => {
    auctionService
      .getActive()
      .then((a) => setAuctionId(a?._id ?? null))
      .finally(() => setResolvingAuction(false));
  }, []);

  useEffect(() => {
    teamService.getAll().then(setTeams).catch(() => undefined);
  }, []);

  // Purses shift after every sale — refresh the team list once the flash appears.
  useEffect(() => {
    if (lotClosed?.result === "sold") {
      teamService.getAll().then(setTeams).catch(() => undefined);
    }
  }, [lotClosed]);

  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(() => setActionError(null), 4000);
    return () => clearTimeout(t);
  }, [actionError]);

  async function runAction(fn: () => Promise<{ success: boolean; message?: string }>) {
    const ack = await fn();
    if (!ack.success) setActionError(ack.message ?? "Action failed");
  }

  async function handleStart() {
    setStarting(true);
    const ack = await actions.start();
    if (!ack.success) setActionError(ack.message ?? "Could not start the auction");
    setStarting(false);
  }

  async function handlePauseResume() {
    if (!auctionId || !auction) return;
    setToolbarBusy(auction.status === "live" ? "pause" : "resume");
    try {
      auction.status === "live" ? await auctionService.pause(auctionId) : await auctionService.resume(auctionId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update the auction");
    } finally {
      setToolbarBusy(null);
    }
  }

  async function handleCreateAuction() {
    setCreatingAuction(true);
    setCreateError(null);
    try {
      const created = await auctionService.create("Auction Night");
      setAuctionId(created._id);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create the auction");
    } finally {
      setCreatingAuction(false);
    }
  }

  async function handleExport() {
    if (!auctionId) return;
    setToolbarBusy("export");
    try {
      await historyService.exportCsv(auctionId);
    } catch {
      setActionError("Could not export results");
    } finally {
      setToolbarBusy(null);
    }
  }

  if (resolvingAuction || (auctionId && isLoading)) return <PageLoader />;

  if (!auctionId) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <Icon name="gavel" className="mx-auto mb-4 h-10 w-10 text-gold-500/60" />
        <h2 className="mb-2 font-display text-xl font-semibold text-ivory">No auction configured</h2>
        <p className="mb-4 text-sm text-ivory/50">
          Create a draft auction to get started, then add teams and players from their pages.
        </p>
        <Button onClick={handleCreateAuction} isLoading={creatingAuction}>
          Create Auction
        </Button>
        {createError && <p className="mt-3 text-sm text-red-400">{createError}</p>}
      </Card>
    );
  }

  if (error || !auction) {
    return (
      <Card className="mx-auto max-w-lg border-red-500/30 bg-red-500/5 text-center">
        <p className="text-sm text-red-400">{error ?? "Could not load this auction."}</p>
      </Card>
    );
  }

  const adminToolbar = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {(auction.status === "live" || auction.status === "paused") && (
        <Button variant="secondary" size="sm" onClick={handlePauseResume} isLoading={toolbarBusy === "pause" || toolbarBusy === "resume"}>
          <Icon name={auction.status === "live" ? "clock" : "bolt"} className="h-3.5 w-3.5" />
          {auction.status === "live" ? "Pause Auction" : "Resume Auction"}
        </Button>
      )}
      <Button variant="ghost" size="sm" className="border border-white/10" onClick={handleExport} isLoading={toolbarBusy === "export"}>
        <Icon name="external-link" className="h-3.5 w-3.5" />
        Export Results
      </Button>
      {(auction.status === "live" || auction.status === "paused") && (
        <Button
          variant="danger"
          size="sm"
          onClick={() => setCloseOpen(true)}
        >
          <Icon name="close" className="h-3.5 w-3.5" />
          Close Auction
        </Button>
      )}
      {auction.status !== "live" && auction.status !== "draft" && (
        <Button variant="ghost" size="sm" className="border border-red-500/20 text-red-400 hover:bg-red-500/10" onClick={() => setResetOpen(true)}>
          <Icon name="history" className="h-3.5 w-3.5" />
          Reset Auction
        </Button>
      )}
    </div>
  );

  if (auction.status === "draft") {
    return (
      <div className="space-y-6">
        <Card className="mx-auto max-w-lg text-center">
          <Icon name="bolt" className="mx-auto mb-4 h-10 w-10 text-gold-500" />
          <h2 className="mb-2 font-display text-xl font-semibold text-ivory">{auction.name}</h2>
          <p className="mb-6 text-sm text-ivory/50">
            Ready to go — starting will load the first player and begin a {auction.bidTimerSeconds}s timer for every
            connected screen, instantly.
          </p>
          <Button size="lg" onClick={handleStart} isLoading={starting}>
            <Icon name="bolt" className="h-4 w-4" />
            Start Auction
          </Button>
        </Card>
      </div>
    );
  }

  if (auction.status === "completed") {
    return (
      <div className="space-y-6">
        <Card className="mx-auto max-w-lg text-center">
          <Icon name="trophy" className="mx-auto mb-4 h-10 w-10 text-gold-500" />
          <h2 className="mb-2 font-display text-xl font-semibold text-ivory">Auction complete</h2>
          <p className="mb-6 text-sm text-ivory/50">Every player in tonight's pool has been through the block.</p>
          {adminToolbar}
        </Card>
        <ResetDialog open={resetOpen} onClose={() => setResetOpen(false)} auctionId={auctionId} />
      </div>
    );
  }

  if (auction.status === "closed") {
    return (
      <div className="space-y-6">
        <Card className="mx-auto max-w-lg border-red-500/20 text-center">
          <Icon name="close" className="mx-auto mb-4 h-10 w-10 text-red-400" />
          <h2 className="mb-2 font-display text-xl font-semibold text-ivory">Auction Closed</h2>
          <p className="mb-6 text-sm text-ivory/50">
            The admin manually ended this auction. Every sale up to that point has been saved as the final result.
          </p>
          {adminToolbar}
        </Card>
        <ResetDialog open={resetOpen} onClose={() => setResetOpen(false)} auctionId={auctionId} />
      </div>
    );
  }

  const player = auction.currentPlayer;
  const leadingTeam = auction.leadingTeam;
  const timer = auction.timer;
  const progressPct = timer.total > 0 ? (timer.remaining / timer.total) * 100 : 0;
  const isLive = auction.status === "live";
  const biddingOpen = auction.biddingOpen;

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="eyebrow flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          {connected ? "Live" : "Reconnecting…"} &middot; Round {auction.currentRound}
          {auction.status === "paused" && (
            <Badge tone="neutral" className="ml-1">
              Auction paused
            </Badge>
          )}
        </p>
        <h1 className="text-2xl font-semibold text-ivory sm:text-3xl">On The Block</h1>
        {adminToolbar}
      </div>

      <AnimatePresence>
        {roundAdvanced && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto max-w-md rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-center text-sm text-gold-400"
          >
            Round {roundAdvanced.round} — {roundAdvanced.requeuedCount} unsold player
            {roundAdvanced.requeuedCount === 1 ? "" : "s"} back on the block
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto max-w-2xl rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-center text-sm text-red-400"
          >
            {actionError}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Spotlight */}
        <div className="lg:col-span-2">
          <div className="glass-strong relative overflow-hidden p-6 sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-mesh-gold opacity-70" />

            {!player ? (
              <div className="relative flex flex-col items-center py-10 text-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
                <p className="mt-4 text-sm text-ivory/50">Loading next player…</p>
              </div>
            ) : (
              <div className="relative flex flex-col items-center text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={player._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col items-center"
                  >
                    <PlayerPhoto name={player.name} photoUrl={player.photoUrl} size="xl" className="mb-5 h-28 w-28 text-3xl shadow-gold" />
                    <h2 className="font-display text-2xl font-semibold text-ivory sm:text-3xl">{player.name}</h2>
                    <p className="mt-1 text-sm text-ivory/50">
                      {player.role} &middot; {player.country}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <Badge tone="gold">Base {formatCurrency(player.basePrice)}</Badge>
                      <Badge tone={biddingOpen ? "success" : "danger"}>{biddingOpen ? "Bidding Open" : "Bidding Closed"}</Badge>
                      {player.stats?.matches !== undefined && <Badge tone="neutral">{player.stats.matches} matches</Badge>}
                      {player.stats?.runs !== undefined && <Badge tone="neutral">{player.stats.runs} runs</Badge>}
                      {player.stats?.wickets !== undefined && <Badge tone="neutral">{player.stats.wickets} wkts</Badge>}
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="seam-divider my-8 w-full" />

                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className={cn("led-digit text-2xl sm:text-3xl md:text-4xl", leadingTeam && "animate-count-glow")}>
                      <Counter value={auction.currentBid} format={formatCurrency} />
                    </p>
                    <p className="eyebrow mt-2">Current Bid</p>
                  </div>
                  <div>
                    <p className="font-display text-xl font-semibold text-ivory sm:text-2xl md:text-3xl">
                      {leadingTeam ? leadingTeam.shortName : "—"}
                    </p>
                    <p className="eyebrow mt-2">Leading Team</p>
                  </div>
                  <div>
                    <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                      <svg className="absolute h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke={timer.remaining <= 5 ? "#f43f5e" : "#D4AF37"}
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={2 * Math.PI * 28 * (1 - progressPct / 100)}
                          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                        />
                      </svg>
                      <span className="led-digit text-lg">{timer.remaining}</span>
                    </div>
                    <p className="eyebrow mt-2">Timer</p>
                  </div>
                </div>

                <AnimatePresence>
                  {lotClosed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6, rotate: -4 }}
                      animate={{ opacity: 1, scale: 1, rotate: -4 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      className={cn(
                        "mt-8 rounded-xl border-4 px-8 py-3 font-display text-3xl font-bold uppercase tracking-widest",
                        lotClosed.result === "sold"
                          ? "border-emerald-500 text-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.4)]"
                          : "border-red-500 text-red-400 shadow-[0_0_40px_rgba(248,113,113,0.35)]"
                      )}
                    >
                      {lotClosed.result === "sold" ? `SOLD → ${lotClosed.team?.shortName}` : "UNSOLD"}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Controls */}
          {player && !lotClosed && (
            <Card className={cn("mt-6 space-y-5", !isLive && "opacity-50")}>
              {!isLive && <p className="text-center text-xs uppercase tracking-wide text-ivory/40">Resume the auction to continue</p>}

              <div>
                <p className="eyebrow mb-3">Timer</p>
                <div className="flex gap-3">
                  {timer.status === "running" ? (
                    <Button variant="secondary" disabled={!isLive} onClick={() => runAction(actions.pauseTimer)}>
                      Pause
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled={!isLive || timer.status === "expired"} onClick={() => runAction(actions.resumeTimer)}>
                      Resume
                    </Button>
                  )}
                  <Button variant="ghost" disabled={!isLive} onClick={() => runAction(actions.resetTimer)}>
                    Reset
                  </Button>
                </div>
              </div>

              <div className="seam-divider" />

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="eyebrow">Bidding floor</p>
                  {biddingOpen ? (
                    <Button variant="danger" size="sm" disabled={!isLive} onClick={() => runAction(actions.closeBidding)}>
                      Close Bidding
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" disabled={!isLive} onClick={() => runAction(actions.openBidding)}>
                      Open Bidding
                    </Button>
                  )}
                </div>
                <p className="text-xs text-ivory/40">
                  {biddingOpen ? "Teams can raise the bid. Close it before hammering down." : "Locked — no more bids until reopened."}
                </p>
              </div>

              <div className="seam-divider" />

              <div className={cn(!biddingOpen && "pointer-events-none opacity-40")}>
                <p className="eyebrow mb-3">Adjust bid</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {auction.bidIncrements.map((inc) => (
                    <Button key={`inc-${inc}`} variant="secondary" disabled={!isLive} onClick={() => runAction(() => actions.increaseBid(inc))}>
                      + {formatCurrency(inc)}
                    </Button>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {auction.bidIncrements.map((inc) => (
                    <Button
                      key={`dec-${inc}`}
                      variant="ghost"
                      className="border border-white/10"
                      disabled={!isLive}
                      onClick={() => runAction(() => actions.decreaseBid(inc))}
                    >
                      − {formatCurrency(inc)}
                    </Button>
                  ))}
                </div>

                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const amount = Number(customBid);
                    if (!amount || amount <= 0) return;
                    runAction(() => actions.increaseBid(amount));
                    setCustomBid("");
                  }}
                >
                  <input
                    type="number"
                    min={1}
                    disabled={!isLive}
                    value={customBid}
                    onChange={(e) => setCustomBid(e.target.value)}
                    placeholder="Custom bid amount"
                    className="w-full rounded-lg border border-white/10 bg-navy-900 px-3.5 py-2.5 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold-500"
                  />
                  <Button type="submit" variant="secondary" disabled={!isLive || !customBid}>
                    Place
                  </Button>
                </form>
              </div>

              <div className="seam-divider" />

              <div className={cn(!biddingOpen && "pointer-events-none opacity-40")}>
                <p className="eyebrow mb-3">Bidding team</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {teams.map((team) => {
                    const isLeading = leadingTeam?._id === team._id;
                    const canAfford = team.purseRemaining >= auction.currentBid;
                    return (
                      <button
                        key={team._id}
                        disabled={!isLive || isLeading || !canAfford}
                        onClick={() => runAction(() => actions.selectTeam(team._id))}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                          isLeading
                            ? "border-gold-500/50 bg-gold-500/15 text-gold-400"
                            : "border-white/10 bg-white/[0.02] text-ivory/70 hover:bg-white/5"
                        )}
                      >
                        <p className="font-display font-semibold">{team.shortName}</p>
                        <p className="mt-0.5 text-ivory/40">{formatCurrency(team.purseRemaining)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="seam-divider" />

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => runAction(actions.markSold)}
                  disabled={!isLive || !leadingTeam}
                >
                  <Icon name="gavel" className="h-4 w-4" />
                  Mark Sold
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => runAction(actions.markUnsold)}
                  disabled={!isLive || !!leadingTeam}
                >
                  Mark Unsold
                </Button>
              </div>
              {leadingTeam && <p className="text-center text-xs text-ivory/40">Marking sold closes bidding automatically.</p>}
            </Card>
          )}

          {lotClosed && (
            <Card className="mt-6 text-center">
              <p className="mb-3 text-sm text-ivory/50">Moving to the next player automatically…</p>
              <Button variant="outline" size="sm" onClick={() => runAction(actions.nextLot)}>
                Skip wait
                <Icon name="arrow-right" className="h-4 w-4" />
              </Button>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <p className="eyebrow mb-4">Bid History</p>
            {bidLog.length === 0 ? (
              <p className="text-sm text-ivory/40">No bids placed on this lot yet.</p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {bidLog.map((entry) => (
                    <motion.div
                      key={entry._id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                    >
                      <span className="text-sm text-ivory/70">{entry.team.shortName}</span>
                      <span className="led-digit text-sm">{formatCurrency(entry.amount)}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Card>

          <Card>
            <p className="eyebrow mb-4">Franchises</p>
            <div className="space-y-2">
              {teams.map((team) => (
                <div key={team._id} className="flex items-center justify-between text-sm">
                  <span className="text-ivory/70">{team.shortName}</span>
                  <span className="text-ivory/40">{team.players.length} players</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <ResetDialog open={resetOpen} onClose={() => setResetOpen(false)} auctionId={auctionId} />
      <CloseDialog open={closeOpen} onClose={() => setCloseOpen(false)} auctionId={auctionId} />
    </div>
  );
}

function CloseDialog({ open, onClose, auctionId }: { open: boolean; onClose: () => void; auctionId: string }) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="Close this auction?"
      description="This ends the auction immediately — any player still Available or Unsold stays that way, bidding is locked, and every sale recorded so far becomes the final result. This cannot be undone."
      confirmLabel="Close auction"
      onConfirm={async () => {
        await auctionService.end(auctionId);
      }}
    />
  );
}

function ResetDialog({ open, onClose, auctionId }: { open: boolean; onClose: () => void; auctionId: string }) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="Reset this auction?"
      description="Every sold or unsold player returns to Available, every team's purse and roster is refunded, and the auction goes back to draft. This cannot be undone."
      confirmLabel="Reset auction"
      onConfirm={async () => {
        await auctionService.reset(auctionId);
      }}
    />
  );
}
