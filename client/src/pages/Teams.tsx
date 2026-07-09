import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "../components/common/Badge";
import { Avatar } from "../components/common/Avatar";
import { ProgressBar } from "../components/common/ProgressBar";
import { Icon } from "../components/common/Icon";
import { Button } from "../components/common/Button";
import { PageLoader } from "../components/common/Loader";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { TeamFormModal } from "../components/admin/TeamFormModal";
import { teamService } from "../services/teamService";
import { Team } from "../types";
import { formatCurrency, resolveUploadUrl, teamGradientStyle } from "../utils/helpers";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" },
  }),
};

export function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  function load() {
    setIsLoading(true);
    teamService
      .getAll()
      .then(setTeams)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load teams"))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  function handleSaved(team: Team) {
    setTeams((prev) => {
      const exists = prev.some((t) => t._id === team._id);
      return exists ? prev.map((t) => (t._id === team._id ? team : t)) : [...prev, team];
    });
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Team Management</p>
          <h1 className="text-2xl font-semibold text-ivory sm:text-3xl">Teams</h1>
          <p className="mt-1 text-sm text-ivory/50">Budget, squad, and purchase history for every franchise.</p>
        </div>
        <Button
          onClick={() => {
            setEditingTeam(null);
            setFormOpen(true);
          }}
        >
          <Icon name="shield" className="h-4 w-4" />
          Add Team
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">Could not load teams: {error}</p>
        </div>
      )}

      {!error && teams.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-navy-800/60 p-8 text-center">
          <p className="text-sm text-ivory/50">No franchises yet. Add the first one to get started.</p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {teams.map((team, i) => {
          const spentPct = team.purseTotal > 0 ? Math.round(((team.purseTotal - team.purseRemaining) / team.purseTotal) * 100) : 0;
          const logo = resolveUploadUrl(team.logoUrl);
          const soldPrices = team.players.map((p) => p.soldPrice ?? 0).filter((n) => n > 0);
          const avgPrice = soldPrices.length ? Math.round(soldPrices.reduce((a, b) => a + b, 0) / soldPrices.length) : 0;
          const highestPurchase = soldPrices.length ? Math.max(...soldPrices) : 0;

          return (
            <motion.div
              key={team._id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="overflow-hidden rounded-2xl border border-white/10 bg-navy-800/60 shadow-inner-line backdrop-blur-sm transition-shadow duration-300 hover:shadow-gold-lg"
            >
              <div className="relative h-20" style={teamGradientStyle(team.color)}>
                <div className="absolute inset-0 bg-navy-950/10" />
                <div className="absolute -bottom-7 left-5">
                  <div
                    className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl font-display text-lg font-bold text-white ring-4 ring-navy-800"
                    style={logo ? { backgroundImage: `url(${logo})`, backgroundSize: "cover", backgroundPosition: "center" } : teamGradientStyle(team.color)}
                  >
                    {!logo && team.shortName}
                  </div>
                </div>
                <div className="absolute right-3 top-3 flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingTeam(team);
                      setFormOpen(true);
                    }}
                    aria-label={`Edit ${team.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/30 text-white/80 backdrop-blur-sm hover:bg-black/50 hover:text-white"
                  >
                    <Icon name="settings" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingTeam(team)}
                    aria-label={`Delete ${team.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/30 text-white/80 backdrop-blur-sm hover:bg-red-500/60 hover:text-white"
                  >
                    <Icon name="x" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-5 pt-10">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="truncate font-display text-lg font-semibold text-ivory">{team.name}</h3>
                  <Badge tone="neutral">
                    {team.players.length}/{team.maxPlayers}
                  </Badge>
                </div>
                <p className="text-xs text-ivory/50">Owned by {team.owner}</p>

                <div className="mt-5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-ivory/50">
                    <span>Budget used</span>
                    <span className="led-digit text-xs">
                      {formatCurrency(team.purseTotal - team.purseRemaining)} / {formatCurrency(team.purseTotal)}
                    </span>
                  </div>
                  <ProgressBar value={spentPct} gradient="from-gold-500 to-amber-400" delay={i * 0.05} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-white/[0.02] px-2 py-2">
                    <p className="led-digit text-sm">{formatCurrency(avgPrice)}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ivory/40">Avg Price</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.02] px-2 py-2">
                    <p className="led-digit text-sm">{formatCurrency(highestPurchase)}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ivory/40">Highest Purchase</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {team.players.slice(0, 5).map((p) => (
                      <Avatar key={p._id} name={p.name} size="sm" className="ring-2 ring-navy-800" />
                    ))}
                    {team.players.length > 5 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-[10px] font-semibold text-ivory/60 ring-2 ring-navy-800">
                        +{team.players.length - 5}
                      </div>
                    )}
                    {team.players.length === 0 && <span className="text-xs text-ivory/30">No players yet</span>}
                  </div>

                  <Link to={`/dashboard/teams/${team._id}`} className="flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300">
                    Full roster
                    <Icon name="arrow-right" className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <TeamFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSaved} team={editingTeam} />

      <ConfirmDialog
        open={!!deletingTeam}
        onClose={() => setDeletingTeam(null)}
        title={`Delete ${deletingTeam?.name ?? "team"}?`}
        description="This cannot be undone. Teams with players on their roster can't be deleted."
        confirmLabel="Delete team"
        onConfirm={async () => {
          if (!deletingTeam) return;
          await teamService.remove(deletingTeam._id);
          setTeams((prev) => prev.filter((t) => t._id !== deletingTeam._id));
        }}
      />
    </div>
  );
}
