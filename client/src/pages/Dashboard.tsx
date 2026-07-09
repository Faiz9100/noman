import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card } from "../components/common/Card";
import { StatCard } from "../components/common/StatCard";
import { PlayerPhoto } from "../components/common/PlayerPhoto";
import { Badge } from "../components/common/Badge";
import { ProgressBar } from "../components/common/ProgressBar";
import { Icon } from "../components/common/Icon";
import { Button } from "../components/common/Button";
import { PageLoader } from "../components/common/Loader";
import { historyService } from "../services/historyService";
import { auctionService } from "../services/auctionService";
import { useAuctionEngine } from "../hooks/useAuctionEngine";
import { DashboardStats } from "../types";
import { formatCurrency } from "../utils/helpers";
import { ROUTES } from "../utils/constants";

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [auctionId, setAuctionId] = useState<string | null>(null);

  const { auction } = useAuctionEngine(auctionId);

  useEffect(() => {
    historyService
      .getStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load dashboard stats"));
  }, []);

  useEffect(() => {
    auctionService.getActive().then((a) => setAuctionId(a?._id ?? null));
  }, []);

  if (error) {
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        <p className="text-sm text-red-400">{error}</p>
      </Card>
    );
  }

  if (!stats) return <PageLoader />;

  const isLive = auction?.status === "live" || auction?.status === "paused";
  const currentPlayer = isLive ? auction?.currentPlayer : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Overview</p>
          <h1 className="text-2xl font-semibold text-ivory sm:text-3xl">
            Tonight's <span className="gradient-text">Auction</span>
          </h1>
          <p className="mt-1 text-sm text-ivory/50">
            A live snapshot of franchises, players, and purse movement.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {auction && (
            <>
              <Badge tone="neutral">Round {auction.currentRound}</Badge>
              <Badge
                tone={
                  auction.status === "live"
                    ? "success"
                    : auction.status === "closed"
                      ? "danger"
                      : auction.status === "completed"
                        ? "gold"
                        : "neutral"
                }
              >
                {auction.status === "closed"
                  ? "Auction Closed"
                  : auction.status === "completed"
                    ? "Auction Complete"
                    : auction.status === "paused"
                      ? "Paused"
                      : auction.status === "live"
                        ? "Live"
                        : "Draft"}
              </Badge>
            </>
          )}
          <Link to={ROUTES.LIVE_AUCTION}>
            <Button className="w-full sm:w-auto">
              <Icon name="bolt" className="h-4 w-4" />
              Enter live auction
            </Button>
          </Link>
        </div>
      </div>

      {/* Live lot banner */}
      {isLive && currentPlayer && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong relative overflow-hidden p-5 sm:p-6"
        >
          <div className="pointer-events-none absolute inset-0 bg-mesh-gold opacity-50" />
          <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              <PlayerPhoto name={currentPlayer.name} photoUrl={currentPlayer.photoUrl} size="lg" />
              <div>
                <p className="eyebrow mb-1">Current Player</p>
                <h3 className="font-display text-lg font-semibold text-ivory">{currentPlayer.name}</h3>
                <p className="text-xs text-ivory/50">
                  {currentPlayer.role} &middot; {currentPlayer.country}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-center">
              <div>
                <p className="led-digit animate-count-glow text-2xl sm:text-3xl">{formatCurrency(auction?.currentBid ?? 0)}</p>
                <p className="eyebrow mt-1">Live Current Bid</p>
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-ivory sm:text-2xl">{auction?.leadingTeam?.shortName ?? "—"}</p>
                <p className="eyebrow mt-1">Leading Team</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon="users" label="Total Players" value={stats.totalPlayers} index={0} accent="from-sky-500/25 to-blue-500/5 text-sky-400" />
        <StatCard icon="check" label="Players Sold" value={stats.playersSold} index={1} accent="from-emerald-500/25 to-teal-500/5 text-emerald-400" />
        <StatCard icon="clock" label="Players Remaining" value={stats.remainingPlayers} index={2} accent="from-cyan-500/25 to-sky-500/5 text-cyan-400" />
        <StatCard
          icon="trophy"
          label="Highest Bid"
          value={stats.highestBid?.amount ?? 0}
          format={formatCurrency}
          subtitle={stats.highestBid ? `${stats.highestBid.player.name} → ${stats.highestBid.team.shortName}` : "—"}
          index={3}
          accent="from-gold-500/25 to-amber-500/5 text-gold-400"
        />
        <StatCard
          icon="star"
          label="Most Expensive Player"
          value={stats.highestBid?.amount ?? 0}
          format={formatCurrency}
          subtitle={stats.highestBid?.player.name ?? "—"}
          index={4}
          accent="from-fuchsia-500/25 to-pink-500/5 text-fuchsia-400"
        />
        <StatCard
          icon="wallet"
          label="Richest Team"
          value={stats.richestTeam?.purseRemaining ?? 0}
          format={formatCurrency}
          subtitle={stats.richestTeam?.name ?? "—"}
          index={5}
          accent="from-violet-500/25 to-purple-500/5 text-violet-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Upcoming player spotlight */}
        <Card className="lg:col-span-2" hoverable>
          <div className="mb-4 flex items-center justify-between">
            <p className="eyebrow">Upcoming Player</p>
            <Icon name="sparkles" className="h-4 w-4 text-gold-500/60" />
          </div>

          {stats.upcomingPlayer ? (
            <div className="flex flex-col items-center text-center">
              <PlayerPhoto name={stats.upcomingPlayer.name} photoUrl={stats.upcomingPlayer.photoUrl} size="xl" className="mb-4" />
              <h3 className="font-display text-xl font-semibold text-ivory">{stats.upcomingPlayer.name}</h3>
              <p className="mb-3 text-sm text-ivory/50">
                {stats.upcomingPlayer.role} &middot; {stats.upcomingPlayer.country}
              </p>
              <Badge tone="gold">Base {formatCurrency(stats.upcomingPlayer.basePrice)}</Badge>

              <div className="seam-divider my-5" />

              <Link to={ROUTES.LIVE_AUCTION} className="w-full">
                <Button variant="outline" className="w-full">
                  Take to the block
                  <Icon name="arrow-right" className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-ivory/50">No players remaining in the pool.</p>
          )}
        </Card>

        {/* Auction progress + budget spread */}
        <Card className="lg:col-span-3" hoverable>
          <div className="mb-6 flex items-center justify-between">
            <p className="eyebrow">Auction Progress</p>
            <span className="led-digit text-lg">{stats.auctionProgressPct}%</span>
          </div>

          <ProgressBar value={stats.auctionProgressPct} gradient="from-gold-500 via-amber-400 to-gold-300" className="animate-count-glow" />

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="led-digit text-2xl">{stats.playersSold}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-ivory/40">Sold</p>
            </div>
            <div>
              <p className="led-digit text-2xl">{stats.playersUnsold}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-ivory/40">Unsold</p>
            </div>
            <div>
              <p className="led-digit text-2xl">{stats.remainingPlayers}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-ivory/40">Remaining</p>
            </div>
          </div>

          <div className="seam-divider my-6" />

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="eyebrow mb-2 flex items-center gap-1.5">
                <Icon name="trending-up" className="h-3.5 w-3.5" />
                Richest Team
              </p>
              <p className="font-display text-lg font-semibold text-ivory">{stats.richestTeam?.name ?? "—"}</p>
              <p className="led-digit mt-1 text-sm">{formatCurrency(stats.richestTeam?.purseRemaining ?? 0)}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="eyebrow mb-2 flex items-center gap-1.5">
                <Icon name="trending-down" className="h-3.5 w-3.5" />
                Lowest Budget Team
              </p>
              <p className="font-display text-lg font-semibold text-ivory">{stats.lowestBudgetTeam?.name ?? "—"}</p>
              <p className="led-digit mt-1 text-sm">{formatCurrency(stats.lowestBudgetTeam?.purseRemaining ?? 0)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent purchases */}
      <Card>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="eyebrow mb-1">Latest Activity</p>
            <h2 className="font-display text-lg font-semibold text-ivory">Recent Purchases</h2>
          </div>
          <Link to={ROUTES.AUCTION_HISTORY} className="text-sm font-medium text-gold-400 hover:text-gold-300">
            View all →
          </Link>
        </div>

        {stats.recentPurchases.length === 0 ? (
          <p className="text-sm text-ivory/50">No sales yet — the gavel hasn't fallen.</p>
        ) : (
          <div className="space-y-3">
            {stats.recentPurchases.map((entry, i) => (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <PlayerPhoto name={entry.player.name} photoUrl={entry.player.photoUrl} />
                  <div>
                    <p className="font-medium text-ivory">{entry.player.name}</p>
                    <p className="text-xs text-ivory/50">{entry.player.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-6">
                  <Badge tone="neutral">{entry.team?.shortName ?? "—"}</Badge>
                  <span className="led-digit text-base">{formatCurrency(entry.price ?? 0)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
