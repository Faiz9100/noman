import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { PlayerPhoto } from "../components/common/PlayerPhoto";
import { Icon } from "../components/common/Icon";
import { Button } from "../components/common/Button";
import { PageLoader } from "../components/common/Loader";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { PlayerFormModal } from "../components/admin/PlayerFormModal";
import { CsvImportModal } from "../components/admin/CsvImportModal";
import { cn, formatCurrency } from "../utils/helpers";
import { playerService } from "../services/playerService";
import { PLAYER_ROLES, PLAYER_STATUSES } from "../utils/constants";
import { Player, PlayerRole, PlayerStatus } from "../types";

const statusTone = {
  Available: "gold",
  Sold: "success",
  Unsold: "danger",
} as const;

type RoleFilter = PlayerRole | "All";
type StatusFilter = PlayerStatus | "All";

export function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("All");
  const [status, setStatus] = useState<StatusFilter>("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  function load() {
    setIsLoading(true);
    playerService
      .getAll()
      .then(setPlayers)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load players"))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesRole = role === "All" || p.role === role;
      const matchesStatus = status === "All" || p.status === status;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [players, search, role, status]);

  function handleSaved(player: Player) {
    setPlayers((prev) => {
      const exists = prev.some((p) => p._id === player._id);
      return exists ? prev.map((p) => (p._id === player._id ? player : p)) : [...prev, player];
    });
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Player Management</p>
          <h1 className="text-2xl font-semibold text-ivory sm:text-3xl">Players</h1>
          <p className="mt-1 text-sm text-ivory/50">
            {players.length} players registered &middot; {filtered.length} shown
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Icon name="external-link" className="h-4 w-4" />
            Import CSV
          </Button>
          <Button
            onClick={() => {
              setEditingPlayer(null);
              setFormOpen(true);
            }}
          >
            <Icon name="user" className="h-4 w-4" />
            Add Player
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-400">Could not load players: {error}</p>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players by name..."
              className="w-full rounded-lg border border-white/10 bg-navy-900 py-2.5 pl-10 pr-4 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Icon name="filter" className="h-3.5 w-3.5 text-ivory/30" />
            {(["All", ...PLAYER_ROLES] as RoleFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  role === r ? "border-gold-500/40 bg-gold-500/15 text-gold-400" : "border-white/10 text-ivory/50 hover:text-ivory"
                )}
              >
                {r}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-white/10" />
            {(["All", ...PLAYER_STATUSES] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  status === s ? "border-gold-500/40 bg-gold-500/15 text-gold-400" : "border-white/10 text-ivory/50 hover:text-ivory"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-ivory/50">No players match these filters.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((player, i) => (
            <motion.div
              key={player._id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.03 }}
              whileHover={{ y: -3 }}
              className="group relative rounded-2xl border border-white/10 bg-navy-800/60 p-5 shadow-inner-line backdrop-blur-sm transition-shadow hover:shadow-gold"
            >
              <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  onClick={() => {
                    setEditingPlayer(player);
                    setFormOpen(true);
                  }}
                  aria-label={`Edit ${player.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-950/80 text-ivory/70 backdrop-blur-sm hover:text-ivory"
                >
                  <Icon name="settings" className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeletingPlayer(player)}
                  aria-label={`Delete ${player.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-950/80 text-ivory/70 backdrop-blur-sm hover:bg-red-500/60 hover:text-white"
                >
                  <Icon name="x" className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mb-4 flex items-start justify-between">
                <PlayerPhoto name={player.name} photoUrl={player.photoUrl} size="lg" />
                <Badge tone={statusTone[player.status]}>{player.status}</Badge>
              </div>

              <h3 className="truncate pr-14 font-display text-base font-semibold text-ivory">{player.name}</h3>
              <p className="text-xs text-ivory/50">
                {player.role} &middot; {player.country}
                {player.age ? ` · ${player.age}y` : ""}
              </p>
              {(player.battingStyle || player.bowlingStyle) && (
                <p className="mb-1 mt-0.5 truncate text-[11px] text-ivory/35">
                  {[player.battingStyle, player.bowlingStyle].filter(Boolean).join(" · ")}
                </p>
              )}

              <div className="mb-3 mt-2 flex flex-wrap gap-1.5 text-[11px] text-ivory/40">
                {player.stats?.matches !== undefined && <span className="rounded bg-white/5 px-1.5 py-0.5">{player.stats.matches} M</span>}
                {player.stats?.runs !== undefined && <span className="rounded bg-white/5 px-1.5 py-0.5">{player.stats.runs} runs</span>}
                {player.stats?.wickets !== undefined && <span className="rounded bg-white/5 px-1.5 py-0.5">{player.stats.wickets} wkts</span>}
                {player.stats?.average !== undefined && <span className="rounded bg-white/5 px-1.5 py-0.5">avg {player.stats.average}</span>}
                {player.stats?.strikeRate !== undefined && <span className="rounded bg-white/5 px-1.5 py-0.5">SR {player.stats.strikeRate}</span>}
                {player.stats?.economy !== undefined && <span className="rounded bg-white/5 px-1.5 py-0.5">Econ {player.stats.economy}</span>}
              </div>

              <div className="seam-divider mb-3" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-ivory/40">
                    {player.status === "Sold" ? "Sold for" : "Base price"}
                  </p>
                  <p className="led-digit text-base">
                    {formatCurrency(player.status === "Sold" ? player.soldPrice ?? 0 : player.basePrice)}
                  </p>
                </div>
                {player.team && <Badge tone="neutral">{player.team.shortName}</Badge>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <PlayerFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSaved} player={editingPlayer} />
      <CsvImportModal open={importOpen} onClose={() => setImportOpen(false)} onImported={load} />

      <ConfirmDialog
        open={!!deletingPlayer}
        onClose={() => setDeletingPlayer(null)}
        title={`Delete ${deletingPlayer?.name ?? "player"}?`}
        description="This cannot be undone. Sold players can't be deleted — undo the sale from Auction History first."
        confirmLabel="Delete player"
        onConfirm={async () => {
          if (!deletingPlayer) return;
          await playerService.remove(deletingPlayer._id);
          setPlayers((prev) => prev.filter((p) => p._id !== deletingPlayer._id));
        }}
      />
    </div>
  );
}
