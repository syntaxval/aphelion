import { useEffect, useRef } from "preact/hooks";
import { IconCopy } from "../lib/icons";

interface KeyDialogProps {
  title: string;
  subtitle?: string;
  value: string | null;
  isSecret?: boolean;
  copied?: boolean;
  onCopy: () => void;
  onClose: () => void;
}

export function KeyDialog({
  title,
  subtitle,
  value,
  isSecret,
  copied,
  onCopy,
  onClose,
}: KeyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (value && !dialog.open) {
      dialog.showModal();
    } else if (!value && dialog.open) {
      dialog.close();
    }
  }, [value]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = "";
      onClose();
    };
    dialog.addEventListener("close", handleClose);

    let cleanupOutside: (() => void) | undefined;
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      const onDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e);
      };
      const onUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e) && dialog.open) {
          dialog.close();
        }
      };
      dialog.addEventListener("pointerdown", onDown);
      dialog.addEventListener("pointerup", onUp);
      cleanupOutside = () => {
        dialog.removeEventListener("pointerdown", onDown);
        dialog.removeEventListener("pointerup", onUp);
      };
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      cleanupOutside?.();
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      class="aphelion-dialog"
      aria-labelledby="key-dialog-title"
      {...({ closedby: "any" } as Record<string, string>)}
    >
      <div class="dialog-header">
        <div>
          <h1 id="key-dialog-title" class="dialog-title">
            {title}
          </h1>
          {subtitle && (
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              {subtitle}
            </div>
          )}
        </div>
        <form method="dialog">
          <button type="submit" class="btn btn-sm" autofocus>
            Close
          </button>
        </form>
      </div>

      {isSecret && (
        <div class="banner banner-danger" style={{ marginBottom: "0.85rem" }}>
          <div>
            <strong>Sensitive Secret Key:</strong> Anyone who sees or copies this key gains full control of this account.
          </div>
        </div>
      )}

      {value && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.92rem",
            lineHeight: 1.6,
            wordBreak: "break-all",
            background: "var(--bg-input)",
            padding: "0.9rem 1rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-strong)",
            marginBottom: "1rem",
            letterSpacing: "0.03em",
          }}
        >
          {value}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" class="btn btn-primary" onClick={onCopy}>
          <IconCopy copied={copied} /> {copied ? "Copied" : isSecret ? "Copy Secret Key" : "Copy Public Key"}
        </button>
      </div>
    </dialog>
  );
}
