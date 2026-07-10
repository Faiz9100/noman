import { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";
import { playerService } from "../../services/playerService";
import { BulkPhotoResult } from "../../types";

interface BulkPhotoModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

/**
 * Lets an admin drop in a folder of photos at once instead of editing every
 * player one at a time. Each file is matched to a player by name (the
 * filename minus its extension, e.g. "Jamil Shaikh.jpg" matches player
 * "Jamil Shaikh") — see bulkUploadPhotos on the server for the exact rule.
 */
export function BulkPhotoModal({ open, onClose, onUploaded }: BulkPhotoModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<BulkPhotoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleClose() {
    setFiles([]);
    setResult(null);
    setError(null);
    onClose();
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await playerService.bulkUploadPhotos(files);
      setResult(res);
      if (res.matched.length > 0) onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Bulk Upload Photos" description="Match photos to players by filename.">
      <div className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-ivory/50">
          <p className="mb-1 font-medium text-ivory/70">How matching works</p>
          <p>
            Name each file after the player it belongs to — e.g. <code className="text-gold-400/80">Jamil Shaikh.jpg</code>{" "}
            matches a player named "Jamil Shaikh". Spacing, casing, and punctuation are ignored. A file with no matching
            player, or matching more than one, is skipped and listed below.
          </p>
        </div>

        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={(e) => {
            setFiles(Array.from(e.target.files ?? []));
            setResult(null);
            setError(null);
          }}
          className="block w-full text-xs text-ivory/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-ivory hover:file:bg-white/20"
        />

        {files.length > 0 && !result && (
          <p className="text-xs text-ivory/40">{files.length} file{files.length === 1 ? "" : "s"} selected</p>
        )}

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

        {result && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm">
            <p className="flex items-center gap-2 text-emerald-400">
              <Icon name="check" className="h-4 w-4" />
              Matched {result.matched.length} of {result.matched.length + result.unmatched.length} photos
            </p>
            {result.unmatched.length > 0 && (
              <div className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-red-400/80">
                {result.unmatched.map((u, i) => (
                  <p key={i}>
                    {u.fileName}: {u.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <Button onClick={handleUpload} disabled={files.length === 0} isLoading={busy} className="w-full">
          <Icon name="external-link" className="h-4 w-4" />
          Upload &amp; Match
        </Button>
      </div>
    </Modal>
  );
}
