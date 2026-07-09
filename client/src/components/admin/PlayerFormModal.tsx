import { FormEvent, useEffect, useRef, useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { playerService } from "../../services/playerService";
import { Player, PlayerRole } from "../../types";
import { PLAYER_ROLES, ALLOWED_IMAGE_TYPES, MAX_UPLOAD_SIZE_MB } from "../../utils/constants";
import { formatCurrency, resolveUploadUrl } from "../../utils/helpers";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-navy-900 px-3.5 py-2.5 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold-500";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-ivory/50";

interface PlayerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (player: Player) => void;
  player?: Player | null;
}

export function PlayerFormModal({ open, onClose, onSaved, player }: PlayerFormModalProps) {
  const isEdit = Boolean(player);

  const [name, setName] = useState(player?.name ?? "");
  const [role, setRole] = useState<PlayerRole>(player?.role ?? "Batsman");
  const [country, setCountry] = useState(player?.country ?? "");
  const [age, setAge] = useState(player?.age?.toString() ?? "");
  const [battingStyle, setBattingStyle] = useState(player?.battingStyle ?? "");
  const [bowlingStyle, setBowlingStyle] = useState(player?.bowlingStyle ?? "");
  // Plain number input — no dropdown, no min/max, the admin types any figure.
  const [basePrice, setBasePrice] = useState(player?.basePrice?.toString() ?? "");
  const [matches, setMatches] = useState(player?.stats?.matches?.toString() ?? "");
  const [runs, setRuns] = useState(player?.stats?.runs?.toString() ?? "");
  const [wickets, setWickets] = useState(player?.stats?.wickets?.toString() ?? "");
  const [strikeRate, setStrikeRate] = useState(player?.stats?.strikeRate?.toString() ?? "");
  const [economy, setEconomy] = useState(player?.stats?.economy?.toString() ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(resolveUploadUrl(player?.photoUrl));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Tracks the blob: URL created for the in-progress file pick so it can be
  // revoked on replacement/unmount — otherwise every picked photo leaks its
  // object URL for the lifetime of the tab.
  const blobUrlRef = useRef<string | null>(null);

  function revokePendingBlobUrl() {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }

  // The modal instance is never unmounted between edits, so the fields must be
  // re-synced from `player` every time it opens — otherwise a stale player's
  // data (or blank "add" state) lingers when switching to a different one.
  useEffect(() => {
    if (!open) return;
    setName(player?.name ?? "");
    setRole(player?.role ?? "Batsman");
    setCountry(player?.country ?? "");
    setAge(player?.age?.toString() ?? "");
    setBattingStyle(player?.battingStyle ?? "");
    setBowlingStyle(player?.bowlingStyle ?? "");
    setBasePrice(player?.basePrice?.toString() ?? "");
    setMatches(player?.stats?.matches?.toString() ?? "");
    setRuns(player?.stats?.runs?.toString() ?? "");
    setWickets(player?.stats?.wickets?.toString() ?? "");
    setStrikeRate(player?.stats?.strikeRate?.toString() ?? "");
    setEconomy(player?.stats?.economy?.toString() ?? "");
    setPhotoFile(null);
    revokePendingBlobUrl();
    setPhotoPreview(resolveUploadUrl(player?.photoUrl));
    setError(null);
  }, [open, player]);

  // Revoke on unmount too, in case the modal is torn down mid-edit.
  useEffect(() => () => revokePendingBlobUrl(), []);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be re-selected after a validation error
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      setError("Unsupported file type — please upload a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      setError(`Image is too large — the maximum allowed size is ${MAX_UPLOAD_SIZE_MB}MB.`);
      return;
    }

    revokePendingBlobUrl();
    const objectUrl = URL.createObjectURL(file);
    blobUrlRef.current = objectUrl;

    setError(null);
    setPhotoFile(file);
    setPhotoPreview(objectUrl);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (basePrice.trim() !== "" && Number.isNaN(Number(basePrice))) {
      setError("Base price must be a number.");
      return;
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("role", role);
      form.append("country", country);
      if (age) form.append("age", age);
      if (battingStyle) form.append("battingStyle", battingStyle);
      if (bowlingStyle) form.append("bowlingStyle", bowlingStyle);
      form.append("basePrice", basePrice);

      const stats: Record<string, number> = {};
      if (matches) stats.matches = Number(matches);
      if (runs) stats.runs = Number(runs);
      if (wickets) stats.wickets = Number(wickets);
      if (strikeRate) stats.strikeRate = Number(strikeRate);
      if (economy) stats.economy = Number(economy);
      // multipart/form-data has no nested-object convention, so the stats
      // object travels as one JSON string field — the backend parses it back.
      form.append("stats", JSON.stringify(stats));

      if (photoFile) form.append("photo", photoFile);

      const saved = isEdit ? await playerService.update(player!._id, form) : await playerService.create(form);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the player");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Player" : "Add Player"} description="Auction pool entry." maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-navy-900 bg-cover bg-center"
            style={photoPreview ? { backgroundImage: `url(${photoPreview})` } : undefined}
          >
            {!photoPreview && <span className="text-[10px] text-ivory/30">No photo</span>}
          </div>
          <label className="flex-1">
            <span className={labelClass}>Player photo</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoChange} className="block w-full text-xs text-ivory/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-ivory hover:file:bg-white/20" />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Player name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Arjun Mehta" />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select value={role} onChange={(e) => setRole(e.target.value as PlayerRole)} className={inputClass}>
              {PLAYER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} placeholder="India" />
          </div>
          <div>
            <label className={labelClass}>Age</label>
            <input type="number" min={0} max={70} value={age} onChange={(e) => setAge(e.target.value)} className={inputClass} placeholder="27" />
          </div>
          <div>
            <label className={labelClass}>Batting Style</label>
            <input value={battingStyle} onChange={(e) => setBattingStyle(e.target.value)} className={inputClass} placeholder="Right-hand bat" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Bowling Style</label>
            <input value={bowlingStyle} onChange={(e) => setBowlingStyle(e.target.value)} className={inputClass} placeholder="Right-arm fast, or leave blank" />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>
              Base Price {basePrice && !Number.isNaN(Number(basePrice)) ? `— ${formatCurrency(Number(basePrice))}` : ""}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className={inputClass}
              placeholder="e.g. 500, 12500, 250000, 999999 — any number"
            />
            <p className="mt-1 text-xs text-ivory/40">No minimum, no maximum, no preset values — type any amount.</p>
          </div>

          <div className="seam-divider my-1 sm:col-span-2" />

          <div>
            <label className={labelClass}>Matches</label>
            <input type="number" min={0} value={matches} onChange={(e) => setMatches(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Runs</label>
            <input type="number" min={0} value={runs} onChange={(e) => setRuns(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Wickets</label>
            <input type="number" min={0} value={wickets} onChange={(e) => setWickets(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Strike Rate</label>
            <input type="number" min={0} step={0.01} value={strikeRate} onChange={(e) => setStrikeRate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Economy</label>
            <input type="number" min={0} step={0.01} value={economy} onChange={(e) => setEconomy(e.target.value)} className={inputClass} />
          </div>
        </div>

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

        <Button type="submit" isLoading={saving} className="w-full">
          {isEdit ? "Save changes" : "Add player"}
        </Button>
      </form>
    </Modal>
  );
}
