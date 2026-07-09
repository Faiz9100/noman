import { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";
import { playerService } from "../../services/playerService";
import { CsvImportResult } from "../../types";

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

const SAMPLE_CSV = "name,role,country,basePrice,matches,runs,wickets,average\nArjun Mehta,Batsman,India,10000000,84,3120,,46.2";

export function CsvImportModal({ open, onClose, onImported }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleClose() {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  }

  async function handleImport() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await playerService.importCsv(file);
      setResult(res);
      if (res.createdCount > 0) onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "players-sample.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import Players from CSV" description="Bulk-add the auction pool.">
      <div className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-ivory/50">
          <p className="mb-1 font-medium text-ivory/70">Expected columns</p>
          <code className="text-gold-400/80">name, role, country, basePrice, matches, runs, wickets, average</code>
          <p className="mt-1">Only the first four are required. Role must be Batsman, Bowler, All-Rounder, or Wicket-Keeper.</p>
          <button type="button" onClick={downloadSample} className="mt-2 font-medium text-gold-400 hover:text-gold-300">
            Download a sample file
          </button>
        </div>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
            setError(null);
          }}
          className="block w-full text-xs text-ivory/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-ivory hover:file:bg-white/20"
        />

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

        {result && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm">
            <p className="flex items-center gap-2 text-emerald-400">
              <Icon name="check" className="h-4 w-4" />
              Imported {result.createdCount} of {result.totalRows} rows
            </p>
            {result.errors.length > 0 && (
              <div className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-red-400/80">
                {result.errors.map((e, i) => (
                  <p key={i}>
                    Row {e.row}: {e.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <Button onClick={handleImport} disabled={!file} isLoading={busy} className="w-full">
          <Icon name="external-link" className="h-4 w-4" />
          Import
        </Button>
      </div>
    </Modal>
  );
}
