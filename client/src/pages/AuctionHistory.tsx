import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { PlayerPhoto } from "../components/common/PlayerPhoto";
import { StatCard } from "../components/common/StatCard";
import { Button } from "../components/common/Button";
import { Icon } from "../components/common/Icon";
import { PageLoader } from "../components/common/Loader";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { cn, formatCurrency } from "../utils/helpers";
import { historyService } from "../services/historyService";
import { teamService } from "../services/teamService";
import { AuctionHistoryEntry, Team } from "../types";

type SortKey = "recent" | "oldest" | "price-high" | "price-low" | "name";
type StatusFilter = "All" | "Sold" | "Unsold";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Most recent" },
  { value: "oldest", label: "Oldest first" },
  { value: "price-high", label: "Price: high to low" },
  { value: "price-low", label: "Price: low to high" },
  { value: "name", label: "Player name" },
];

export function AuctionHistory() {
  const [history, setHistory] = useState<AuctionHistoryEntry[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<string | "All">("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [exporting, setExporting] = useState(false);
  const [undoing, setUndoing] = useState<AuctionHistoryEntry | null>(null);

  function load() {
    setIsLoading(true);
    Promise.all([historyService.getAll(), teamService.getAll()])
      .then(([h, t]) => {
        setHistory(h);
        setTeams(t);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load auction history"))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    let rows = history;
    if (teamFilter !== "All") rows = rows.filter((e) => e.team?._id === teamFilter);
    if (statusFilter !== "All") rows = rows.filter((e) => e.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((e) => e.player.name.toLowerCase().includes(q));
    }

    const sorted = [...rows];
    switch (sort) {
      case "recent":
        sorted.sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.soldAt).getTime() - new Date(b.soldAt).getTime());
        break;
      case "price-high":
        sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "price-low":
        sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "name":
        sorted.sort((a, b) => a.player.name.localeCompare(b.player.name));
        break;
    }
    return sorted;
  }, [history, teamFilter, statusFilter, search, sort]);

  const sold = history.filter((e) => e.status === "Sold");
  const totalSpent = sold.reduce((sum, e) => sum + (e.price ?? 0), 0);
  const highest = [...sold].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0];
  const avg = sold.length ? Math.round(totalSpent / sold.length) : 0;

  async function handleExport() {
    setExporting(true);
    try {
      await historyService.exportCsv();
    } catch {
      setError("Could not export results");
    } finally {
      setExporting(false);
    }
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Sold Ledger</p>
          <h1 className="text-2xl font-semibold text-ivory sm:text-3xl">Auction History</h1>
          <p className="mt-1 text-sm text-ivory/50">Every resolved lot of the night, searchable and sortable.</p>
        </div>
        <Button variant="outline" onClick={handleExport} isLoading={exporting}>
          <Icon name="external-link" className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="check" label="Total Sold" value={sold.length} accent="from-emerald-500/25 to-teal-500/5 text-emerald-400" index={0} />
        <StatCard icon="wallet" label="Total Spent" value={totalSpent} format={formatCurrency} accent="from-sky-500/25 to-blue-500/5 text-sky-400" index={1} />
        <StatCard icon="trophy" label="Highest Sale" value={highest?.price ?? 0} format={formatCurrency} subtitle={highest?.player.name} accent="from-gold-500/25 to-amber-500/5 text-gold-400" index={2} />
        <StatCard icon="gauge" label="Average Sale" value={avg} format={formatCurrency} accent="from-violet-500/25 to-purple-500/5 text-violet-400" index={3} />
      </div>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by player name..."
                className="w-full rounded-lg border border-white/10 bg-navy-900 py-2.5 pl-10 pr-4 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold-500"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-white/10 bg-navy-900 px-3.5 py-2.5 text-sm text-ivory focus:border-gold-500 sm:w-56"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort: {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Icon name="filter" className="h-3.5 w-3.5 text-ivory/30" />
            {(["All", "Sold", "Unsold"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === s ? "border-gold-500/40 bg-gold-500/15 text-gold-400" : "border-white/10 text-ivory/50 hover:text-ivory"
                )}
              >
                {s}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-white/10" />
            <button
              onClick={() => setTeamFilter("All")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                teamFilter === "All" ? "border-gold-500/40 bg-gold-500/15 text-gold-400" : "border-white/10 text-ivory/50 hover:text-ivory"
              )}
            >
              All teams
            </button>
            {teams.map((t) => (
              <button
                key={t._id}
                onClick={() => setTeamFilter(t._id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  teamFilter === t._id ? "border-gold-500/40 bg-gold-500/15 text-gold-400" : "border-white/10 text-ivory/50 hover:text-ivory"
                )}
              >
                {t.shortName}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-navy-800 text-xs uppercase tracking-wide text-ivory/50">
              <tr>
                <th className="px-5 py-3 font-medium">Round</th>
                <th className="px-5 py-3 font-medium">Player</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Team</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((entry, i) => (
                <motion.tr
                  key={entry._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i, 10) * 0.03 }}
                  className="group transition-colors hover:bg-white/5"
                >
                  <td className="px-5 py-3 text-ivory/50">R{entry.round}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <PlayerPhoto name={entry.player.name} photoUrl={entry.player.photoUrl} size="sm" />
                      <div>
                        <p className="font-medium text-ivory">{entry.player.name}</p>
                        <p className="text-xs text-ivory/40">{entry.player.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={entry.status === "Sold" ? "success" : "danger"}>{entry.status}</Badge>
                  </td>
                  <td className="px-5 py-3">{entry.team ? <Badge tone="neutral">{entry.team.shortName}</Badge> : <span className="text-ivory/30">—</span>}</td>
                  <td className="px-5 py-3 led-digit">{entry.price ? formatCurrency(entry.price) : "—"}</td>
                  <td className="px-5 py-3 text-ivory/40">
                    {new Date(entry.soldAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setUndoing(entry)}
                      className="text-xs font-medium text-ivory/30 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                    >
                      Undo
                    </button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-ivory/40">
                    No results match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={!!undoing}
        onClose={() => setUndoing(null)}
        title={`Undo ${undoing?.player.name}'s result?`}
        description="The player returns to Available and any purse spent is refunded."
        confirmLabel="Undo"
        onConfirm={async () => {
          if (!undoing) return;
          await historyService.undo(undoing._id);
          load();
        }}
      />
    </div>
  );
}
