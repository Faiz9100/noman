import { FormEvent, useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { teamService } from "../../services/teamService";
import { Team } from "../../types";
import { formatCurrency, resolveUploadUrl } from "../../utils/helpers";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-navy-900 px-3.5 py-2.5 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold-500";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-ivory/50";

interface TeamFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (team: Team) => void;
  team?: Team | null;
}

export function TeamFormModal({ open, onClose, onSaved, team }: TeamFormModalProps) {
  const isEdit = Boolean(team);

  const [name, setName] = useState(team?.name ?? "");
  const [shortName, setShortName] = useState(team?.shortName ?? "");
  const [owner, setOwner] = useState(team?.owner ?? "");
  // Plain number input — no dropdown, no min/max, the admin types any figure.
  const [purseTotal, setPurseTotal] = useState(team?.purseTotal?.toString() ?? "");
  const [maxPlayers, setMaxPlayers] = useState(team?.maxPlayers?.toString() ?? "25");
  const [color, setColor] = useState(team?.color ?? "#D4AF37");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(resolveUploadUrl(team?.logoUrl));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (purseTotal.trim() === "" || Number.isNaN(Number(purseTotal))) {
      setError("Enter a budget — any number is fine.");
      return;
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("shortName", shortName);
      form.append("owner", owner);
      form.append("purseTotal", purseTotal);
      form.append("maxPlayers", maxPlayers || "25");
      form.append("color", color);
      if (!isEdit) form.append("purseRemaining", purseTotal);
      if (logoFile) form.append("logo", logoFile);

      const saved = isEdit ? await teamService.update(team!._id, form) : await teamService.create(form);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the team");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Team" : "Add Team"} description="Franchise identity and budget.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-navy-900 bg-cover bg-center"
            style={logoPreview ? { backgroundImage: `url(${logoPreview})` } : undefined}
          >
            {!logoPreview && <span className="text-[10px] text-ivory/30">No logo</span>}
          </div>
          <label className="flex-1">
            <span className={labelClass}>Team logo</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} className="block w-full text-xs text-ivory/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-ivory hover:file:bg-white/20" />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Team name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Coastal Titans" />
          </div>
          <div>
            <label className={labelClass}>Short code</label>
            <input required maxLength={6} value={shortName} onChange={(e) => setShortName(e.target.value.toUpperCase())} className={inputClass} placeholder="TIT" />
          </div>
          <div>
            <label className={labelClass}>Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-[38px] w-12 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-navy-900" />
              <input value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Owner</label>
            <input required value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass} placeholder="A. Sharma" />
          </div>
          <div>
            <label className={labelClass}>
              Budget {purseTotal && !Number.isNaN(Number(purseTotal)) ? `— ${formatCurrency(Number(purseTotal))}` : ""}
            </label>
            <input
              required
              type="number"
              inputMode="numeric"
              value={purseTotal}
              onChange={(e) => setPurseTotal(e.target.value)}
              className={inputClass}
              placeholder="Any amount"
            />
          </div>
          <div>
            <label className={labelClass}>Maximum Players</label>
            <input type="number" min={1} value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} className={inputClass} placeholder="25" />
          </div>
          {isEdit && <p className="-mt-2 text-xs text-ivory/40 sm:col-span-2">Changing the budget does not touch purse already spent.</p>}
        </div>

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

        <Button type="submit" isLoading={saving} className="w-full">
          {isEdit ? "Save changes" : "Add team"}
        </Button>
      </form>
    </Modal>
  );
}
