import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { PlayerPhoto } from "../components/common/PlayerPhoto";
import { ProgressBar } from "../components/common/ProgressBar";
import { Icon } from "../components/common/Icon";
import { PageLoader } from "../components/common/Loader";
import { teamService } from "../services/teamService";
import { Team } from "../types";
import { formatCurrency, resolveUploadUrl, teamGradientStyle } from "../utils/helpers";
import { ROUTES } from "../utils/constants";

const statusTone = {
  Available: "gold",
  Sold: "success",
  Unsold: "danger",
} as const;

export function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    teamService
      .getById(id)
      .then(setTeam)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load this team"))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <PageLoader />;

  if (error || !team) {
    return (
      <Card className="mx-auto max-w-lg border-red-500/30 bg-red-500/5 text-center">
        <p className="text-sm text-red-400">{error ?? "Team not found."}</p>
        <Link to={ROUTES.TEAMS} className="mt-4 inline-block text-sm text-gold-400 hover:text-gold-300">
          ← Back to Teams
        </Link>
      </Card>
    );
  }

  const logo = resolveUploadUrl(team.logoUrl);
  const spent = team.purseTotal - team.purseRemaining;
  const spentPct = team.purseTotal > 0 ? Math.round((spent / team.purseTotal) * 100) : 0;
  const soldPrices = team.players.map((p) => p.soldPrice ?? 0).filter((n) => n > 0);
  const avgPrice = soldPrices.length ? Math.round(soldPrices.reduce((a, b) => a + b, 0) / soldPrices.length) : 0;
  const highestPurchase = soldPrices.length ? Math.max(...soldPrices) : 0;

  return (
    <div className="space-y-8">
      <Link to={ROUTES.TEAMS} className="inline-flex items-center gap-1.5 text-sm text-ivory/50 hover:text-ivory">
        <Icon name="arrow-right" className="h-3.5 w-3.5 rotate-180" />
        Back to Teams
      </Link>

      <div className="glass-strong relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={teamGradientStyle(team.color)} />
        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl font-display text-2xl font-bold text-white ring-4 ring-navy-800"
            style={logo ? { backgroundImage: `url(${logo})`, backgroundSize: "cover", backgroundPosition: "center" } : teamGradientStyle(team.color)}
          >
            {!logo && team.shortName}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-semibold text-ivory sm:text-3xl">{team.name}</h1>
            <p className="mt-1 text-sm text-ivory/50">
              Owned by {team.owner} &middot; {team.players.length}/{team.maxPlayers} players
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="eyebrow mb-2">Budget Remaining</p>
          <p className="led-digit text-2xl">{formatCurrency(team.purseRemaining)}</p>
        </Card>
        <Card>
          <p className="eyebrow mb-2">Money Spent</p>
          <p className="led-digit text-2xl">{formatCurrency(spent)}</p>
        </Card>
        <Card>
          <p className="eyebrow mb-2">Average Price</p>
          <p className="led-digit text-2xl">{formatCurrency(avgPrice)}</p>
        </Card>
        <Card>
          <p className="eyebrow mb-2">Highest Purchase</p>
          <p className="led-digit text-2xl">{formatCurrency(highestPurchase)}</p>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between text-xs text-ivory/50">
          <span>Budget used</span>
          <span className="led-digit text-xs">
            {formatCurrency(spent)} / {formatCurrency(team.purseTotal)} ({spentPct}%)
          </span>
        </div>
        <ProgressBar value={spentPct} gradient="from-gold-500 to-amber-400" />
      </Card>

      <Card>
        <p className="eyebrow mb-5">Full Roster — {team.players.length} Players Bought</p>
        {team.players.length === 0 ? (
          <p className="text-sm text-ivory/40">No players acquired yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.players.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.03 }}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
              >
                <PlayerPhoto name={p.name} photoUrl={p.photoUrl} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ivory">{p.name}</p>
                  <p className="text-xs text-ivory/40">{p.role}</p>
                </div>
                <div className="text-right">
                  <p className="led-digit text-sm">{formatCurrency(p.soldPrice ?? 0)}</p>
                  <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
