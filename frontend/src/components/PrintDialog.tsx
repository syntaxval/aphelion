import { useEffect, useRef } from "preact/hooks";
import { IconPrint } from "../lib/icons";

interface PrintDialogProps {
  open: boolean;
  includeSecretOnPaper: boolean;
  hasPassphrase: boolean;
  onToggleSecret: (next: boolean) => void;
  onClose: () => void;
  onConfirmPrint: () => void;
}

export function PrintDialog({
  open,
  includeSecretOnPaper,
  hasPassphrase,
  onToggleSecret,
  onClose,
  onConfirmPrint,
}: PrintDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      dialog.returnValue = "";
      onClose();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      class="aphelion-dialog"
      aria-labelledby="print-dialog-title"
      {...({ closedby: "any" } as Record<string, string>)}
    >
      <div class="dialog-header">
        <h1 id="print-dialog-title" class="dialog-title">
          Paper wallet print options
        </h1>
        <form method="dialog">
          <button type="submit" class="btn btn-sm" autofocus>
            Cancel
          </button>
        </form>
      </div>

      <p style={{ marginTop: 0, fontSize: "0.88rem", color: "var(--text-secondary)" }}>
        Generates a high-contrast black-and-white sheet containing your numbered recovery phrase and Account #0 Public Key QR code.
      </p>

      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.6rem",
          padding: "0.75rem",
          borderRadius: "var(--radius-sm)",
          background: "var(--bg-input)",
          border: "1px solid var(--border-subtle)",
          marginBottom: "0.9rem",
          cursor: "pointer",
          fontSize: "0.86rem",
        }}
      >
        <input
          type="checkbox"
          checked={includeSecretOnPaper}
          onChange={(e) => onToggleSecret((e.target as HTMLInputElement).checked)}
          style={{ marginTop: "0.2rem" }}
        />
        <span>
          <strong>Also print Account #0 Secret Key (S...) &amp; QR</strong>
          <br />
          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            Optional. Your 12 or 24-word mnemonic already derives all accounts.
          </span>
        </span>
      </label>

      {hasPassphrase && (
        <div class="banner banner-warn" style={{ marginBottom: "0.9rem" }}>
          Your BIP39 passphrase is <strong>never printed</strong> on the sheet. Store it separately from your paper backup.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <button type="button" class="btn btn-primary" onClick={onConfirmPrint}>
          <IconPrint /> Print Paper Wallet
        </button>
      </div>
    </dialog>
  );
}
