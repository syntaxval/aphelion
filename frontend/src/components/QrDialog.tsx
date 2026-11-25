import { useEffect, useMemo, useRef } from "preact/hooks";
import { encodeQrMatrix, qrToSvgPath } from "../lib/qr";

interface QrDialogProps {
  title: string;
  subtitle?: string;
  value: string | null;
  isSecret?: boolean;
  onClose: () => void;
}

export function QrDialog({ title, subtitle, value, isSecret, onClose }: QrDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const svgData = useMemo(() => {
    if (!value) return null;
    try {
      const matrix = encodeQrMatrix(value);
      return qrToSvgPath(matrix, 4);
    } catch {
      return null;
    }
  }, [value]);

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

    // Fallback light-dismiss for browsers without native closedby="any" (e.g. Safari)
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
      aria-labelledby="qr-dialog-title"
      {...({ closedby: "any" } as Record<string, string>)}
    >
      <div class="dialog-header">
        <div>
          <h1 id="qr-dialog-title" class="dialog-title">
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
          <strong>Sensitive Secret Key:</strong> Anyone who scans or photographs this QR code gains full control of this account.
        </div>
      )}

      {svgData ? (
        <div class="qr-frame">
          <svg
            viewBox={`0 0 ${svgData.viewBoxSize} ${svgData.viewBoxSize}`}
            role="img"
            aria-label={`${title} QR Code`}
            shape-rendering="crispEdges"
          >
            <rect width={svgData.viewBoxSize} height={svgData.viewBoxSize} fill="#ffffff" />
            <path d={svgData.d} fill="#071324" />
          </svg>
        </div>
      ) : (
        <p style={{ color: "var(--text-secondary)" }}>Unable to encode QR payload.</p>
      )}

      {value && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.78rem",
            wordBreak: "break-all",
            background: "var(--bg-input)",
            padding: "0.65rem 0.8rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)",
            marginTop: "0.75rem",
          }}
        >
          {value}
        </div>
      )}
    </dialog>
  );
}
