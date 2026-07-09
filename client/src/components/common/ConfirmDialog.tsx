import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Icon } from "./Icon";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "danger",
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={
            tone === "danger"
              ? "mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-400"
              : "mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 text-gold-400"
          }
        >
          <Icon name={tone === "danger" ? "x" : "check"} className="h-5 w-5" />
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <div className="flex w-full gap-3">
          <Button variant="ghost" className="flex-1 border border-white/10" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} className="flex-1" onClick={handleConfirm} isLoading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
